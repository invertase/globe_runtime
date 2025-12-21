/**
 * Dart code generation utilities
 */

import type { ArgType, FuncType } from "./types";

/**
 * Formats documentation for Dart
 * @param text - Documentation text (may contain \n\n for paragraph breaks)
 * @param indent - Indentation level (number of spaces)
 * @returns Formatted Dart doc comment
 */
function formatDartDoc(text: string | undefined, indent: number = 2): string {
  if (!text) return "";

  const spaces = " ".repeat(indent);

  // Split by double newlines (paragraphs)
  const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0);

  if (paragraphs.length === 0) return "";

  // Format each paragraph
  const formattedParagraphs = paragraphs.map((paragraph) => {
    // Split long lines at word boundaries (approximately 80 chars)
    const words = paragraph.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if (currentLine.length + word.length + 1 > 80) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word itself is longer than 80 chars
          lines.push(word);
        }
      } else {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.map((line) => `${spaces}/// ${line}`).join("\n");
  });

  // Join paragraphs with a single comment line separator
  return formattedParagraphs.join(`\n${spaces}///\n`) + "\n";
}

/**
 * Formats parameter documentation for Dart
 * @param args - Function arguments
 * @param indent - Indentation level
 * @returns Formatted parameter docs
 */
function formatParamDocs(args: ArgType[], indent: number = 2): string {
  const spaces = " ".repeat(indent);
  const paramDocs = args
    .filter((arg) => arg.description)
    .map((arg) => `${spaces}/// * [${arg.name}]: ${arg.description}`)
    .join("\n");

  if (paramDocs) {
    return `${spaces}///\n${spaces}/// **Parameters:**\n${paramDocs}\n`;
  }

  return "";
}

/**
 * Formats return documentation for Dart
 * @param returnDoc - Return documentation
 * @param returnType - Dart return type
 * @param indent - Indentation level
 * @returns Formatted return docs
 */
function formatReturnDoc(
  returnDoc: string | undefined,
  returnType: string,
  indent: number = 2
): string {
  const spaces = " ".repeat(indent);

  if (returnDoc) {
    return `${spaces}///\n${spaces}/// **Returns:** ${returnDoc}\n`;
  }

  if (returnType !== "void") {
    return `${spaces}///\n${spaces}/// **Returns:** ${returnType}\n`;
  }

  return "";
}

/**
 * Generates a complete Dart class from parsed function definitions
 * @param params - Object containing class name, version, source, init args, and functions
 * @param params.className - Name of the Dart class to generate
 * @param params.version - Version string for the package
 * @param params.jsSource - JavaScript source code to embed
 * @param params.initArgs - Initialization function arguments
 * @param params.functions - Worker functions
 * @param params.initDescription - Optional init function documentation
 * @returns Generated Dart source code
 */
export function generateDartClass({
  className,
  version,
  jsSource,
  initArgs,
  functions,
  initDescription,
}: {
  className: string;
  version: string;
  jsSource: string;
  initArgs: ArgType[];
  functions: FuncType[];
  initDescription?: string;
}): string {
  const createParams = initArgs
    .map((a) => `${a.type.dart}? ${a.name}`)
    .join(", ");
  const registerArgs = initArgs
    .map((a) => `${a.name}?.toFFIType`)
    .join(",\n      ");
  const createArgs = createParams.length > 0 ? `{${createParams}}` : "";

  // Generate init documentation
  let initDocs = "";

  if (initDescription) {
    initDocs += formatDartDoc(initDescription);
  } else {
    initDocs += formatDartDoc(`Create instance of ${className} class`);
  }

  // Add parameter documentation if available
  if (initArgs.length > 0 && initArgs.some((arg) => arg.description)) {
    initDocs += formatParamDocs(initArgs);
  }

  const dartCode = `
// GENERATED FILE — DO NOT MODIFY BY HAND
// This file was generated from @globe/dart_source_generator
// ignore_for_file: unused_import

import 'dart:async';
import 'dart:convert';
import 'package:globe_runtime/globe_runtime.dart';

/// Package version
const packageVersion = '${version}';

/// Package source code
const packageSource = r'''
${jsSource}
''';

/// {@template ${className}}
/// ${className} class
/// {@endtemplate}
class ${className} {
  /// {@macro ${className}}
  ${className}._(this._module);

  /// Module instance
  final Module _module;

${initDocs}  static Future<${className}> create(${createArgs}) async {
    const module = InlinedModule(
      name: '${className}',
      sourceCode: packageSource,
    );

    await module.register(args: [
      ${registerArgs}
    ]);
    return ${className}._(module);
  }

  /// Disposes of the runtime instance
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
 * Generates function documentation
 * @param func - Function definition
 * @returns Formatted documentation
 */
function generateFunctionDocs(func: FuncType): string {
  let docs = "";

  // Main description
  if (func.description) {
    docs += formatDartDoc(func.description);
  } else {
    docs += formatDartDoc(`${func.dartName} function`);
  }

  // Parameter documentation
  if (func.args.length > 0) {
    docs += formatParamDocs(func.args);
  }

  // Return documentation
  const returnTypeStr = func.isStream
    ? `Stream<${func.returnType.dart}>`
    : `Future<${func.returnType.dart}>`;
  docs += formatReturnDoc(func.returnDescription, returnTypeStr);

  return docs;
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

  const docs = generateFunctionDocs(func);

  return `
${docs}  Future<${func.returnType.dart}> ${func.dartName}(${params}) async {
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

  const docs = generateFunctionDocs(func);

  return `
${docs}  Stream<${func.returnType.dart}> ${func.dartName}(${params}) {
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
