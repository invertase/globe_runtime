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
    ts.ScriptTarget.Latest,
    true
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
    it("should parse simple init args and functions with DartReturn", () => {
      const code = `
      declare const _default: Sdk<(arg1: string, arg2: number) => any, {
        hello: (state: any, name: string, callbackId: number) => DartReturn<string>;
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
      expect(hello.dartName).toBe("hello");
      expect(hello.args).toHaveLength(1);
      expect(hello.args[0].name).toBe("name");
      expect(hello.args[0].type.dart).toBe("String");
      expect(hello.returnType.dart).toBe("String");
      expect(hello.isStream).toBe(false);
    });

    it("should parse streaming functions with DartStreamReturn", () => {
      const code = `
      declare const _default: Sdk<() => void, {
        streamData: (state: any, count: number, callbackId: number) => DartStreamReturn<string>;
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

      expect(result.functions).toHaveLength(1);
      const [streamData] = result.functions;
      expect(streamData.name).toBe("streamData");
      expect(streamData.returnType.dart).toBe("String");
      expect(streamData.isStream).toBe(true);
      expect(streamData.args).toHaveLength(1);
      expect(streamData.args[0].name).toBe("count");
      expect(streamData.args[0].type.dart).toBe("num");
    });

    it("should handle multiple functions with mixed return types", () => {
      const code = `
      declare const _default: Sdk<() => void, {
        getString: (state: any, callbackId: number) => DartReturn<string>;
        getNumber: (state: any, callbackId: number) => DartReturn<number>;
        streamStrings: (state: any, callbackId: number) => DartStreamReturn<string>;
        getBoolean: (state: any, callbackId: number) => DartReturn<boolean>;
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

      expect(result.functions).toHaveLength(4);

      expect(result.functions[0].name).toBe("getString");
      expect(result.functions[0].returnType.dart).toBe("String");
      expect(result.functions[0].isStream).toBe(false);

      expect(result.functions[1].name).toBe("getNumber");
      expect(result.functions[1].returnType.dart).toBe("num");
      expect(result.functions[1].isStream).toBe(false);

      expect(result.functions[2].name).toBe("streamStrings");
      expect(result.functions[2].returnType.dart).toBe("String");
      expect(result.functions[2].isStream).toBe(true);

      expect(result.functions[3].name).toBe("getBoolean");
      expect(result.functions[3].returnType.dart).toBe("bool");
      expect(result.functions[3].isStream).toBe(false);
    });

    it("should handle named tuples", () => {
      const code = `
      declare const _default: Sdk<(apiKey: string, timeout: number) => any, {}>;
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

    it("should handle snake_case to camelCase conversion", () => {
      const code = `
      declare const _default: Sdk<(api_key: string) => any, {
        get_user_data: (state: any, user_id: string, callbackId: number) => DartReturn<string>;
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

      expect(result.initArgs[0].name).toBe("apiKey");
      expect(result.functions[0].dartName).toBe("getUserData");
      expect(result.functions[0].args[0].name).toBe("userId");
    });

    it("should handle functions with no arguments (only state and callbackId)", () => {
      const code = `
      declare const _default: Sdk<() => void, {
        noArgs: (state: any, callbackId: number) => DartReturn<string>;
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

      expect(result.functions[0].args).toHaveLength(0);
    });

    it("should handle functions with multiple arguments", () => {
      const code = `
      declare const _default: Sdk<() => void, {
        multipleArgs: (state: any, a: string, b: number, c: boolean, callbackId: number) => DartReturn<string>;
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

      expect(result.functions[0].args).toHaveLength(3);
      expect(result.functions[0].args[0].type.dart).toBe("String");
      expect(result.functions[0].args[1].type.dart).toBe("num");
      expect(result.functions[0].args[2].type.dart).toBe("bool");
    });

    it("should handle void return type", () => {
      const code = `
      declare const _default: Sdk<() => void, {
        doSomething: (state: any, callbackId: number) => void;
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

      expect(result.functions[0].returnType.dart).toBe("void");
      expect(result.functions[0].isStream).toBe(false);
    });

    it("should handle Uint8Array return type", () => {
      const code = `
      declare const _default: Sdk<() => void, {
        getBytes: (state: any, callbackId: number) => DartReturn<Uint8Array>;
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

      expect(result.functions[0].returnType.dart).toBe("List<int>");
    });

    it("should handle DartMap return type", () => {
      const code = `
      declare const _default: Sdk<() => void, {
        getMap: (state: any, callbackId: number) => DartReturn<DartMap>;
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

      expect(result.functions[0].returnType.dart).toBe("Map<dynamic, dynamic>");
      expect(result.functions[0].returnType.ffi).toBe("FFIJsonPayload");
    });

    it("should handle DartList return type", () => {
      const code = `
      declare const _default: Sdk<() => void, {
        getList: (state: any, callbackId: number) => DartReturn<DartList>;
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

      expect(result.functions[0].returnType.dart).toBe("List<dynamic>");
      expect(result.functions[0].returnType.ffi).toBe("FFIJsonPayload");
    });

    it("should handle DartSet return type", () => {
      const code = `
      declare const _default: Sdk<() => void, {
        getSet: (state: any, callbackId: number) => DartReturn<DartSet>;
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

      expect(result.functions[0].returnType.dart).toBe("Set<dynamic>");
      expect(result.functions[0].returnType.ffi).toBe("FFIJsonPayload");
    });

    it("should handle streaming DartMap", () => {
      const code = `
      declare const _default: Sdk<() => void, {
        streamMaps: (state: any, callbackId: number) => DartStreamReturn<DartMap>;
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

      expect(result.functions[0].returnType.dart).toBe("Map<dynamic, dynamic>");
      expect(result.functions[0].returnType.ffi).toBe("FFIJsonPayload");
      expect(result.functions[0].isStream).toBe(true);
    });

    it("should handle streaming DartList", () => {
      const code = `
      declare const _default: Sdk<() => void, {
        streamLists: (state: any, callbackId: number) => DartStreamReturn<DartList>;
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

      expect(result.functions[0].returnType.dart).toBe("List<dynamic>");
      expect(result.functions[0].returnType.ffi).toBe("FFIJsonPayload");
      expect(result.functions[0].isStream).toBe(true);
    });

    it("should handle streaming DartSet", () => {
      const code = `
      declare const _default: Sdk<() => void, {
        streamSets: (state: any, callbackId: number) => DartStreamReturn<DartSet>;
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

      expect(result.functions[0].returnType.dart).toBe("Set<dynamic>");
      expect(result.functions[0].returnType.ffi).toBe("FFIJsonPayload");
      expect(result.functions[0].isStream).toBe(true);
    });

    it("should handle array function return type", () => {
      const code = `
      declare const _default: Sdk<() => void, {
        getArray: (state: any, callbackId: number) => DartReturn<string[]>;
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

      expect(result.functions[0].returnType.dart).toBe("List<String>");
      expect(result.functions[0].isStream).toBe(false);
    });

    it("should handle array function args", () => {
      const code = `
      declare const _default: Sdk<() => void, {
        getArray: (state: any, array: string[], callbackId: number) => DartReturn<string[]>;
      }>;
      export { _default as default };`;

      const { sf, checker } = parseCode(code);
      const typeAliasMap = parseTypeAliasMap(sf);

      const result = parseInitArgsAndFunctions({
        sourceFile: sf,
        checker,
        typeAliasMap,
      });

      expect(result.functions[0].args).toHaveLength(1);
      expect(result.functions[0].args[0].type.dart).toBe("List<String>");
    });

    it("should handle Array<T> generic syntax", () => {
      const code = `
      declare const _default: Sdk<() => void, {
        getNumbers: (state: any, callbackId: number) => DartReturn<Array<number>>;
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

      expect(result.functions[0].returnType.dart).toBe("List<num>");
    });

    it("should handle nested arrays", () => {
      const code = `
      declare const _default: Sdk<() => void, {
        getMatrix: (state: any, callbackId: number) => DartReturn<number[][]>;
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

      expect(result.functions[0].returnType.dart).toBe("List<List<num>>");
    });

    it("should handle streaming arrays", () => {
      const code = `
      declare const _default: Sdk<() => void, {
        streamArrays: (state: any, callbackId: number) => DartStreamReturn<boolean[]>;
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

      expect(result.functions[0].returnType.dart).toBe("List<bool>");
      expect(result.functions[0].isStream).toBe(true);
    });

    it("should resolve type aliases in init args", () => {
      const code = `
      type MyString = string;
      type MyNumber = number;
      declare const _default: Sdk<(arg1: MyString, arg2: MyNumber) => any, {}>;
      export { _default as default };
    `;

      const { sf, checker } = parseCode(code);
      const typeAliasMap = parseTypeAliasMap(sf);

      const result = parseInitArgsAndFunctions({
        sourceFile: sf,
        checker,
        typeAliasMap,
      });

      expect(result.initArgs[0].type.dart).toBe("String");
      expect(result.initArgs[1].type.dart).toBe("num");
    });

    it("should resolve type aliases in function arguments", () => {
      const code = `
      type UserId = string;
      declare const _default: Sdk<() => void, {
        getUser: (state: any, id: UserId, callbackId: number) => DartReturn<string>;
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

      expect(result.functions[0].args[0].type.dart).toBe("String");
    });

    it("should resolve type aliases in return types", () => {
      const code = `
      type ResponseData = string;
      declare const _default: Sdk<() => void, {
        getData: (state: any, callbackId: number) => DartReturn<ResponseData>;
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

      expect(result.functions[0].returnType.dart).toBe("String");
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

    it("should return false for wrong export name", () => {
      const code = `
        declare const someOtherName: Sdk<() => void, {}>;
        export { someOtherName as default };
      `;
      const { sf } = parseCode(code);
      expect(hasSdkDeclaration(sf)).toBe(false);
    });

    it("should return false for missing type arguments", () => {
      const code = `
        declare const _default: Sdk;
        export { _default as default };
      `;
      const { sf } = parseCode(code);
      expect(hasSdkDeclaration(sf)).toBe(false);
    });

    it("should return false for insufficient type arguments", () => {
      const code = `
        declare const _default: Sdk<() => void>;
        export { _default as default };
      `;
      const { sf } = parseCode(code);
      expect(hasSdkDeclaration(sf)).toBe(false);
    });
  });

  describe("parseDeclarationFile", () => {
    it("should parse a file from disk with type aliases", () => {
      const tmpDir = os.tmpdir();
      const filePath = path.join(tmpDir, `test-${Date.now()}.d.ts`);
      const code = `
        type MyType = string;
        declare const _default: Sdk<(arg: MyType) => any, {
          foo: (state: any, arg: MyType, callbackId: number) => DartReturn<number>;
        }>;
        export { _default as default };
      `;
      fs.writeFileSync(filePath, code);

      try {
        const result = parseDeclarationFile(filePath);
        expect(result).not.toBeNull();
        expect(result!.initArgs).toHaveLength(1);
        expect(result!.initArgs[0].type.dart).toBe("String");
        expect(result!.functions).toHaveLength(1);
        expect(result!.functions[0].name).toBe("foo");
        expect(result!.functions[0].returnType.dart).toBe("num");
        expect(result!.functions[0].isStream).toBe(false);
      } finally {
        fs.unlinkSync(filePath);
      }
    });

    it("should parse a file with streaming functions", () => {
      const tmpDir = os.tmpdir();
      const filePath = path.join(tmpDir, `test-stream-${Date.now()}.d.ts`);
      const code = `
        declare const _default: Sdk<() => void, {
          streamData: (state: any, callbackId: number) => DartStreamReturn<string>;
        }>;
        export { _default as default };
      `;
      fs.writeFileSync(filePath, code);

      try {
        const result = parseDeclarationFile(filePath);
        expect(result).not.toBeNull();
        expect(result!.functions).toHaveLength(1);
        expect(result!.functions[0].isStream).toBe(true);
      } finally {
        fs.unlinkSync(filePath);
      }
    });

    it("should return null for invalid file path", () => {
      expect(() => parseDeclarationFile("/non/existent/path.d.ts")).toThrow();
    });

    it("should return null for malformed SDK declaration", () => {
      const tmpDir = os.tmpdir();
      const filePath = path.join(tmpDir, `test-malformed-${Date.now()}.d.ts`);
      const code = `
        declare const _default: SomethingElse<any, {}>;
        export { _default as default };
      `;
      fs.writeFileSync(filePath, code);

      try {
        const result = parseDeclarationFile(filePath);
        expect(result).toBeNull();
      } finally {
        fs.unlinkSync(filePath);
      }
    });
  });

  describe("parseTypeAliasMap", () => {
    it("should parse simple type aliases", () => {
      const code = `
        type MyString = string;
        type MyNumber = number;
      `;
      const { sf } = parseCode(code);
      const map = parseTypeAliasMap(sf);

      expect(map.size).toBe(2);
      expect(map.has("MyString")).toBe(true);
      expect(map.has("MyNumber")).toBe(true);
    });

    it("should parse complex type aliases", () => {
      const code = `
        type UserId = string;
        type User = { id: UserId; name: string };
      `;
      const { sf } = parseCode(code);
      const map = parseTypeAliasMap(sf);

      expect(map.size).toBe(2);
      expect(map.has("UserId")).toBe(true);
      expect(map.has("User")).toBe(true);
    });

    it("should handle empty source file", () => {
      const code = ``;
      const { sf } = parseCode(code);
      const map = parseTypeAliasMap(sf);

      expect(map.size).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("should handle empty init args", () => {
      const code = `
        declare const _default: Sdk<() => void, {
          test: (state: any, callbackId: number) => DartReturn<string>;
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

      expect(result.initArgs).toHaveLength(0);
    });

    it("should handle empty functions object", () => {
      const code = `
        declare const _default: Sdk<() => void, {}>;
        export { _default as default };
      `;
      const { sf, checker } = parseCode(code);
      const typeAliasMap = parseTypeAliasMap(sf);

      const result = parseInitArgsAndFunctions({
        sourceFile: sf,
        checker,
        typeAliasMap,
      });

      expect(result.functions).toHaveLength(0);
    });

    it("should handle nested type aliases", () => {
      const code = `
        type InnerType = string;
        type OuterType = InnerType;
        declare const _default: Sdk<(arg: OuterType) => any, {}>;
        export { _default as default };
      `;
      const { sf, checker } = parseCode(code);
      const typeAliasMap = parseTypeAliasMap(sf);

      const result = parseInitArgsAndFunctions({
        sourceFile: sf,
        checker,
        typeAliasMap,
      });

      expect(result.initArgs[0].type.dart).toBe("String");
    });

    it("should handle functions with Promise return type", () => {
      const code = `
        declare const _default: Sdk<() => void, {
          asyncFunc: (state: any, callbackId: number) => Promise<void>;
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

      // Promise<void> should be treated as void return
      expect(result.functions[0].returnType.dart).toBe("dynamic");
    });

    it("should handle namespaced DartReturn types (tsdown bundler)", () => {
      const code = `
        declare const _default: Sdk<() => void, {
          getString: (state: any, callbackId: number) => _globe_runtime_types0.DartReturn<string>;
          getMap: (state: any, callbackId: number) => _globe_runtime_types0.DartReturn<_globe_runtime_types0.DartMap>;
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

      expect(result.functions).toHaveLength(2);
      expect(result.functions[0].returnType.dart).toBe("String");
      expect(result.functions[1].returnType.dart).toBe("Map<dynamic, dynamic>");
    });

    it("should handle namespaced DartStreamReturn types (tsdown bundler)", () => {
      const code = `
        declare const _default: Sdk<() => void, {
          streamString: (state: any, callbackId: number) => _namespace.DartStreamReturn<string>;
          streamList: (state: any, callbackId: number) => _namespace.DartStreamReturn<_namespace.DartList>;
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

      expect(result.functions).toHaveLength(2);
      expect(result.functions[0].returnType.dart).toBe("String");
      expect(result.functions[0].isStream).toBe(true);
      expect(result.functions[1].returnType.dart).toBe("List<dynamic>");
      expect(result.functions[1].isStream).toBe(true);
    });

    it("should handle all namespaced collection types", () => {
      const code = `
        declare const _default: Sdk<() => void, {
          getMap: (state: any, callbackId: number) => _types.DartReturn<_types.DartMap>;
          getList: (state: any, callbackId: number) => _types.DartReturn<_types.DartList>;
          getSet: (state: any, callbackId: number) => _types.DartReturn<_types.DartSet>;
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

      expect(result.functions).toHaveLength(3);
      expect(result.functions[0].returnType.dart).toBe("Map<dynamic, dynamic>");
      expect(result.functions[1].returnType.dart).toBe("List<dynamic>");
      expect(result.functions[2].returnType.dart).toBe("Set<dynamic>");
    });

    it("should preserve documentation and parameter names in init function", () => {
      const code = `
        declare const _default: {
          /**
           * Initialize the SDK
           * @param apiKey - Your API key
           * @param timeout - Request timeout
           */
          init: (apiKey: string, timeout: number) => any;
        } & Sdk<(apiKey: string, timeout: number) => any, {
          /**
           * Get user data
           * @param id - User ID
           */
          getUser: (state: any, id: string, callbackId: number) => DartReturn<string>;
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

      expect(result.initDescription).toBe("Initialize the SDK");
      expect(result.initArgs).toHaveLength(2);
      expect(result.initArgs[0].name).toBe("apiKey");
      expect(result.initArgs[0].description).toBe("Your API key");
      expect(result.initArgs[1].name).toBe("timeout");
      expect(result.initArgs[1].description).toBe("Request timeout");

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].description).toBe("Get user data");
      expect(result.functions[0].args[0].description).toBe("User ID");
    });
  });
});
