#!/usr/bin/env node
import { mkdtemp, rm } from "fs/promises";
import { glob } from "glob";
import { tmpdir } from "os";
import { basename, join, resolve } from "path";
import { build, defineConfig } from "tsdown";
import { parseArgs } from "util";
import { version } from "../package.json";
import { generateDartSourceFile } from "../src/index";

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
    inputFiles.push(...values.files);
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
    const entry: Record<string, string> = {};
    for (const file of inputFiles) {
      // Use basename without extension as key.
      const name = basename(file).replace(/\.[t,j]s$/, "");
      console.log("Processing file:", file, "Name:", name);
      entry[name] = file;
    }

    const config = defineConfig({
      entry,
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

        for (const [key] of Object.entries(entry)) {
          let sourceFile = join(tempDir, `${key}.mjs`);
          let dtsFile = join(tempDir, `${key}.d.mts`);

          if (!filesSet.has(`${key}.mjs`) && filesSet.has(`${key}.js`)) {
            sourceFile = join(tempDir, `${key}.js`);
          }

          if (!filesSet.has(`${key}.d.mts`) && filesSet.has(`${key}.d.ts`)) {
            dtsFile = join(tempDir, `${key}.d.ts`);
          }

          const outputPath = join(outputFolder, `${key}_source.dart`);

          try {
            generateDartSourceFile({
              jsSourcePath: sourceFile,
              dtsFilePath: dtsFile,
              outputPath: outputPath,
              fileName: key,
              version: version,
            });
            console.log(`Generated: ${outputPath}`);
          } catch (e) {
            console.error(`Failed to generate Dart source for ${key}:`, e);
          }
        }
      },
    });

    await build(config);
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
