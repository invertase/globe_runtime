import { defineConfig } from "tsup";
import { version, name } from "./package.json";
import { writeFileSync, readFileSync } from "fs";
import { resolve } from "path";

const outputFileName = `${name}_v${version}`;
const dartFileName = `${name}_source.dart`;

export default defineConfig({
  entry: {
    [outputFileName]: `lib/${name}.ts`,
  },
  onSuccess: async () => {
    const actualFile = resolve(`dist/${outputFileName}.mjs`);
    const dartFile = resolve(`lib/${dartFileName}`);

    // 1. read actual file content as string
    const jsSource = readFileSync(actualFile, "utf8");

    // 2. Write the Dart source file containing JavaScript code
    writeFileSync(
      dartFile,
      `// GENERATED FILE — DO NOT MODIFY BY HAND
// This file was generated from package.json

const packageVersion = '${version}';

const packageSource = r'''
${jsSource}
''';
`
    );
    console.log(
      `\x1b[34mCLI\x1b[0m Wrote \x1b[32mlib/${dartFileName}\x1b[0m with version \x1b[32m${version}\x1b[0m`
    );
  },
  format: ["esm"],
  minify: true,
  sourcemap: false,
  bundle: true,
  splitting: false,
  treeshake: true,
  clean: true,
  dts: false,
  noExternal: [/.*/],
  platform: "node",
});
