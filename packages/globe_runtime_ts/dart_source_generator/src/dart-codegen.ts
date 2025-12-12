/**
 * Dart code generation utilities
 */

import type { ArgType, FuncType } from "./types";

/**
 * Generates a complete Dart class from parsed function definitions
 * @param className - Name of the Dart class to generate
 * @param packageVersion - Version string for the package
 * @param jsSource - JavaScript source code to embed
 * @param initArgs - Initialization function arguments
 * @param functions - Worker functions
 * @returns Generated Dart source code
 */
export function generateDartClass(
  className: string,
  packageVersion: string,
  jsSource: string,
  initArgs: ArgType[],
  functions: FuncType[]
): string {
  const createParams = initArgs
    .map((a) => `${a.type.dart}? ${a.name}`)
    .join(", ");
  const registerArgs = initArgs
    .map((a) => `${a.name}?.toFFIType`)
    .join(",\n      ");

  const dartCode = `
import 'dart:async';
import 'dart:convert';
import 'package:globe_runtime/globe_runtime.dart';

const packageVersion = '${packageVersion}';
const packageSource = r'''
${jsSource}
''';

class ${className} {
  final Module _module;

  ${className}._(this._module);

  static Future<${className}> create({${createParams}}) async {
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
 * Generates code for handling non-void return types
 * @param dartType - Dart type name
 * @returns Generated handling code
 */
function generateReturnTypeHandling(dartType: string): string {
  const isString = dartType === "String";
  const dataMethodCall = isString ? "" : ".unpack()";
  const resultType = isString ? "utf8.decode(result)" : "result as ${dartType}";
  return `
          final result = data.data${dataMethodCall};
          completer.complete(${resultType});
          `;
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
