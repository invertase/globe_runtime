/**
 * TypeScript AST parsing utilities for extracting function definitions
 */

import ts from "typescript";
import { mapTsTypeToDart } from "./type-mapper";
import type { ArgType, FuncType, ParseResult } from "./types";
import { toCamelCase } from "./utils";

/**
 * Parses a TypeScript declaration file to extract init function arguments and worker functions
 * @param dtsFilePath - Path to the .d.ts file
 * @returns Parsed init arguments and functions
 */
export function parseDeclarationFile(dtsFilePath: string): ParseResult | null {
  const program = ts.createProgram([dtsFilePath], {});
  const sourceFile = program.getSourceFile(dtsFilePath);
  const checker = program.getTypeChecker();

  if (!sourceFile) {
    throw new Error(`Could not read source file: ${dtsFilePath}`);
  }

  // Build a map of type aliases for direct resolution
  const typeAliasMap = parseTypeAliasMap(sourceFile);
  try {
    // Get SDK types
    const { initArgsType, funcsType } = getSdkTypes(sourceFile, typeAliasMap);

    // Parse SDK types
    return parseSdkTypes({ initArgsType, typeAliasMap, checker, funcsType });
  } catch (error) {
    console.error(error);
    return null;
  }
}

/**
 * Parses a TypeScript declaration file to extract init function arguments and worker functions
 * @param params - Object containing source file, type alias map, and checker
 * @param params.sourceFile - Source file to parse
 * @param params.typeAliasMap - Map of type aliases
 * @param params.checker - TypeScript type checker
 * @returns Parsed init arguments and functions
 */
export function parseInitArgsAndFunctions({
  sourceFile,
  typeAliasMap,
  checker,
}: {
  sourceFile: ts.SourceFile;
  typeAliasMap: Map<string, ts.TypeNode>;
  checker: ts.TypeChecker;
}): ParseResult {
  // Get SDK types
  const { initArgsType, funcsType } = getSdkTypes(sourceFile, typeAliasMap);

  // Parse SDK types
  return parseSdkTypes({ initArgsType, typeAliasMap, checker, funcsType });
}

/**
 * Extracts the type argument from DartReturn<T> or DartStreamReturn<T>
 * @param returnType - The return type node
 * @param checker - TypeScript type checker
 * @param typeAliasMap - Map of type aliases
 * @returns The extracted return type and whether it's a stream
 */
function extractDartReturnType(
  returnType: ts.TypeNode | undefined,
  checker: ts.TypeChecker,
  typeAliasMap: Map<string, ts.TypeNode>
): { type: { dart: string; ffi: string }; isStream: boolean } {
  if (!returnType) {
    return { type: { dart: "void", ffi: "Void" }, isStream: false };
  }

  // Check if it's a type reference (e.g., DartReturn<T> or DartStreamReturn<T>)
  if (ts.isTypeReferenceNode(returnType)) {
    const typeName = returnType.typeName.getText();

    // Handle namespaced types like _globe_runtime_types0.DartReturn
    if (typeName.includes("DartReturn") && returnType.typeArguments?.length) {
      const typeArg = returnType.typeArguments[0];
      return {
        type: mapDartCollectionType(typeArg, checker, typeAliasMap),
        isStream: false,
      };
    }

    if (
      typeName.includes("DartStreamReturn") &&
      returnType.typeArguments?.length
    ) {
      const typeArg = returnType.typeArguments[0];
      return {
        type: mapDartCollectionType(typeArg, checker, typeAliasMap),
        isStream: true,
      };
    }
  }

  // Check for plain void return
  if (returnType.kind === ts.SyntaxKind.VoidKeyword) {
    return { type: { dart: "void", ffi: "Void" }, isStream: false };
  }

  // If we get here, it's likely an unwrapped type - map it directly
  return {
    type: mapDartCollectionType(returnType, checker, typeAliasMap),
    isStream: false,
  };
}

/**
 * Maps Dart collection marker types (DartMap, DartList, DartSet) to their Dart equivalents
 * @param typeNode - The type node to map
 * @param checker - TypeScript type checker
 * @param typeAliasMap - Map of type aliases
 * @returns Mapped Dart type
 */
function mapDartCollectionType(
  typeNode: ts.TypeNode,
  checker: ts.TypeChecker,
  typeAliasMap: Map<string, ts.TypeNode>
): { dart: string; ffi: string } {
  // Resolve type aliases first
  const resolvedType = resolveTypeAlias(typeAliasMap, typeNode);

  // Check if it's a type reference to DartMap, DartList, or DartSet
  // if (ts.isTypeReferenceNode(resolvedType)) {
  //   const typeName = resolvedType.typeName.getText();

  //   // Handle namespaced types like _globe_runtime_types0.DartMap
  //   if (typeName.includes("DartMap")) {
  //     return { dart: "Map<dynamic, dynamic>", ffi: "FFIJsonPayload" };
  //   }
  //   if (typeName.includes("DartList")) {
  //     return { dart: "List<dynamic>", ffi: "FFIJsonPayload" };
  //   }
  //   if (typeName.includes("DartSet")) {
  //     return { dart: "Set<dynamic>", ffi: "FFIJsonPayload" };
  //   }
  // }

  // Fall back to standard type mapping
  return mapTsTypeToDart(resolvedType, checker, typeAliasMap);
}

/**
 * Parses a TypeScript declaration file to extract init function arguments and worker functions
 * @param params - Object containing init arguments type, type alias map, checker, and functions type
 * @param params.initArgsType - Init arguments type
 * @param params.typeAliasMap - Map of type aliases
 * @param params.checker - TypeScript type checker
 * @param params.funcsType - Functions type
 * @returns Parsed init arguments and functions
 */
