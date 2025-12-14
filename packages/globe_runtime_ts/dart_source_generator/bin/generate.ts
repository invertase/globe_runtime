#!/usr/bin/env node
import { existsSync } from "fs";
import { mkdtemp, rm } from "fs/promises";
import { glob } from "glob";
import { tmpdir } from "os";
import { basename, join, resolve, relative } from "path";
import { build, defineConfig } from "tsdown";
import { parseArgs } from "util";
import { version } from "../package.json";
import { generateDartSourceFile } from "../src/index";
import { Logger, ILogObj } from "tslog";

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
      watch: {
        type: "boolean",
      },
      verbose: {
        type: "boolean",
        default: false,
      },
      help: {
        type: "boolean",
      },
    },
  });

  if (values.help) {
    console.log(`
Usage: npx @globe/dart_source_generator [generate] [options]

Options:
  --files <file>     List of input files (can be repeated)
  --input <dir>      Input directory to scan for .ts files
  --output <dir>     Output directory (default: .)
  --watch            Watch for changes and re-run
  --verbose          Enable verbose logging
  --help             Show this help message
`);
    process.exit(0);
  }

  // Set up logging
  const minLevel = values.verbose
    ? 1 // trace
    : 3; // info
  const hideLogPositionForProduction = values.verbose ? false : true;

  const logger: Logger<ILogObj> = new Logger({
    minLevel,
    hideLogPositionForProduction,
    // hide all preceding info if not verbose
    prettyLogTemplate: values.verbose ? undefined : "",
  });

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
    const files = await glob(`${folder}/**/*.[t,j]s`);
    inputFiles.push(...files);
  }

  if (inputFiles.length === 0) {
    console.error("No input files provided. Use --files or --input.");
    process.exit(1);
  } else {
    logger.debug("Input files found:", inputFiles);
  }

  // Create temp dir
  const tempDir = await mkdtemp(join(tmpdir(), "globe-gen-"));

  // Process each file individually.
  // This is to ensure every file is bundled with its own dependencies fully.
  for (const file of inputFiles) {
    const filePath = resolve(file);
    logger.debug("Processing file:", filePath);
    const outputFolder = resolve(values.output!);
    logger.debug("Output folder:", outputFolder);
    const relativePath = filePath.replace(outputFolder, "").replace(/^\//, "");
    logger.debug("Relative path:", relativePath);

    // Remove ts or js extension
    const outputName = relativePath.replace(/\.[t,j]s$/, "");
    // Use basename as key.
    const name = basename(outputName);

    logger.info(`\x1b[34mProcessing\x1b[0m \x1b[32m${relativePath}\x1b[0m`);

    await new Promise<void>(async (resolveGenerate) => {
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
        watch: values.watch,
        platform: "browser",
        logLevel: values.verbose ? "info" : "warn",
        onSuccess: async () => {
          const { readdir } = await import("fs/promises");
          const files = await readdir(tempDir, { recursive: true });
          const filesSet = new Set(files);

          let sourceFile = join(tempDir, `${name}.mjs`);
          let dtsFile = join(tempDir, `${name}.d.mts`);

          if (!filesSet.has(`${name}.mjs`) && filesSet.has(`${name}.js`)) {
            sourceFile = join(tempDir, `${name}.js`);
          }

          if (!filesSet.has(`${name}.d.mts`) && filesSet.has(`${name}.d.ts`)) {
            dtsFile = join(tempDir, `${name}.d.ts`);
          }

          const outputPath = join(outputFolder, `${outputName}_source.dart`);

          try {
            generateDartSourceFile({
              jsSourcePath: sourceFile,
              dtsFilePath: dtsFile,
              outputPath: outputPath,
              fileName: name,
              version: version,
            });

            const relativePath = relative(outputFolder, outputPath);
            logger.info(
              `\x1b[34mWROTE\x1b[0m \x1b[32m${relativePath}\x1b[0m\n`
            );

            // Resolve the promise
            resolveGenerate();
          } catch (e) {
            logger.error(`Failed to generate Dart source for ${name}:`, e);
          }
        },
      });

      await build(config);
    });
  }

  // Cleanup
  await rm(tempDir, { recursive: true, force: true });
  if (!values.watch) {
    process.exit(0);
  }
}

// Generate the source files
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
