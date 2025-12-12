import { describe, it, expect } from "vitest";
import {
  parseInitArgsAndFunctions,
  hasSdkDeclaration,
  parseDeclarationFile,
  parseTypeAliasMap,
} from "../../src/ast-parser";
import ts from "typescript";
import fs from "fs";
import path from "path";
import os from "os";

// Helper to fully mock the environment for ast-parser which expects a real Program/TypeChecker
function parseCode(code: string) {
  const fileName = "test.d.ts";
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
    { noLib: true },
    customCompilerHost
  );
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(fileName)!;

  return { sf, checker };
}

describe("ast-parser", () => {
  describe("parseInitArgsAndFunctions", () => {
    it("should parse simple init args and functions", () => {
      const code = `
      declare const _default: Sdk<[string, number], any, {
        hello: <Result = string>(state: any, name: string, id: number) => string;
      }>;
      
      export { _default as default };
    `;

      const { sf, checker } = parseCode(code);
      const typeAliasMap = parseTypeAliasMap(sf);

      const result = parseInitArgsAndFunctions({
        sourceFile: sf,
        checker,
        typeAliasMap,
      });

      expect(result.initArgs).toHaveLength(2);
      expect(result.initArgs[0].type.dart).toBe("String");
      expect(result.initArgs[1].type.dart).toBe("num");

      expect(result.functions).toHaveLength(1);
      const [hello] = result.functions;
      expect(hello.name).toBe("hello");
      expect(hello.args).toHaveLength(1);
      const [name] = hello.args;
      expect(name.name).toBe("name");
      expect(name.type.dart).toBe("String");
      expect(hello.returnType.dart).toBe("String");
    });

    it("should handle named tuples", () => {
      const code = `
      declare const _default: Sdk<[apiKey: string, timeout: number], any, {}>;
      export { _default as default };
    `;

      const { sf, checker } = parseCode(code);
      const typeAliasMap = parseTypeAliasMap(sf);

      const result = parseInitArgsAndFunctions({
        sourceFile: sf,
        checker,
        typeAliasMap,
      });

      expect(result.initArgs).toHaveLength(2);
      expect(result.initArgs[0].name).toBe("apiKey");
      expect(result.initArgs[1].name).toBe("timeout");
    });
  });

  describe("hasSdkDeclaration", () => {
    it("should return true for valid SDK declaration", () => {
      const code = `
        declare const _default: Sdk<[], any, {}>;
        export { _default as default };
      `;
      const { sf } = parseCode(code);
      expect(hasSdkDeclaration(sf)).toBe(true);
    });

    it("should return false for invalid SDK declaration", () => {
      const code = `
        export const foo = 1;
      `;
      const { sf } = parseCode(code);
      expect(hasSdkDeclaration(sf)).toBe(false);
    });
  });

  describe("parseDeclarationFile", () => {
    it("should parse a file from disk", () => {
      // Create a temp file
      const tmpDir = os.tmpdir();
      const filePath = path.join(tmpDir, `test-${Date.now()}.d.ts`);
      const code = `
        type MyType = string;
        declare const _default: Sdk<[MyType], any, {
          foo: <Result = number>(state: any, arg: MyType) => void;
        }>;
        export { _default as default };
      `;
      fs.writeFileSync(filePath, code);

      try {
        const result = parseDeclarationFile(filePath);
        expect(result).not.toBeNull();
        expect(result!.initArgs).toHaveLength(1);
        expect(result!.initArgs[0].type.dart).toBe("String"); // Should resolve alias
        expect(result!.functions).toHaveLength(1);
        expect(result!.functions[0].name).toBe("foo");
        expect(result!.functions[0].returnType.dart).toBe("num");
      } finally {
        fs.unlinkSync(filePath);
      }
    });

    it("should return null for invalid file path", () => {
      expect(() => parseDeclarationFile("/non/existent/path.d.ts")).toThrow();
    });
  });
});
