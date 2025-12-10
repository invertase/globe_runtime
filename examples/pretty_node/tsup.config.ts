import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { defineConfig } from "tsup";
import ts from "typescript";
import { name, version } from "./package.json";

const outputFileName = `${name}_v${version}`;
const dartFileName = `${name}_source.dart`;

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

function mapTsTypeToDart(typeNode: ts.TypeNode | undefined, checker?: ts.TypeChecker, typeAliasMap?: Map<string, ts.TypeNode>): { dart: string; ffi: string, toFfi: string } {
  if (!typeNode) return { dart: 'dynamic', ffi: 'FFIJsonPayload', toFfi: '.toFFIType' };
  
  // First, try to resolve type aliases using the map
  if (typeAliasMap && ts.isTypeReferenceNode(typeNode)) {
      const typeName = typeNode.typeName.getText();
      const resolvedType = typeAliasMap.get(typeName);
      if (resolvedType) {
          return mapTsTypeToDart(resolvedType, checker, typeAliasMap);
      }
  }
  
  // Resolve type aliases and references using the type checker
  if (checker && ts.isTypeReferenceNode(typeNode)) {
      const type = checker.getTypeAtLocation(typeNode);
      
      // Handle union types (e.g., Language | undefined)
      if (type.isUnion()) {
          // Filter out undefined/null/void types
          const nonNullTypes = type.types.filter(t => 
              !(t.flags & ts.TypeFlags.Undefined) && 
              !(t.flags & ts.TypeFlags.Null) &&
              !(t.flags & ts.TypeFlags.Void)
          );
          
          // If we have exactly one non-null type, resolve it recursively
          if (nonNullTypes.length === 1) {
              const singleType = nonNullTypes[0];
              
              // Check if it's a string literal union
              if (singleType.isUnion() && singleType.types.every((t: any) => t.isStringLiteral())) {
                  return { dart: 'String', ffi: 'FFIString', toFfi: '.toFFIType' };
              }
              
              // Check for primitive flags
              if (singleType.flags & ts.TypeFlags.String || singleType.flags & ts.TypeFlags.StringLiteral) {
                  return { dart: 'String', ffi: 'FFIString', toFfi: '.toFFIType' };
              }
              if (singleType.flags & ts.TypeFlags.Number || singleType.flags & ts.TypeFlags.NumberLiteral) {
                  return { dart: 'num', ffi: 'FFINumber', toFfi: '.toFFIType' };
              }
              if (singleType.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral)) {
                  return { dart: 'bool', ffi: 'FFIBool', toFfi: '.toFFIType' };
              }
          }
          
          // Check if all non-null types are string literals
          if (nonNullTypes.every((t: any) => t.isStringLiteral())) {
              return { dart: 'String', ffi: 'FFIString', toFfi: '.toFFIType' };
          }
      }
      
      // If it's a primitive type alias, get the underlying type
      if (type.flags & ts.TypeFlags.String || type.flags & ts.TypeFlags.StringLiteral) {
          return { dart: 'String', ffi: 'FFIString', toFfi: '.toFFIType' };
      }
      if (type.flags & ts.TypeFlags.Number || type.flags & ts.TypeFlags.NumberLiteral) {
          return { dart: 'num', ffi: 'FFINumber', toFfi: '.toFFIType' };
      }
      if (type.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral)) {
          return { dart: 'bool', ffi: 'FFIBool', toFfi: '.toFFIType' };
      }
  }
  
  if (ts.isTypeReferenceNode(typeNode)) {
      if (typeNode.typeName.getText() === 'Uint8Array') {
          return { dart: 'Uint8List', ffi: 'FFIBytes', toFfi: '.toFFIType' };
      }
  }

  switch (typeNode.kind) {
    case ts.SyntaxKind.StringKeyword:
    case ts.SyntaxKind.StringLiteral:
      return { dart: 'String', ffi: 'FFIString', toFfi: '.toFFIType' };
    case ts.SyntaxKind.NumberKeyword:
      return { dart: 'num', ffi: 'FFINumber', toFfi: '.toFFIType' };
    case ts.SyntaxKind.BooleanKeyword:
      return { dart: 'bool', ffi: 'FFIBool', toFfi: '.toFFIType' };
    case ts.SyntaxKind.UnionType:
        const union = typeNode as ts.UnionTypeNode;
        // Filter out undefined and null
        const types = union.types.filter(t => t.kind !== ts.SyntaxKind.UndefinedKeyword && t.kind !== ts.SyntaxKind.NullKeyword && t.kind !== ts.SyntaxKind.VoidKeyword);
        
        // If only one type remains after filtering, recursively resolve and map it
        if (types.length === 1) {
          // If it's a type reference (like Language), it might need resolution by the type alias map or checker
          if (ts.isTypeReferenceNode(types[0])) {
              // Try to recursively resolve by mapTsTypeToDart which will hit the TypeReference case
              return mapTsTypeToDart(types[0], checker, typeAliasMap);
          }
          return mapTsTypeToDart(types[0], checker, typeAliasMap);
        }
        
        if (types.every(t => ts.isLiteralTypeNode(t) && t.literal.kind === ts.SyntaxKind.StringLiteral)) {
             return { dart: 'String', ffi: 'FFIString', toFfi: '.toFFIType' };
        }
        return { dart: 'dynamic', ffi: 'FFIJsonPayload', toFfi: '.toFFIType' }; // Fallback
    default:
      return { dart: 'dynamic', ffi: 'FFIJsonPayload', toFfi: '.toFFIType' };
  }
}

