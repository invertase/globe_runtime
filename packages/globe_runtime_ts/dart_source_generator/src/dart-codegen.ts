/**
 * Dart code generation utilities
 */

import type { ArgType, FuncType } from "./types";

/**
 * Generates a complete Dart class from parsed function definitions
 * @param params - Object containing class name, version, source, init args, and functions
 * @param params.className - Name of the Dart class to generate
 * @param params.version - Version string for the package
 * @param params.jsSource - JavaScript source code to embed
 * @param params.initArgs - Initialization function arguments
 * @param params.functions - Worker functions
 * @returns Generated Dart source code
 */
export function generateDartClass({
  className,
  version,
  jsSource,
  initArgs,
  functions,
}: {
  className: string;
  version: string;
  jsSource: string;
  initArgs: ArgType[];
  functions: FuncType[];
}): string {
  const createParams = initArgs
    .map((a) => `${a.type.dart}? ${a.name}`)
    .join(", ");
  const registerArgs = initArgs
    .map((a) => `${a.name}?.toFFIType`)
    .join(",\n      ");
  const createArgs = createParams.length > 0 ? `{${createParams}}` : "";

  const dartCode = `
import 'dart:async';
import 'dart:convert';
import 'package:globe_runtime/globe_runtime.dart';

const packageVersion = '${version}';
const packageSource = r'''
${jsSource}
''';

class ${className} {
  final Module _module;

  ${className}._(this._module);

  static Future<${className}> create(${createArgs}) async {
    final module = InlinedModule(
      name: '${className}',
      sourceCode: packageSource,
    );

    await module.register(args: [
      ${registerArgs}
    ]);
    return ${className}._(module);
  }

  void dispose() {
    GlobeRuntime.instance.dispose();
  }

  ${generateWorkerFunctions(functions)}
}
`;

  return dartCode;
}

/**
 * Generates all worker function methods for the Dart class
 * @param functions - List of functions to generate
 * @returns Generated function code
 */
function generateWorkerFunctions(functions: FuncType[]): string {
  return functions.map((f) => generateSingleFunction(f)).join("\n");
}

/**
 * Generates a single worker function method
 * @param func - Function definition
 * @returns Generated function code
 */
function generateSingleFunction(func: FuncType): string {
  return func.isStream
    ? generateStreamFunction(func)
    : generateSingleValueFunction(func);
}

/**
 * Generates a single-value worker function method
 * @param func - Function definition
 * @returns Generated function code
 */
function generateSingleValueFunction(func: FuncType): string {
  const params = func.args
    .map((a: ArgType) => `${a.type.dart} ${a.name}`)
    .join(", ");

  const callArgs = func.args
    .map((a: ArgType) => `${a.name}.toFFIType`)
    .join(", ");

  const returnTypeHandling =
    func.returnType.dart !== "void"
      ? generateReturnTypeHandling(func.returnType.dart)
      : generateVoidHandling();

  return `
  Future<${func.returnType.dart}> ${func.dartName}(${params}) async {
    final completer = Completer<${func.returnType.dart}>();

    _module.callFunction(
      '${func.name}',
      args: [${callArgs}],
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          ${returnTypeHandling}
        }
        return true;
      },
    );

    return completer.future;
  }
  `;
}

/**
 * Generates a streaming worker function method
 * @param func - Function definition
 * @returns Generated function code
 */
function generateStreamFunction(func: FuncType): string {
  const params = func.args
    .map((a: ArgType) => `${a.type.dart} ${a.name}`)
    .join(", ");

  const callArgs = func.args
    .map((a: ArgType) => `${a.name}.toFFIType`)
    .join(", ");

  const streamValueHandling = generateStreamValueHandling(func.returnType.dart);

  return `
  Stream<${func.returnType.dart}> ${func.dartName}(${params}) {
    final controller = StreamController<${func.returnType.dart}>();

    _module.callFunction(
      '${func.name}',
      args: [${callArgs}],
      onData: (data) {
        if (data.hasError()) {
          controller.addError(data.error);
          return true;
        }
        
        ${streamValueHandling}
        
        return false; // Keep listening for more data
      },
    );

    return controller.stream;
  }
  `;
}

/**
 * Generates code for handling non-void return types
 * @param dartType - Dart type name
 * @returns Generated handling code
 */
function generateReturnTypeHandling(dartType: string): string {
  const { dataMethodCall, resultType } = getValueHandling(dartType);
  return `
          final value = data.data${dataMethodCall};
          completer.complete(${resultType});
          `;
}

/**
 * Generates code for handling stream values
 * @param dartType - Dart type name
 * @returns Generated handling code
 */
export function generateStreamValueHandling(dartType: string): string {
  const { dataMethodCall, resultType } = getValueHandling(dartType);

  return `
        if (data.hasData()) {
          final value = data.data${dataMethodCall};
          controller.add(${resultType});
        }
        
        if (data.done) {
          controller.close();
          return true;
        }
      `;
}

/**
 * Get dataMethodCall and resultType based on Dart type
 * @param dartType - Dart type name
 * @returns Object containing dataMethodCall and resultType
 */
function getValueHandling(dartType: string) {
  const isString = dartType === "String";
  const isList = dartType === "List<int>";
  const isSet = dartType === "Set<dynamic>";
  const returnData = isString || isList;
  const dataMethodCall = returnData ? "" : ".unpack()";

  switch (true) {
    case isString:
      return { dataMethodCall, resultType: "utf8.decode(value)" };
    case isList:
      return { dataMethodCall, resultType: "value" };
    case isSet:
      return { dataMethodCall, resultType: "Set.from(value)" };
    default:
      return { dataMethodCall, resultType: `value as ${dartType}` };
  }
}

/**
 * Generates code for handling void return types
 * @returns Generated handling code
 */
function generateVoidHandling(): string {
  return `
          completer.complete();
          `;
}
