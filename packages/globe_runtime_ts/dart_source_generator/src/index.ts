/**
 * Main entry point for generating Dart source files from TypeScript definitions
 */

import { readFileSync, writeFileSync } from "fs";
import type { GenerateDartSourceOptions } from "./types";
import { parseDeclarationFile } from "./ast-parser";
import { generateDartClass } from "./dart-codegen";
import { execSync } from "child_process";

/**
 * Generates a Dart source file from TypeScript declaration and JavaScript source
 * @param options - Configuration options for generation
 */
export function generateDartSourceFile(
  options: GenerateDartSourceOptions
): void {
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
    return;
  }

  const { initArgs, functions } = result;

  // Generate the class name from package name
  const className = fileName
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

  // Generate Dart code
  const dartCode = generateDartClass({
    className,
    version: version ?? "0.0.0",
    jsSource,
    initArgs,
    functions,
  });

  // Write the Dart file
  writeFileSync(outputPath, dartCode);

  // Run dart format on the Dart file
  execSync(`dart format ${outputPath}`);
  console.log(`\x1b[34mCLI\x1b[0m Wrote \x1b[32m${outputPath}\x1b[0m\n`);
}

// Re-export types for consumers
export type { GenerateDartSourceOptions } from "./types";
