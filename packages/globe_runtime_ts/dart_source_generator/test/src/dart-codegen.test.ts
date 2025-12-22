import { describe, it, expect } from "vitest";
import {
  generateDartClass,
  generateStreamValueHandling,
} from "../../src/dart-codegen";
import { ArgType, FuncType } from "../../src/types";

describe("dart-codegen", () => {
  describe("generateDartClass", () => {
    it("should generate a simple class with no args or functions", () => {
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
      expect(result).toContain("import 'dart:async';");
      expect(result).toContain("import 'dart:convert';");
      expect(result).toContain(
        "import 'package:globe_runtime/globe_runtime.dart';"
      );
      expect(result).toContain("void dispose()");
    });

    it("should generate a class with single init arg", () => {
      const jsSource = "function test() {}";
      const initArgs = [
        { name: "apiKey", type: { dart: "String", ffi: "FFIString" } },
      ];
      const functions: FuncType[] = [];
      const className = "TestSdk";
      const version = "0.0.1";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain("String? apiKey");
      expect(result).toContain("apiKey?.toFFIType");
      expect(result).toContain("Future<TestSdk> create({String? apiKey})");
    });

    it("should generate a class with multiple init args", () => {
      const jsSource = "function test() {}";
      const initArgs = [
        { name: "apiKey", type: { dart: "String", ffi: "FFIString" } },
        { name: "timeout", type: { dart: "num", ffi: "FFINumber" } },
        { name: "verbose", type: { dart: "bool", ffi: "FFIBool" } },
      ];
      const functions: FuncType[] = [];
      const className = "TestSdk";
      const version = "1.0.0";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain("String? apiKey, num? timeout, bool? verbose");
      expect(result).toContain("apiKey?.toFFIType");
      expect(result).toContain("timeout?.toFFIType");
      expect(result).toContain("verbose?.toFFIType");
    });

    it("should generate a single-value function returning String", () => {
      const jsSource = "function test() {}";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [
        {
          name: "hello",
          dartName: "hello",
          returnType: { dart: "String", ffi: "FFIString" },
          args: [
            {
              name: "name",
              type: { dart: "String", ffi: "FFIString" },
            },
          ],
          isStream: false,
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

      expect(result).toContain("Future<String> hello(String name) async {");
      expect(result).toContain("final completer = Completer<String>();");
      expect(result).toContain("_module.callFunction(");
      expect(result).toContain("'hello'");
      expect(result).toContain("args: [name.toFFIType]");
      expect(result).toContain("utf8.decode(value)");
      expect(result).toContain("completer.complete(");
    });

    it("should generate a single-value function with multiple args", () => {
      const jsSource = "function test() {}";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [
        {
          name: "calculate",
          dartName: "calculate",
          returnType: { dart: "num", ffi: "FFINumber" },
          args: [
            { name: "a", type: { dart: "num", ffi: "FFINumber" } },
            { name: "b", type: { dart: "num", ffi: "FFINumber" } },
            { name: "operation", type: { dart: "String", ffi: "FFIString" } },
          ],
          isStream: false,
        },
      ];
      const className = "TestSdk";
      const version = "1.0.0";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain(
        "Future<num> calculate(num a, num b, String operation) async {"
      );
      expect(result).toContain(
        "args: [a.toFFIType, b.toFFIType, operation.toFFIType]"
      );
    });

    it("should generate a single-value function with no args", () => {
      const jsSource = "function test() {}";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [
        {
          name: "get_status",
          dartName: "getStatus",
          returnType: { dart: "String", ffi: "FFIString" },
          args: [],
          isStream: false,
        },
      ];
      const className = "TestSdk";
      const version = "1.0.0";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain("Future<String> getStatus() async {");
      expect(result).toContain("args: []");
    });

    it("should generate a void return function", () => {
      const jsSource = "function test() {}";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [
        {
          name: "doSomething",
          dartName: "doSomething",
          returnType: { dart: "void", ffi: "Void" },
          args: [],
          isStream: false,
        },
      ];
      const className = "TestSdk";
      const version = "1.0.0";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain("Future<void> doSomething() async {");
      expect(result).toContain("final completer = Completer<void>();");
      expect(result).toContain("completer.complete();");
      expect(result).not.toContain("utf8.decode");
      expect(result).not.toContain("value as");
    });

    it("should generate functions with all primitive types", () => {
      const jsSource = "function test() {}";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [
        {
          name: "getString",
          dartName: "getString",
          returnType: { dart: "String", ffi: "FFIString" },
          args: [],
          isStream: false,
        },
        {
          name: "getNumber",
          dartName: "getNumber",
          returnType: { dart: "num", ffi: "FFINumber" },
          args: [],
          isStream: false,
        },
        {
          name: "getBool",
          dartName: "getBool",
          returnType: { dart: "bool", ffi: "FFIBool" },
          args: [],
          isStream: false,
        },
        {
          name: "getBytes",
          dartName: "getBytes",
          returnType: { dart: "List<int>", ffi: "FFIBytes" },
          args: [],
          isStream: false,
        },
      ];
      const className = "TestSdk";
      const version = "1.0.0";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain("Future<String> getString() async {");
      expect(result).toContain("utf8.decode(value)");
      expect(result).toContain("Future<num> getNumber() async {");
      expect(result).toContain("value as num");
      expect(result).toContain("Future<bool> getBool() async {");
      expect(result).toContain("value as bool");
      expect(result).toContain("Future<List<int>> getBytes() async {");
      expect(result).toContain("final value = data.data;");
    });

    it("should generate functions with collection types", () => {
      const jsSource = "function test() {}";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [
        {
          name: "getMap",
          dartName: "getMap",
          returnType: { dart: "Map<String, dynamic>", ffi: "FFIJsonPayload" },
          args: [],
          isStream: false,
        },
        {
          name: "getList",
          dartName: "getList",
          returnType: { dart: "List<dynamic>", ffi: "FFIJsonPayload" },
          args: [],
          isStream: false,
        },
        {
          name: "getSet",
          dartName: "getSet",
          returnType: { dart: "Set<dynamic>", ffi: "FFIJsonPayload" },
          args: [],
          isStream: false,
        },
      ];
      const className = "TestSdk";
      const version = "1.0.0";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain("Future<Map<String, dynamic>> getMap() async {");
      expect(result).toContain("value as Map<String, dynamic>");
      expect(result).toContain("Future<List<dynamic>> getList() async {");
      expect(result).toContain("value as List<dynamic>");
      expect(result).toContain("Future<Set<dynamic>> getSet() async {");
      expect(result).toContain("Set.from(value)");
    });

    it("should generate streaming function", () => {
      const jsSource = "function test() {}";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [
        {
          name: "streamData",
          dartName: "streamData",
          returnType: { dart: "String", ffi: "FFIString" },
          args: [{ name: "count", type: { dart: "num", ffi: "FFINumber" } }],
          isStream: true,
        },
      ];
      const className = "TestSdk";
      const version = "1.0.0";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain("Stream<String> streamData(num count) {");
      expect(result).toContain(
        "final controller = StreamController<String>();"
      );
      expect(result).toContain("if (data.hasData()) {");
      expect(result).toContain("controller.add(");
      expect(result).toContain("if (data.done) {");
      expect(result).toContain("controller.close();");
      expect(result).toContain("return false; // Keep listening for more data");
      expect(result).not.toContain("completer");
    });

    it("should generate multiple streaming functions", () => {
      const jsSource = "function test() {}";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [
        {
          name: "streamStrings",
          dartName: "streamStrings",
          returnType: { dart: "String", ffi: "FFIString" },
          args: [],
          isStream: true,
        },
        {
          name: "streamNumbers",
          dartName: "streamNumbers",
          returnType: { dart: "num", ffi: "FFINumber" },
          args: [],
          isStream: true,
        },
        {
          name: "streamMaps",
          dartName: "streamMaps",
          returnType: { dart: "Map<String, dynamic>", ffi: "FFIJsonPayload" },
          args: [],
          isStream: true,
        },
      ];
      const className = "TestSdk";
      const version = "1.0.0";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain("Stream<String> streamStrings() {");
      expect(result).toContain("Stream<num> streamNumbers() {");
      expect(result).toContain("Stream<Map<String, dynamic>> streamMaps() {");
    });

    it("should generate mixed single-value and streaming functions", () => {
      const jsSource = "function test() {}";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [
        {
          name: "getValue",
          dartName: "getValue",
          returnType: { dart: "String", ffi: "FFIString" },
          args: [],
          isStream: false,
        },
        {
          name: "streamValue",
          dartName: "streamValue",
          returnType: { dart: "String", ffi: "FFIString" },
          args: [],
          isStream: true,
        },
      ];
      const className = "TestSdk";
      const version = "1.0.0";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain("Future<String> getValue() async {");
      expect(result).toContain("Stream<String> streamValue() {");
      expect(result).toContain("final completer = Completer<String>();");
      expect(result).toContain(
        "final controller = StreamController<String>();"
      );
    });

    it("should handle snake_case to camelCase conversion in function names", () => {
      const jsSource = "function test() {}";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [
        {
          name: "get_user_data",
          dartName: "getUserData",
          returnType: { dart: "String", ffi: "FFIString" },
          args: [],
          isStream: false,
        },
      ];
      const className = "TestSdk";
      const version = "1.0.0";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain("Future<String> getUserData() async {");
      expect(result).toContain("'get_user_data'");
    });

    it("should handle error cases in single-value functions", () => {
      const jsSource = "function test() {}";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [
        {
          name: "test",
          dartName: "test",
          returnType: { dart: "String", ffi: "FFIString" },
          args: [],
          isStream: false,
        },
      ];
      const className = "TestSdk";
      const version = "1.0.0";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain("if (data.hasError()) {");
      expect(result).toContain("completer.completeError(data.error);");
    });

    it("should handle error cases in streaming functions", () => {
      const jsSource = "function test() {}";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [
        {
          name: "test",
          dartName: "test",
          returnType: { dart: "String", ffi: "FFIString" },
          args: [],
          isStream: true,
        },
      ];
      const className = "TestSdk";
      const version = "1.0.0";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain("if (data.hasError()) {");
      expect(result).toContain("controller.addError(data.error);");
      expect(result).toContain("return true;");
    });

    it("should properly escape JavaScript source code", () => {
      const jsSource = "const str = r'''multi\nline\nstring''';";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [];
      const className = "TestSdk";
      const version = "1.0.0";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain("const packageSource = r'''");
      expect(result).toContain(jsSource);
      expect(result).toContain("''';");
    });
  });

  describe("generateStreamValueHandling", () => {
    it("should handle String type", () => {
      const result = generateStreamValueHandling("String");
      expect(result).toContain("if (data.hasData()) {");
      expect(result).toContain("final value = data.data;");
      expect(result).toContain("utf8.decode(value)");
      expect(result).toContain("controller.add(");
      expect(result).toContain("if (data.done) {");
      expect(result).toContain("controller.close();");
    });

    it("should handle List<int> type", () => {
      const result = generateStreamValueHandling("List<int>");
      expect(result).toContain("if (data.hasData()) {");
      expect(result).toContain("final value = data.data;");
      expect(result).toContain("controller.add(value);");
      expect(result).toContain("if (data.done) {");
      expect(result).toContain("controller.close();");
      expect(result).not.toContain(".unpack()");
    });

    it("should handle Set<dynamic> type", () => {
      const result = generateStreamValueHandling("Set<dynamic>");
      expect(result).toContain("if (data.hasData()) {");
      expect(result).toContain("final value = data.data.unpack();");
      expect(result).toContain("Set.from(value)");
      expect(result).toContain("controller.add(");
      expect(result).toContain("if (data.done) {");
      expect(result).toContain("controller.close();");
    });

    it("should handle num type", () => {
      const result = generateStreamValueHandling("num");
      expect(result).toContain("value as num");
    });

    it("should handle bool type", () => {
      const result = generateStreamValueHandling("bool");
      expect(result).toContain("value as bool");
    });

    it("should handle Map<String, dynamic> type", () => {
      const result = generateStreamValueHandling("Map<String, dynamic>");
      expect(result).toContain("value as Map<String, dynamic>");
    });

    it("should handle List<dynamic> type", () => {
      const result = generateStreamValueHandling("List<dynamic>");
      expect(result).toContain("value as List<dynamic>");
    });

    it("should handle custom types", () => {
      const result = generateStreamValueHandling("CustomType");
      expect(result).toContain("value as CustomType");
    });
  });

  describe("edge cases", () => {
    it("should handle empty init args array", () => {
      const jsSource = "function test() {}";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [];
      const className = "TestSdk";
      const version = "1.0.0";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain("Future<TestSdk> create() async {");
      expect(result).toContain(
        "await module.register(args: [\n      \n    ]);"
      );
    });

    it("should handle empty functions array", () => {
      const jsSource = "function test() {}";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [];
      const className = "TestSdk";
      const version = "1.0.0";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain("class TestSdk {");
      expect(result).toContain("void dispose() {");
      // Should not have any function definitions after dispose
      const disposeIndex = result.indexOf("void dispose()");
      const afterDispose = result.substring(disposeIndex + 100);
      expect(afterDispose.match(/Future</g)?.length || 0).toBe(0);
      expect(afterDispose.match(/Stream</g)?.length || 0).toBe(0);
    });

    it("should handle special characters in version string", () => {
      const jsSource = "function test() {}";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [];
      const className = "TestSdk";
      const version = "1.0.0-beta.1+build.123";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain(
        "const packageVersion = '1.0.0-beta.1+build.123';"
      );
    });

    it("should handle class names with numbers", () => {
      const jsSource = "function test() {}";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [];
      const className = "MySdk2";
      const version = "1.0.0";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      expect(result).toContain("class MySdk2 {");
      expect(result).toContain("Future<MySdk2> create");
      expect(result).toContain("return MySdk2._(module);");
    });

    it("should handle functions with isStream undefined", () => {
      const jsSource = "function test() {}";
      const initArgs: ArgType[] = [];
      const functions: FuncType[] = [
        {
          name: "test",
          dartName: "test",
          returnType: { dart: "String", ffi: "FFIString" },
          args: [],
          // isStream is undefined
        } as any,
      ];
      const className = "TestSdk";
      const version = "1.0.0";

      const result = generateDartClass({
        className,
        version,
        jsSource,
        initArgs,
        functions,
      });

      // Should default to single-value function
      expect(result).toContain("Future<String> test() async {");
      expect(result).toContain("final completer = Completer<String>();");
    });
  });
});
