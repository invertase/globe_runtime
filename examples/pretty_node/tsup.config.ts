import { resolve } from "path";
import { defineConfig } from "tsup";
import { generateDartSourceFile } from "@globe/dart_source_generator";
import { name, version } from "./package.json";

const outputFileName = `${name}_v${version}`;
const dartFileName = `${name}_source.dart`;

export default defineConfig({
  entry: {
    [outputFileName]: `lib/${name}.ts`,
  },
  onSuccess: async () => {
    const distPath = resolve(`dist/${outputFileName}`);
    const sourceFile = `${distPath}.js`;
    const dtsFile = `${distPath}.d.ts`;
    const outputPath = resolve(`lib/${dartFileName}`);

    generateDartSourceFile({
      jsSourcePath: sourceFile,
      dtsFilePath: dtsFile,
      outputPath: outputPath,
      packageName: name,
      packageVersion: version,
    });
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
