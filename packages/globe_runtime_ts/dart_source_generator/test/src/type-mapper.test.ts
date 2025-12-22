import { describe, it, expect } from "vitest";
import { mapTsTypeToDart } from "../../src/type-mapper";
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

  it("should map Uint8Array to List<int>", () => {
    // Note: This relies on type reference name matching string "Uint8Array"
    // in the simplified mapper logic.
    expect(mapTsTypeToDart(createTypeNode("Uint8Array")).dart).toBe(
      "List<int>"
    );
  });

  it("should map unknown/void/dynamic", () => {
    expect(mapTsTypeToDart(createTypeNode("any")).dart).toBe("dynamic");
    expect(mapTsTypeToDart(createTypeNode("void")).dart).toBe("void");
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
    aliasMap.set("DartMap", createTypeNode("{ __dartType: 'Map' }"));
    aliasMap.set("DartSet", createTypeNode("{ __dartType: 'Set' }"));
    aliasMap.set("DartList", createTypeNode("{ __dartType: 'List' }"));

    // Direct alias
    expect(
      mapTsTypeToDart(createTypeNode("MyString"), undefined, aliasMap).dart
    ).toBe("String");

    // Recursive alias
    expect(
      mapTsTypeToDart(createTypeNode("Recursive"), undefined, aliasMap).dart
    ).toBe("String");

    // DartMap alias
    expect(
      mapTsTypeToDart(createTypeNode("DartMap"), undefined, aliasMap).dart
    ).toBe("Map<dynamic, dynamic>");

    // DartSet alias
    expect(
      mapTsTypeToDart(createTypeNode("DartSet"), undefined, aliasMap).dart
    ).toBe("Set<dynamic>");

    // DartList alias
    expect(
      mapTsTypeToDart(createTypeNode("DartList"), undefined, aliasMap).dart
    ).toBe("List<dynamic>");
  });

  it("should handle number and boolean literals", () => {
    expect(mapTsTypeToDart(createTypeNode("1")).dart).toBe("num");
    expect(mapTsTypeToDart(createTypeNode("true")).dart).toBe("bool");
  });

  it("should handle unhandled literals (BigInt) as dynamic", () => {
    // BigInt literal "100n"
    expect(mapTsTypeToDart(createTypeNode("100n")).dart).toBe("dynamic");
  });
});
