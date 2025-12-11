/**
 * Type definitions for Dart code generation
 */

/**
 * Represents a Dart type mapping with both Dart and FFI type representations
 */
export interface DartType {
  /** Dart type name (e.g., "String", "num", "bool") */
  dart: string;
  /** FFI type name (e.g., "FFIString", "FFINumber", "FFIBool") */
  ffi: string;
}

/**
 * Represents a function argument with name and type information
 */
export interface ArgType {
  /** Argument name in camelCase */
  name: string;
  /** Dart type mapping */
  type: DartType;
}

/**
 * Represents a worker function definition
 */
export interface FuncType {
  /** Original function name from TypeScript */
  name: string;
  /** Dart-friendly camelCase function name */
  dartName: string;
  /** Return type mapping */
  returnType: DartType;
  /** Function arguments */
  args: ArgType[];
}

/**
 * Result of parsing a TypeScript declaration file
 */
export interface ParseResult {
  /** Initialization function arguments */
  initArgs: ArgType[];
  /** Worker functions */
  functions: FuncType[];
}

/**
 * Options for generating Dart source code
 */
export interface GenerateDartSourceOptions {
  /** Path to the JavaScript source file */
  jsSourcePath: string;
  /** Path to the TypeScript declaration file (.d.ts) */
  dtsFilePath: string;
  /** Path where the generated Dart file should be written */
  outputPath: string;
  /** Package name (e.g., "pretty_node") */
  packageName: string;
  /** Package version */
  packageVersion: string;
}
