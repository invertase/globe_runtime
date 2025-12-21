import { exec } from "child_process";
import { constants } from "fs";
import { access, mkdir, rm, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { promisify } from "util";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const execAsync = promisify(exec);

const TEST_DIR = resolve(__dirname, "generate-test-files");
const OUTPUT_DIR = resolve(__dirname, "generate-test-output");
const BIN_PATH = resolve(__dirname, "../../dist/bin/generate.js");

// Timeout for tests (30 seconds)
const timeout = 30000;

describe("Generate Dart Source Command", () => {
  // Create a dummy valid input file
  const validFileContent = `
import { Sdk } from "@globe/runtime_types";
export type InitArgs = [foo: string]
export type State = {}
export type Functions = {
  hello: <Result = string>(state: any, name: string, id: number) => string;
}

export const _default: Sdk<InitArgs, State, Functions> = {
  // implementation details omitted for bundle test
} as any;
`;
  const fileName = "valid.ts";
  const outputFileName = "valid_source.dart";
  let filePath: string;

  beforeAll(async () => {
    // Compile the project first to ensure dist/bin/generate.js exists
    await execAsync("npm run build");
  });

  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });

    filePath = join(TEST_DIR, fileName);
    await writeFile(filePath, validFileContent);
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
    await rm(OUTPUT_DIR, { recursive: true, force: true });
  });

  it(
    "should generate dart source for valid input file via CLI",
    async () => {
      // We run the built JS file using node
      const cmd = `node ${BIN_PATH} --files ${filePath} --output ${OUTPUT_DIR} --verbose`;

      try {
        const output = await execAsync(cmd);
        console.log(output.stdout);
        console.error(output.stderr);
      } catch (e: any) {
        console.error("Bundler failed:", e.stdout, e.stderr);
        throw e;
      }

      // Check if output exists
      const dartFile = join(OUTPUT_DIR, outputFileName);

      // We expect the file to exist.
      // Use access to check existence
      await expect(access(dartFile, constants.F_OK)).resolves.toBeUndefined();
    },
    timeout
  );

  it(
    "should generate dart source for valid input folder via CLI",
    async () => {
      // We run the built JS file using node
      const cmd = `node ${BIN_PATH} --input ${TEST_DIR} --output ${OUTPUT_DIR} --verbose`;

      try {
        const output = await execAsync(cmd);
        console.log(output.stdout);
        console.error(output.stderr);
      } catch (e: any) {
        console.error("Bundler failed:", e.stdout, e.stderr);
        throw e;
      }

      // Check if output exists
      const dartFile = join(OUTPUT_DIR, outputFileName);

      // We expect the file to exist.
      // Use access to check existence
      await expect(access(dartFile, constants.F_OK)).resolves.toBeUndefined();
    },
    timeout
  );

  it("should generate nested files", async () => {
    const nestedFolder = "nested";
    await mkdir(join(TEST_DIR, nestedFolder), { recursive: true });
    await writeFile(join(TEST_DIR, nestedFolder, fileName), validFileContent);
    await writeFile(join(TEST_DIR, fileName), validFileContent);

    // We run the built JS file using node
    const cmd = `node ${BIN_PATH} --input ${TEST_DIR} --output ${OUTPUT_DIR} --verbose`;

    try {
      const output = await execAsync(cmd);
      console.log(output.stdout);
      console.error(output.stderr);
    } catch (e: any) {
      console.error("Bundler failed:", e.stdout, e.stderr);
      throw e;
    }

    // Check if output exists
    const nestedDartFile = join(OUTPUT_DIR, nestedFolder, outputFileName);
    await expect(
      access(nestedDartFile, constants.F_OK)
    ).resolves.toBeUndefined();
    const dartFile = join(OUTPUT_DIR, outputFileName);
    await expect(access(dartFile, constants.F_OK)).resolves.toBeUndefined();
  });
});
