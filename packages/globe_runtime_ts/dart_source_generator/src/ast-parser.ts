/**
 * TypeScript AST parsing utilities for extracting function definitions
 */

import ts from "typescript";
import type { ArgType, FuncType, InitArgs, ParseResult } from "./types";
import { mapTsTypeToDart } from "./type-mapper";
import { toCamelCase } from "./utils";

/**
 * Parses a TypeScript declaration file to extract init function arguments and worker functions
 * @param dtsFilePath - Path to the .d.ts file
 * @returns Parsed init arguments and functions
 */
export function parseDeclarationFile(dtsFilePath: string): ParseResult {
  const program = ts.createProgram([dtsFilePath], {});
  const sourceFile = program.getSourceFile(dtsFilePath);
  const checker = program.getTypeChecker();

  if (!sourceFile) {
    throw new Error(`Could not read source file: ${dtsFilePath}`);
  }

  // Build a map of type aliases for direct resolution
  const typeAliasMap = parseTypeAliasMap(sourceFile);

  return parseInitArgsAndFunctions({ sourceFile, typeAliasMap, checker });
}

/**
 * Parses a TypeScript declaration file to extract init function arguments and worker functions
 * @param sourceFile - Source file to parse
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
  // Get the variable statement in the source file,
  // only one expected exported as _default
  const variableStatement = sourceFile
    .getChildren()
    .find((stmt) => ts.isVariableStatement(stmt)) as ts.VariableStatement;

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
  const [initArgsType, _stateType, funcsType] = decl.type.typeArguments!;

  // Check if InitArgs is a tuple type
  if (!ts.isTupleTypeNode(initArgsType)) {
    throw new Error("InitArgs must be a tuple type");
  }

  // Extract InitArgs
  const initArgs = {
    args: initArgsType.elements.map((el): ArgType => {
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
    }),
  };

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

      // Return type from Generic <T = ...>
      let retType = { dart: "void", ffi: "void" };
      if (sig.typeParameters && sig.typeParameters.length > 0) {
        const tParam = sig.typeParameters[0];
        if (tParam.default) {
          retType = mapTsTypeToDart(tParam.default, checker, typeAliasMap);
        }
      }

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
        args,
      });
    }
  }

  return { initArgs, functions };
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