export default defineConfig({
  entry: {
    [outputFileName]: `lib/${name}.ts`,
  },
  onSuccess: async () => {
    const distPath = resolve(`dist/${outputFileName}`);
    const actualFile = `${distPath}.js`;
    const dtsFile = `${distPath}.d.ts`;
    const bindingsPath = resolve(`lib/${dartFileName}`);

    // ... (Existing JS Source Writing) ...
    const jsSource = readFileSync(actualFile, "utf8");
    
    // ... (New Declaration Parsing) ...
    const dtsContent = readFileSync(dtsFile, "utf8");
    const sourceFile = ts.createSourceFile(dtsFile, dtsContent, ts.ScriptTarget.Latest, true);
    
    // Create a program with type checker to resolve type aliases
    const program = ts.createProgram([dtsFile], {});
    const checker = program.getTypeChecker();

    // Build a map of type aliases for direct resolution
    const typeAliasMap = new Map<string, ts.TypeNode>();
    ts.forEachChild(sourceFile, (node) => {
        if (ts.isTypeAliasDeclaration(node)) {
            typeAliasMap.set(node.name.text, node.type);
        }
    });

    interface DartType {
      dart: string;
      ffi: string;
      toFfi: string;
    }

    interface ArgType {
      name: string;
      type: DartType;
    }

    interface FuncType {
      name: string;
      dartName: string;
      returnType: DartType;
      args: ArgType[];
    }

    let initFunc: { args: ArgType[] } | null = null;
    const functions: FuncType[] = [];
    
    // Helper to resolve type aliases
    const resolveTypeAlias = (typeNode: ts.TypeNode): ts.TypeNode => {
        if (ts.isTypeReferenceNode(typeNode)) {
            const typeName = typeNode.typeName.getText();
            const resolvedType = typeAliasMap.get(typeName);
            if (resolvedType) {
                return resolveTypeAlias(resolvedType);
            }
        }
        return typeNode;
    };

    const visit = (node: ts.Node) => {
        if (ts.isVariableStatement(node)) {
            const decl = node.declarationList.declarations[0];
            if (decl.name.getText() === "_default") {
                // Found _default constraint
                 if (decl.type && ts.isTypeReferenceNode(decl.type)) {
                     const typeArgs = decl.type.typeArguments;
                     if (typeArgs && typeArgs.length >= 3) {
                         // 0: InitArgs (Tuple)
                         const initArgsType = typeArgs[0];
                         if (ts.isTupleTypeNode(initArgsType)) {
                             initFunc = {
                                 args: initArgsType.elements.map((el): ArgType => {
                                     let type = el;
                                     let name = "arg";
                                     if (ts.isNamedTupleMember(el)) {
                                         name = el.name.getText();
                                         type = el.type;
                                     }
                                     const resolvedType = resolveTypeAlias(type);
                                     return { name: toCamelCase(name), type: mapTsTypeToDart(resolvedType, checker, typeAliasMap) };
                                 })
                             };
                         }

                         // 2: Functions (TypeLiteral)
                         const funcsType = typeArgs[2];
                         if (ts.isTypeLiteralNode(funcsType)) {
                             funcsType.members.forEach(member => {
                                 if (ts.isPropertySignature(member) && member.type && ts.isFunctionTypeNode(member.type)) {
                                     const funcName = member.name.getText();
                                     const sig = member.type;
                                     
                                     // Return type from Generic <T = ...>
                                     let retType = { dart: 'void', ffi: 'void', toFfi: '' };
                                     if (sig.typeParameters && sig.typeParameters.length > 0) {
                                         const tParam = sig.typeParameters[0];
                                         if (tParam.default) {
                                             retType = mapTsTypeToDart(tParam.default, checker, typeAliasMap);
                                         }
                                     }

                                     // Params (skip state (0) and callbackId (last))
                                     const params = sig.parameters.filter((_, i) => i !== 0 && i !== sig.parameters.length - 1).map(p => ({
                                         name: toCamelCase(p.name.getText()),
                                         type: mapTsTypeToDart(p.type, checker, typeAliasMap)
                                     }));

                                     functions.push({ name: funcName, dartName: toCamelCase(funcName), returnType: retType, args: params });
                                 }
                             });
                         }
                     }
                 }
            }
        }
        ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    // Generate Dart Code
    const className = name.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
    
    // Extract initFunc args to avoid type narrowing issues in template literals
    const typedInitFunc = initFunc as unknown as { args: ArgType[] } | null;
    const initArgs: ArgType[] = typedInitFunc ? typedInitFunc.args : [];
    const createParams = initArgs.map((a) => `${a.type.dart}? ${a.name}`).join(', ');
    const registerArgs = initArgs.map((a) => `${a.name}?.toFFIType`).join(',\n      ');

    
    const dartCode = `
import 'dart:async';
import 'dart:convert';
import 'package:globe_runtime/globe_runtime.dart' as runtime;

const packageVersion = '${version}';
const packageSource = r'''
${jsSource}
''';

class ${className} {
  final runtime.Module _module;

  ${className}._(this._module);

  static Future<${className}> create({${createParams}}) async {
    final module = runtime.InlinedModule(
      name: '${className}',
      sourceCode: packageSource,
    );

    await module.register(args: [
      ${registerArgs}
    ]);
    return ${className}._(module);
  }

  void dispose() {
    runtime.GlobeRuntime.instance.dispose();
  }

  ${functions.map(f => `
  Future<${f.returnType.dart}> ${f.dartName}(${f.args.map((a: any) => `${a.type.dart} ${a.name}`).join(', ')}) async {
    final completer = Completer<${f.returnType.dart}>();

    _module.callFunction(
      '${f.name}',
      args: [${f.args.map((a: any) => `${a.name}${a.type.toFfi}`).join(', ')}],
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          ${f.returnType.dart !== 'void' ? `
          final result = data.data${f.returnType.dart === 'String' ? '' : '.unpack()'};
          completer.complete(${f.returnType.dart === 'String' ? 'utf8.decode(result)' : `result as ${f.returnType.dart}`});
          ` : `
          completer.complete();
          `}
        }
        return true;
      },
    );

    return completer.future;
  }
  `).join('\n')}
}
`;

    writeFileSync(bindingsPath, dartCode);
    console.log(`\x1b[34mCLI\x1b[0m Wrote \x1b[32mlib/${dartFileName}\x1b[0m`);

  },
  format: ["esm"], // or "cjs" depending on your needs
  minify: true, // Optional, for smaller output
  sourcemap: false, // Optional, set to true if debugging
  bundle: true, // Ensures bundling
  splitting: false, // Prevents multiple output files
  treeshake: true, // Removes unused code
  clean: true, // Cleans output directory before build
  dts: true, // Set to true if you need TypeScript declaration files
  noExternal: [/.*/], // Include all dependencies in the bundle
  platform: "browser",
});
