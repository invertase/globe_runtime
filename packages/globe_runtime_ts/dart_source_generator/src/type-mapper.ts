/**
 * Type mapping utilities for converting TypeScript types to Dart types
 */

import ts from "typescript";
import type { DartType } from "./types.js";

/**
 * Recursively gets the entity name from a TypeScript entity name
 * @param name - The TypeScript entity name to get the name from
 * @returns The entity name as a string
 */
function getEntityName(name: ts.EntityName): string {
  if (ts.isIdentifier(name)) {
    return name.text;
  }
  return `${getEntityName(name.left)}.${name.right.text}`;
}

/**
 * Maps a TypeScript type node to a Dart type representation
 * @param typeNode - The TypeScript type node to map
 * @param checker - Optional TypeScript type checker for resolving type aliases
 * @param typeAliasMap - Optional map of type alias names to their resolved types
 * @returns The mapped Dart type
 */
export function mapTsTypeToDart(
  typeNode: ts.TypeNode | undefined,
  checker?: ts.TypeChecker,
  typeAliasMap?: Map<string, ts.TypeNode>
): DartType {
  if (!typeNode) return { dart: "dynamic", ffi: "FFIJsonPayload" };

  // Handle array types (string[], number[], etc.)
  if (ts.isArrayTypeNode(typeNode)) {
    const elementType = mapTsTypeToDart(
      typeNode.elementType,
      checker,
      typeAliasMap
    );
    return {
      dart: `List<${elementType.dart}>`,
      ffi: "FFIJsonPayload",
    };
  }

  // First, try to resolve type aliases using the map
  if (typeAliasMap && ts.isTypeReferenceNode(typeNode)) {
    const typeName = getEntityName(typeNode.typeName);

    if (typeName) {
      // Handle Dart collection marker types
      if (typeName.includes("DartMap")) {
        return { dart: "Map<dynamic, dynamic>", ffi: "FFIJsonPayload" };
      }
      if (typeName.includes("DartList")) {
        return { dart: "List<dynamic>", ffi: "FFIJsonPayload" };
      }
      if (typeName.includes("DartSet")) {
        return { dart: "Set<dynamic>", ffi: "FFIJsonPayload" };
      }

      // Handle Array<T> generic syntax
      if (typeName === "Array" && typeNode.typeArguments?.length) {
        const elementType = mapTsTypeToDart(
          typeNode.typeArguments[0],
          checker,
          typeAliasMap
        );
        return {
          dart: `List<${elementType.dart}>`,
          ffi: "FFIJsonPayload",
        };
      }

      const resolvedType = typeAliasMap.get(typeName);
      if (resolvedType) {
        return mapTsTypeToDart(resolvedType, checker, typeAliasMap);
      }
    }
  }

  // Resolve type aliases and references using the type checker
  if (checker && ts.isTypeReferenceNode(typeNode)) {
    const type = checker.getTypeAtLocation(typeNode);

    // Check if it's an array type via the type checker
    const symbol = type.getSymbol();
    if (symbol?.getName() === "Array") {
      const typeArgs = (type as ts.TypeReference).typeArguments;
      if (typeArgs && typeArgs.length > 0) {
        const elementTypeNode = checker.typeToTypeNode(
          typeArgs[0],
          undefined,
          ts.NodeBuilderFlags.InTypeAlias
        );
        if (elementTypeNode) {
          const elementType = mapTsTypeToDart(
            elementTypeNode,
            checker,
            typeAliasMap
          );
          return {
            dart: `List<${elementType.dart}>`,
            ffi: "FFIJsonPayload",
          };
        }
      }
    }

    // Handle union types (e.g., Language | undefined)
    if (type.isUnion()) {
      // Filter out undefined/null/void types
      const nonNullTypes = type.types.filter(
        (t) =>
          !(t.flags & ts.TypeFlags.Undefined) &&
          !(t.flags & ts.TypeFlags.Null) &&
          !(t.flags & ts.TypeFlags.Void)
      );

      // If we have exactly one non-null type, resolve it recursively
      if (nonNullTypes.length === 1) {
        const singleType = nonNullTypes[0];

        // Check if it's a string literal union
        if (
          singleType.isUnion() &&
          singleType.types.every((t: any) => t.isStringLiteral())
        ) {
          return { dart: "String", ffi: "FFIString" };
        }

        // Check for primitive flags
        if (
          singleType.flags & ts.TypeFlags.String ||
          singleType.flags & ts.TypeFlags.StringLiteral
        ) {
          return { dart: "String", ffi: "FFIString" };
        }
        if (
          singleType.flags & ts.TypeFlags.Number ||
          singleType.flags & ts.TypeFlags.NumberLiteral
        ) {
          return { dart: "num", ffi: "FFINumber" };
        }
        if (
          singleType.flags &
          (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral)
        ) {
          return { dart: "bool", ffi: "FFIBool" };
        }
      }

      // Check if all non-null types are string literals
      if (nonNullTypes.every((t: any) => t.isStringLiteral())) {
        return { dart: "String", ffi: "FFIString" };
      }

      // Check if all non-null types are boolean-ish (true/false/boolean)
      if (
        nonNullTypes.every(
          (t) =>
            !!(t.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral))
        )
      ) {
        return { dart: "bool", ffi: "FFIBool" };
      }
    }

    // If it's a primitive type alias, get the underlying type
    if (
      type.flags & ts.TypeFlags.String ||
      type.flags & ts.TypeFlags.StringLiteral
    ) {
      return { dart: "String", ffi: "FFIString" };
    }
    if (
      type.flags & ts.TypeFlags.Number ||
      type.flags & ts.TypeFlags.NumberLiteral
    ) {
      return { dart: "num", ffi: "FFINumber" };
    }
    if (type.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral)) {
      return { dart: "bool", ffi: "FFIBool" };
    }
  }

  // Handle Uint8Array
  if (ts.isTypeReferenceNode(typeNode)) {
    if (
      ts.isIdentifier(typeNode.typeName) &&
      typeNode.typeName.text === "Uint8Array"
    ) {
      return { dart: "List<int>", ffi: "FFIBytes" };
    }
  }

  switch (typeNode.kind) {
    case ts.SyntaxKind.StringKeyword:
    case ts.SyntaxKind.StringLiteral:
      return { dart: "String", ffi: "FFIString" };
    case ts.SyntaxKind.LiteralType:
      const literal = (typeNode as ts.LiteralTypeNode).literal;
      if (literal.kind === ts.SyntaxKind.StringLiteral) {
        return { dart: "String", ffi: "FFIString" };
      }
      if (literal.kind === ts.SyntaxKind.NumericLiteral) {
        return { dart: "num", ffi: "FFINumber" };
      }
      if (
        literal.kind === ts.SyntaxKind.TrueKeyword ||
        literal.kind === ts.SyntaxKind.FalseKeyword
      ) {
        return { dart: "bool", ffi: "FFIBool" };
      }
      return { dart: "dynamic", ffi: "FFIJsonPayload" };
    case ts.SyntaxKind.NumberKeyword:
      return { dart: "num", ffi: "FFINumber" };
    case ts.SyntaxKind.BooleanKeyword:
    case ts.SyntaxKind.TrueKeyword:
    case ts.SyntaxKind.FalseKeyword:
      return { dart: "bool", ffi: "FFIBool" };
    case ts.SyntaxKind.VoidKeyword:
      return { dart: "void", ffi: "Void" };
    case ts.SyntaxKind.UnionType:
      const union = typeNode as ts.UnionTypeNode;
      const types = union.types.filter(
        (t) =>
          t.kind !== ts.SyntaxKind.UndefinedKeyword &&
          t.kind !== ts.SyntaxKind.NullKeyword &&
          t.kind !== ts.SyntaxKind.VoidKeyword &&
          !(
            ts.isLiteralTypeNode(t) &&
            t.literal.kind === ts.SyntaxKind.NullKeyword
          )
      );

      // If only one type remains after filtering, recursively resolve and map it
      if (types.length === 1) {
        // If it's a type reference, it might need resolution by the type alias map or checker
        if (ts.isTypeReferenceNode(types[0])) {
          // Try to recursively resolve by mapTsTypeToDart which will hit the TypeReference case
          return mapTsTypeToDart(types[0], checker, typeAliasMap);
        }
        return mapTsTypeToDart(types[0], checker, typeAliasMap);
      }

      if (
        types.every(
          (t) =>
            ts.isLiteralTypeNode(t) &&
            t.literal.kind === ts.SyntaxKind.StringLiteral
        )
      ) {
        return { dart: "String", ffi: "FFIString" };
      }

      // Fallback to dynamic Dart Type
      return { dart: "dynamic", ffi: "FFIJsonPayload" };

    default:
      return { dart: "dynamic", ffi: "FFIJsonPayload" };
  }
}
