#!/usr/bin/env node
import { mkdtemp, rm } from "fs/promises";
import { glob } from "glob";
import { tmpdir } from "os";
import { basename, join, resolve } from "path";
import { build, defineConfig } from "tsdown";
import { parseArgs } from "util";
import { version } from "../package.json";
import { generateDartSourceFile } from "../src/index";
import { existsSync } from "fs";
import { execSync } from "child_process";

// Helper to bundle and generate
async function run() {
  const { values } = parseArgs({
    options: {
      files: {
        type: "string",
        multiple: true,
      },
      input: {
        type: "string",
      },
      output: {
        type: "string",
        default: ".",
      },
      help: {
        type: "boolean",
      },
    },
  });

  if (values.help) {
    console.log(`
Usage: globe-dart-source-generator [generate] [options]

Options:
  --files <file>     List of input files (can be repeated)
  --input <dir>      Input directory to scan for .ts files
  --output <dir>     Output directory (default: .)
  --help             Show this help message
`);
    process.exit(0);
  }

  const inputFiles: string[] = [];

  if (values.files) {
    // Filter for .ts and .js files, and ensure they exist.
    const files = values.files.filter((f) => {
      const exists = existsSync(f);
      if (!exists) {
        console.error(`File does not exist: ${f}`);
        return false;
      }
      return f.endsWith(".ts") || f.endsWith(".js");
    });
    inputFiles.push(...files);
  }

  if (values.input) {
    const folder = values.input;
    const files = await glob(`${folder}/*.[t,j]s`);
    inputFiles.push(...files);
  }

  if (inputFiles.length === 0) {
    console.error("No input files provided. Use --files or --input.");
    process.exit(1);
  }

  // Create temp dir
  const tempDir = await mkdtemp(join(tmpdir(), "globe-gen-"));

  try {
    for (const file of inputFiles) {
      // Use basename without extension as key.
      const name = basename(file).replace(/\.[t,j]s$/, "");
      console.log("Processing file:", file, "Name:", name);

      const config = defineConfig({
        entry: { [name]: file },
        outDir: tempDir,
        format: ["esm"],
        minify: true,
        sourcemap: false,
        unbundle: false,
        treeshake: true,
        clean: true,
        dts: true,
        noExternal: [/.*/],
        platform: "browser",
        onSuccess: async () => {
          const outputFolder = resolve(values.output!);
          const { readdir } = await import("fs/promises");
          const files = await readdir(tempDir);
          const filesSet = new Set(files);

          let sourceFile = join(tempDir, `${name}.mjs`);
          let dtsFile = join(tempDir, `${name}.d.mts`);

          if (!filesSet.has(`${name}.mjs`) && filesSet.has(`${name}.js`)) {
            sourceFile = join(tempDir, `${name}.js`);
          }

          if (!filesSet.has(`${name}.d.mts`) && filesSet.has(`${name}.d.ts`)) {
            dtsFile = join(tempDir, `${name}.d.ts`);
          }

          const outputPath = join(outputFolder, `${name}_source.dart`);

          try {
            generateDartSourceFile({
              jsSourcePath: sourceFile,
              dtsFilePath: dtsFile,
              outputPath: outputPath,
              fileName: name,
              version: version,
            });
            console.log(`Generated: ${outputPath}`);
            // Run dart format on the generated file
            execSync(`dart format ${outputPath}`);
          } catch (e) {
            console.error(`Failed to generate Dart source for ${name}:`, e);
          }
        },
      });

      await build(config);
    }
  } finally {
    // Cleanup
    console.log("Temp dir:", tempDir);
    // await rm(tempDir, { recursive: true, force: true });
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
