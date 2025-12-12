import { describe, it, expect } from "vitest";
import { mapTsTypeToDart } from "../src/type-mapper";
import ts from "typescript";

function createTypeNode(code: string): ts.TypeNode {
  const sourceFile = ts.createSourceFile(
    "test.ts",
    `type T = ${code};`,
    ts.ScriptTarget.Latest
  );
  const typeAlias = sourceFile.statements[0] as ts.TypeAliasDeclaration;
  return typeAlias.type;
}

describe("type-mapper", () => {
  it("should map primitive types", () => {
    expect(mapTsTypeToDart(createTypeNode("string")).dart).toBe("String");
    expect(mapTsTypeToDart(createTypeNode("number")).dart).toBe("num");
    expect(mapTsTypeToDart(createTypeNode("boolean")).dart).toBe("bool");
  });

  it("should map String types/literals", () => {
    expect(mapTsTypeToDart(createTypeNode("'hello'")).dart).toBe("String");
  });

  it("should map Uint8Array to Uint8List", () => {
    // Note: This relies on type reference name matching string "Uint8Array"
    // in the simplified mapper logic.
    expect(mapTsTypeToDart(createTypeNode("Uint8Array")).dart).toBe(
      "Uint8List"
    );
  });

  it("should map unknown/void/dynamic", () => {
    expect(mapTsTypeToDart(createTypeNode("any")).dart).toBe("dynamic");
    expect(mapTsTypeToDart(createTypeNode("void")).dart).toBe("dynamic");
    // void usually maps to dynamic in the mapper logic unless specific handling
  });

  it("should handle union types", () => {
    // string | undefined -> String (non-nullable extraction logic)
    expect(mapTsTypeToDart(createTypeNode("string | undefined")).dart).toBe(
      "String"
    );

    // string | null -> String
    expect(mapTsTypeToDart(createTypeNode("string | null")).dart).toBe(
      "String"
    );

    // string | number -> dynamic (fallback)
    expect(mapTsTypeToDart(createTypeNode("string | number")).dart).toBe(
      "dynamic"
    );

    // "a" | "b" -> String (all string literals)
    expect(mapTsTypeToDart(createTypeNode("'a' | 'b'")).dart).toBe("String");

    // "a" | 1 -> dynamic (mixed literals)
    expect(mapTsTypeToDart(createTypeNode("'a' | 1")).dart).toBe("dynamic");
  });

  it("should resolve type aliases", () => {
    const aliasMap = new Map<string, ts.TypeNode>();
    aliasMap.set("MyString", createTypeNode("string"));
    aliasMap.set("MyNumber", createTypeNode("number"));
    aliasMap.set("Recursive", createTypeNode("MyString"));

    // Direct alias
    expect(
      mapTsTypeToDart(createTypeNode("MyString"), undefined, aliasMap).dart
    ).toBe("String");

    // Recursive alias
    expect(
      mapTsTypeToDart(createTypeNode("Recursive"), undefined, aliasMap).dart
    ).toBe("String");
  });

  it("should handle number and boolean literals", () => {
    // Note: The current implementation might fall back to dynamic for number/bool literals
    // if they are not explicitly handled in SyntaxKind switch or if they are in unions.
    // Let's check the code:
    // switch(typeNode.kind) ... LiteralType ... if string literal -> String.
    // It doesn't seem to explicitly handle number/bool literals in the switch,
    // so expected might be dynamic unless I fix/ensure it.
    // However, usually we want literal 1 -> num, true -> bool.
    // Let's see what happens.
    // expect(mapTsTypeToDart(createTypeNode("1")).dart).toBe("num");
    // expect(mapTsTypeToDart(createTypeNode("true")).dart).toBe("bool");

    // Actually the current code returns dynamic:
    // case ts.SyntaxKind.LiteralType: ... if string -> String ... return dynamic;

    // I should update the code to handle these if I want them to succeed,
    // or just assert dynamic for now as per current behavior.
    // The user asked to "check all return types".

    // Let's just verify current behavior first.
    expect(mapTsTypeToDart(createTypeNode("1")).dart).toBe("num");
    expect(mapTsTypeToDart(createTypeNode("true")).dart).toBe("bool"); // true/false keywords are SyntaxKind.TrueKeyword/FalseKeyword?
    // TypeScript `true` is usually SyntaxKind.TrueKeyword (similar to BooleanKeyword logic maybe?)
    // Wait, let's check SyntaxKind.
    // BooleanKeyword covers `boolean`.
    // `true` is TrueKeyword, `false` is FalseKeyword.
    // The switch has `BooleanKeyword`. It does NOT have True/False keywords.
  });

  it("should handle unhandled literals (BigInt) as dynamic", () => {
    // BigInt literal "100n"
    expect(mapTsTypeToDart(createTypeNode("100n")).dart).toBe("dynamic");
  });
});
