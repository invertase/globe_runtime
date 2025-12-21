/**
 * TypeScript AST parsing utilities for extracting function definitions
 */

import ts from "typescript";
import { mapTsTypeToDart } from "./type-mapper";
import type { ArgType, FuncType, ParseResult } from "./types";
import { camelCase } from "text-case";

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
 * Extracts JSDoc comment text from a node
 * @param node - TypeScript node
 * @returns Cleaned documentation text or undefined
 */
function extractJsDocComment(node: ts.Node): string | undefined {
  const jsDocTags = ts.getJSDocTags(node);
  const jsDocComments = ts.getJSDocCommentsAndTags(node);

  if (jsDocComments.length === 0) return undefined;

  // Get the first JSDoc comment
  const firstComment = jsDocComments[0];
  if (!ts.isJSDoc(firstComment)) return undefined;

  // Extract the comment text
  const commentText = firstComment.comment;

  if (typeof commentText === "string") {
    return cleanJsDocComment(commentText);
  }

  // Handle structured JSDoc comments (array of JSDocText/JSDocLink nodes)
  if (Array.isArray(commentText)) {
    const text = commentText
      .map((part) => {
        if (typeof part === "string") return part;
        if ("text" in part) return part.text;
        return "";
      })
      .join("");
    return cleanJsDocComment(text);
  }

  return undefined;
}

/**
 * Cleans JSDoc comment text by removing asterisks and extra whitespace
 * while preserving paragraph breaks
 * @param text - Raw JSDoc comment text
 * @returns Cleaned text with preserved paragraphs
 */
function cleanJsDocComment(text: string): string {
  const lines = text.split("\n").map((line) => line.trim());

  // Group lines into paragraphs (separated by empty lines)
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];

  for (const line of lines) {
    if (line.length === 0) {
      // Empty line - end current paragraph
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(" "));
        currentParagraph = [];
      }
    } else {
      currentParagraph.push(line);
    }
  }

  // Add the last paragraph if any
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(" "));
  }

  // Join paragraphs with double newline
  return paragraphs.join("\n\n").trim();
}

/**
 * Extracts parameter documentation from JSDoc
 * @param node - TypeScript node
 * @returns Map of parameter name to documentation
 */
function extractParamDocs(node: ts.Node): Map<string, string> {
  const paramDocs = new Map<string, string>();
  const jsDocTags = ts.getJSDocTags(node);

  for (const tag of jsDocTags) {
    if (tag.tagName.text === "param" && ts.isJSDocParameterTag(tag)) {
      const paramName = tag.name.getText();
      const comment = tag.comment;

      let text = "";
      if (typeof comment === "string") {
        text = comment;
      } else if (Array.isArray(comment)) {
        text = comment
          .map((part) => (typeof part === "string" ? part : part.text))
          .join("");
      }

      // Remove leading dash and whitespace that JSDoc often includes
      text = text.replace(/^\s*-\s*/, "");

      paramDocs.set(paramName, cleanJsDocComment(text));
    }
  }

  return paramDocs;
}

/**
 * Extracts return documentation from JSDoc
 * @param node - TypeScript node
 * @returns Return documentation or undefined
 */
function extractReturnDoc(node: ts.Node): string | undefined {
  const jsDocTags = ts.getJSDocTags(node);

  for (const tag of jsDocTags) {
    if (tag.tagName.text === "returns" || tag.tagName.text === "return") {
      const comment = tag.comment;

      if (typeof comment === "string") {
        return cleanJsDocComment(comment);
      } else if (Array.isArray(comment)) {
        const text = comment
          .map((part) => (typeof part === "string" ? part : part.text))
          .join("");
        return cleanJsDocComment(text);
      }
    }
  }

  return undefined;
}

/**
 * Parses SDK types with documentation
 */
function parseSdkTypes({
  initArgsType,
  typeAliasMap,
  checker,
  funcsType,
  sourceFile,
}: {
  initArgsType: ts.TupleTypeNode;
  typeAliasMap: Map<string, ts.TypeNode>;
  checker: ts.TypeChecker;
  funcsType: ts.TypeNode;
  sourceFile?: ts.SourceFile;
}) {
  // Extract init function documentation if sourceFile is provided
  let initDescription: string | undefined;
  let initParamDocs = new Map<string, string>();

  if (sourceFile) {
    const initFunction = findInitFunction(sourceFile);
    if (initFunction) {
      initDescription = extractJsDocComment(initFunction);
      initParamDocs = extractParamDocs(initFunction);
    }
  }

  const initArgs = initArgsType.elements.map((el): ArgType => {
    let type = el;
    let name = "arg";
    if (ts.isNamedTupleMember(el)) {
      name = el.name.getText();
      type = el.type;
    }
    const resolvedType = resolveTypeAlias(typeAliasMap, type);
    const camelName = camelCase(name);

    return {
      name: camelName,
      type: mapTsTypeToDart(resolvedType, checker, typeAliasMap),
      description: initParamDocs.get(name) || initParamDocs.get(camelName),
    };
  });

  // Check if Fns is a type literal node
  if (!ts.isTypeLiteralNode(funcsType)) {
    throw new Error("Fns must be a type literal node");
  }

  // Extract Fns with documentation
  const functions: FuncType[] = [];
  for (const member of funcsType.members) {
    if (
      ts.isPropertySignature(member) &&
      member.type &&
      ts.isFunctionTypeNode(member.type)
    ) {
      const funcName = member.name.getText();
      const sig = member.type;

      // Extract documentation
      const description = extractJsDocComment(member);
      const paramDocs = extractParamDocs(member);
      const returnDoc = extractReturnDoc(member);

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

      // Format args with documentation
      const args = params.map((p) => {
        const paramName = p.name.getText();
        return {
          name: camelCase(paramName),
          type: mapTsTypeToDart(p.type, checker, typeAliasMap),
          description: paramDocs.get(paramName),
        };
      });

      functions.push({
        name: funcName,
        dartName: camelCase(funcName),
        returnType: retType,
        isStream,
        args,
        description,
        returnDescription: returnDoc,
      });
    }
  }

  return { initArgs, functions, initDescription };
}

/**
 * Finds the init function in the source file
 * @param sourceFile - Source file to search
 * @returns Init function node or undefined
 */
function findInitFunction(sourceFile: ts.SourceFile): ts.Node | undefined {
  let initFunction: ts.Node | undefined;

  function visit(node: ts.Node) {
    // Look for object literal with 'init' property
    if (ts.isObjectLiteralExpression(node)) {
      for (const prop of node.properties) {
        if (
          ts.isPropertyAssignment(prop) ||
          ts.isMethodDeclaration(prop) ||
          ts.isShorthandPropertyAssignment(prop)
        ) {
          const name = prop.name?.getText();
          if (name === "init") {
            // Found the init property
            if (ts.isPropertyAssignment(prop)) {
              initFunction = prop.initializer;
            } else if (ts.isMethodDeclaration(prop)) {
              initFunction = prop;
            }
            return;
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return initFunction;
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
