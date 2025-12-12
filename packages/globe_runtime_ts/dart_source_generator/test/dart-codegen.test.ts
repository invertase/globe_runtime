import { describe, it, expect } from "vitest";
import { generateDartClass } from "../src/dart-codegen";
import { ArgType, FuncType } from "../src/types";

describe("dart-codegen", () => {
  it("should generate a simple class", () => {
    const jsSource = "console.log('hello');";
    const initArgs: ArgType[] = [];
    const functions: FuncType[] = [];
    const className = "MySdk";
    const version = "1.0.0";

    const result = generateDartClass({
      className,
      version,
      jsSource,
      initArgs,
      functions,
    });

    expect(result).toContain("class MySdk {");
    expect(result).toContain("const packageVersion = '1.0.0';");
    expect(result).toContain(jsSource);
    expect(result).toContain("Future<MySdk> create");
  });

  it("should generate a class with args and functions", () => {
    const jsSource = "function test() {}";
    const initArgs = [
      { name: "apiKey", type: { dart: "String", ffi: "FFIString" } },
    ];
    const functions = [
      {
        name: "hello",
        dartName: "hello",
        returnType: { dart: "String", ffi: "FFIString" },
        args: [{ name: "name", type: { dart: "String", ffi: "FFIString" } }],
      },
    ];
    const className = "TestSdk";
    const version = "0.0.1";

    const result = generateDartClass({
      className,
      version,
      jsSource,
      initArgs,
      functions,
    });

    // Check init args usage
    expect(result).toContain("String? apiKey");
    expect(result).toContain("apiKey?.toFFIType");

    // Check function generation
    expect(result).toContain("Future<String> hello(String name) async {");
    expect(result).toContain("_module.callFunction(");
    expect(result).toContain("'hello'");
    expect(result).toContain("args: [name.toFFIType]");
  });
});