function parseSdkTypes({
  initArgsType,
  typeAliasMap,
  checker,
  funcsType,
}: {
  initArgsType: ts.TupleTypeNode;
  typeAliasMap: Map<string, ts.TypeNode>;
  checker: ts.TypeChecker;
  funcsType: ts.TypeNode;
}) {
  const initArgs = initArgsType.elements.map((el): ArgType => {
    let type = el;
    let name = "arg";
    if (ts.isNamedTupleMember(el)) {
      name = el.name.getText();
      type = el.type;
    }
    const resolvedType = resolveTypeAlias(typeAliasMap, type);
    return {
      name: toCamelCase(name),
      type: mapTsTypeToDart(resolvedType, checker, typeAliasMap),
    };
  });

  // Check if Fns is a type literal node
  if (!ts.isTypeLiteralNode(funcsType)) {
    throw new Error("Fns must be a type literal node");
  }

  // Extract Fns
  const functions: FuncType[] = [];
  for (const member of funcsType.members) {
    if (
      ts.isPropertySignature(member) &&
      member.type &&
      ts.isFunctionTypeNode(member.type)
    ) {
      const funcName = member.name.getText();
      const sig = member.type;

      // Extract return type from DartReturn<T> or DartStreamReturn<T>
      const { type: retType, isStream } = extractDartReturnType(
        sig.type,
        checker,
        typeAliasMap
      );

      // Params (skip state (0) and callbackId (last))
      const params = sig.parameters.filter(
        (_, i) => i !== 0 && i !== sig.parameters.length - 1
      );

      // Format args
      const args = params.map((p) => ({
        name: toCamelCase(p.name.getText()),
        type: mapTsTypeToDart(p.type, checker, typeAliasMap),
      }));

      functions.push({
        name: funcName,
        dartName: toCamelCase(funcName),
        returnType: retType,
        isStream, // Add stream flag if needed for your use case
        args,
      });
    }
  }

  return { initArgs, functions };
}

/**
 * Gets the SDK declaration from the source file
 * @param sourceFile - Source file to parse
 * @returns SDK declaration
 */
export function getSdkTypes(
  sourceFile: ts.SourceFile,
  typeAliasMap: Map<string, ts.TypeNode> = new Map()
): { initArgsType: ts.TupleTypeNode; funcsType: ts.TypeNode } {
  // Get the variable statement in the source file,
  // only one expected exported as _default
  const variableStatement = sourceFile.statements.find((stmt) =>
    ts.isVariableStatement(stmt)
  ) as ts.VariableStatement;

  if (!variableStatement) {
    throw new Error("Could not find SDK definition in declaration file");
  }

  const decl = variableStatement.declarationList.declarations[0];
  // Check if it's the _default constraint
  if (decl.name.getText() !== "_default") {
    throw new Error("Could not find default export in declaration file");
  }

  // Check if it's the Sdk type (i.e. Sdk<...>)
  if (!decl.type || !ts.isTypeReferenceNode(decl.type)) {
    throw new Error("Could not find Sdk type in declaration file");
  }

  // Check if it has 3 type arguments (i.e. Sdk<InitArgs, State, Fns>)
  if ((decl.type.typeArguments?.length ?? 0) < 3) {
    throw new Error(
      "Sdk type must have 3 type arguments. expected Sdk<InitArgs, State, Fns>"
    );
  }

  // Get type arguments
  let [initArgsType, _stateType, funcsType] = decl!.type.typeArguments!;

  // Resolve type aliases, if present
  initArgsType = resolveTypeAlias(typeAliasMap, initArgsType);
  funcsType = resolveTypeAlias(typeAliasMap, funcsType);

  // Check if InitArgs is a tuple type
  if (!ts.isTupleTypeNode(initArgsType)) {
    throw new Error(
      `InitArgs must be a tuple type found: ${initArgsType.getText()}`
    );
  }

  return { initArgsType, funcsType };
}

/**
 * Determine if a file has an SDK declaration
 * @param sourceFile - Source file to parse
 * @returns true if the file has an SDK declaration
 */
export function hasSdkDeclaration(sourceFile: ts.SourceFile) {
  try {
    // Build a map of type aliases for direct resolution
    const typeAliasMap = parseTypeAliasMap(sourceFile);
    getSdkTypes(sourceFile, typeAliasMap);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Parses a TypeScript declaration file to extract type aliases
 * @param sourceFile - Source file to parse
 * @returns Map of type aliases
 */
export function parseTypeAliasMap(
  sourceFile: ts.SourceFile
): Map<string, ts.TypeNode> {
  const typeAliasMap = new Map<string, ts.TypeNode>();
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isTypeAliasDeclaration(node)) {
      typeAliasMap.set(node.name.text, node.type);
    }
  });
  return typeAliasMap;
}

/**
 * Resolves type aliases in a TypeScript AST
 * @param typeAliasMap - Map of type aliases
 * @param typeNode - Type node to resolve
 * @returns Resolved type node
 */
export function resolveTypeAlias(
  typeAliasMap: Map<string, ts.TypeNode>,
  typeNode: ts.TypeNode
): ts.TypeNode {
  if (ts.isTypeReferenceNode(typeNode)) {
    const typeName = typeNode.typeName.getText();
    const resolvedType = typeAliasMap.get(typeName);
    if (resolvedType) {
      return resolveTypeAlias(typeAliasMap, resolvedType);
    }
  }
  return typeNode;
}
