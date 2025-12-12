import { describe, it, expect } from "vitest";
import { mapTsTypeToDart } from "../src/type-mapper";
import ts from "typescript";

// Helper to fully mock the environment for type-mapper with checker
function createTypeCheckerEnvironment(code: string) {
  const fileName = "test.ts";
  const sourceFile = ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest
  );
  const defaultCompilerHost = ts.createCompilerHost({});

  const customCompilerHost = {
    ...defaultCompilerHost,
    getSourceFile: (name: string, languageVersion: ts.ScriptTarget) => {
      if (name === fileName) return sourceFile;
      return defaultCompilerHost.getSourceFile(name, languageVersion);
    },
    readFile: (name: string) => {
      if (name === fileName) return code;
      return defaultCompilerHost.readFile(name);
    },
    fileExists: (name: string) => {
      if (name === fileName) return true;
      return defaultCompilerHost.fileExists(name);
    },
  };

  const program = ts.createProgram(
    [fileName],
    { noLib: true, strict: true },
    customCompilerHost
  );
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(fileName)!;

  return { sf, checker };
}

function getTypeNodeFromCode(sourceFile: ts.SourceFile): ts.TypeNode {
  // Assumes the code has `type T = ...` or similar as first statement
  const stmt = sourceFile.statements[0];
  if (ts.isTypeAliasDeclaration(stmt)) {
    return stmt.type;
  }
  // Or if it's `const x: T = ...`
  if (ts.isVariableStatement(stmt)) {
    return stmt.declarationList.declarations[0].type!;
  }
  throw new Error("Could not find type node in test definition");
}

describe("type-mapper with checker", () => {
  it("should resolve type aliases via checker", () => {
    const code = `
      type MyString = string;
      type T = MyString;
    `;
    const { sf, checker } = createTypeCheckerEnvironment(code);
    // The type node for 'T' depends on 'MyString'
    // 'T' is the second statement
    const tStmt = sf.statements[1] as ts.TypeAliasDeclaration;
    const result = mapTsTypeToDart(tStmt.type, checker);
    expect(result.dart).toBe("String");
  });

  it("should resolve unions via checker", () => {
    const code = `
      type A = string;
      type B = number;
      type T = A | B;
    `;
    const { sf, checker } = createTypeCheckerEnvironment(code);
    const tStmt = sf.statements[2] as ts.TypeAliasDeclaration;
    const result = mapTsTypeToDart(tStmt.type, checker);
    // string | number -> dynamic
    expect(result.dart).toBe("dynamic");
  });

  it("should resolve single type union via checker", () => {
    const code = `
      type A = string;
      type T = A | undefined;
    `;
    const { sf, checker } = createTypeCheckerEnvironment(code);
    const tStmt = sf.statements[1] as ts.TypeAliasDeclaration;
    const result = mapTsTypeToDart(tStmt.type, checker);
    expect(result.dart).toBe("String");
  });

  it("should resolve string literal union via checker", () => {
    const code = `
       type T = "a" | "b";
     `;
    const { sf, checker } = createTypeCheckerEnvironment(code);
    const tStmt = sf.statements[0] as ts.TypeAliasDeclaration;
    const result = mapTsTypeToDart(tStmt.type, checker);
    expect(result.dart).toBe("String");
  });

  it("should resolve boolean via checker", () => {
    const code = `
      type MyBool = boolean;
      type T = MyBool;
    `;
    const { sf, checker } = createTypeCheckerEnvironment(code);
    const tStmt = sf.statements[1] as ts.TypeAliasDeclaration;
    const result = mapTsTypeToDart(tStmt.type, checker);
    expect(result.dart).toBe("bool");
  });

  it("should resolve number via checker", () => {
    const code = `
      type MyNum = number;
      type T = MyNum;
    `;
    const { sf, checker } = createTypeCheckerEnvironment(code);
    const tStmt = sf.statements[1] as ts.TypeAliasDeclaration;
    const result = mapTsTypeToDart(tStmt.type, checker);
    expect(result.dart).toBe("num");
  });

  it("should resolve qualified names", () => {
    // To cover getEntityName recursion and complex access
    const code = `
      namespace A {
        export namespace B {
           export type C = string;
        }
      }
      type T = A.B.C;
    `;
    // We need map to support this or checker.
    // mapTsTypeToDart uses getEntityName when using typeAliasMap.
    // Let's test getEntityName via mapTsTypeToDart with a map key that matches qualified name.

    // Note: TypeScript might simplify A.B.C to just C if we used checker,
    // but here we want to test getEntityName logic in mapTsTypeToDart when typeAliasMap is present.

    // We can manually construct a node that has a QualifiedName for typeName
    // But harder to do with createSourceFile only.
    // Actually `type T = A.B.C` creates a TypeReferenceNode with typeName as QualifiedName.

    const { sf } = createTypeCheckerEnvironment(code);
    const tStmt = sf.statements[1] as ts.TypeAliasDeclaration;

    const aliasMap = new Map<string, ts.TypeNode>();
    const stringNode = ts.factory.createKeywordTypeNode(
      ts.SyntaxKind.StringKeyword
    );
    aliasMap.set("A.B.C", stringNode); // We assume getEntityName returns dotted path

    const result = mapTsTypeToDart(tStmt.type, undefined, aliasMap);
    expect(result.dart).toBe("String");
  });

  it("should resolve alias to union via checker", () => {
    const code = `
      type MyUnion = string | undefined;
      type T = MyUnion;
    `;
    const { sf, checker } = createTypeCheckerEnvironment(code);
    const tStmt = sf.statements[1] as ts.TypeAliasDeclaration;
    const result = mapTsTypeToDart(tStmt.type, checker);
    expect(result.dart).toBe("String");
  });

  it("should resolve alias to literal union via checker", () => {
    const code = `
      type MyUnion = "a" | "b";
      type T = MyUnion;
    `;
    const { sf, checker } = createTypeCheckerEnvironment(code);
    const tStmt = sf.statements[1] as ts.TypeAliasDeclaration;
    const result = mapTsTypeToDart(tStmt.type, checker);
    expect(result.dart).toBe("String");
  });

  it("should resolve alias to num/bool union via checker", () => {
    // Covers lines 68-78 (num), 80-84 (bool) if we have single type
    const code = `
       type NumUnion = number | undefined;
       type BoolUnion = boolean | null;
       type T1 = NumUnion;
       type T2 = BoolUnion;
     `;
    const { sf, checker } = createTypeCheckerEnvironment(code);

    const t1 = (sf.statements[2] as ts.TypeAliasDeclaration).type;
    expect(mapTsTypeToDart(t1, checker).dart).toBe("num");

    const t2 = (sf.statements[3] as ts.TypeAliasDeclaration).type;
    expect(mapTsTypeToDart(t2, checker).dart).toBe("bool");
  });

  it("should resolve single BooleanLiteral union (true | undefined) via checker", () => {
    // should hit the length === 1 boolean check
    const code = `
        type T = true | undefined;
      `;
    const { sf, checker } = createTypeCheckerEnvironment(code);
    const tStmt = sf.statements[0] as ts.TypeAliasDeclaration;
    expect(mapTsTypeToDart(tStmt.type, checker).dart).toBe("bool");
  });
});
