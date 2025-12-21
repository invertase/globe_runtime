/**
 * Main entry point for generating Dart source files from TypeScript definitions
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { pascalCase } from "text-case";
import { parseDeclarationFile } from "./ast-parser";
import { generateDartClass } from "./dart-codegen";
import type { GenerateDartSourceOptions } from "./types";

/**
 * Generates a Dart source file from TypeScript declaration and JavaScript source
 * @param options - Configuration options for generation
 * @returns true if generation was successful, false otherwise
 */
export function generateDartSourceFile(
  options: GenerateDartSourceOptions
): boolean {
  const { jsSourcePath, dtsFilePath, outputPath, fileName, version } = options;

  // Read the JavaScript source
  const jsSource = readFileSync(jsSourcePath, "utf8");

  // Parse the TypeScript declaration file
  const result = parseDeclarationFile(dtsFilePath);

  if (!result) {
    console.error(
      "Could not parse SDK definition from declaration file",
      dtsFilePath
    );
    return false;
  }

  const { initArgs, functions, initDescription } = result;

  // Generate the class name from package name
  const className = pascalCase(fileName);

  // Generate Dart code
  const dartCode = generateDartClass({
    className,
    version: version ?? "0.0.0",
    jsSource,
    initArgs,
    functions,
    initDescription,
  });

  // Ensure output directory exists
  const outputDir = dirname(outputPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Write the Dart file
  writeFileSync(outputPath, dartCode);

  // Run dart format on the Dart file
  execSync(`dart format ${outputPath}`);

  // Generation was successful
  return true;
}

// Re-export types for consumers
export type { GenerateDartSourceOptions } from "./types";
