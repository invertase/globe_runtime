import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { exec } from "child_process";
import { resolve, join } from "path";
import { mkdir, writeFile, rm, access } from "fs/promises";
import { constants } from "fs";
import { promisify } from "util";

const execAsync = promisify(exec);

const TEST_DIR = resolve(__dirname, "generate-test-files");
const OUTPUT_DIR = resolve(__dirname, "generate-test-output");
const BIN_PATH = resolve(__dirname, "../../dist/bin/generate.js");

describe("Generate Dart Source Command", () => {
  beforeAll(async () => {
    // Compile the project first to ensure dist/bin/generate.js exists
    await execAsync("npm run build");

    await mkdir(TEST_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });

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
    await writeFile(join(TEST_DIR, "valid.ts"), validFileContent);
  });

  afterAll(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
    await rm(OUTPUT_DIR, { recursive: true, force: true });
  });

  it("should generate dart source for valid input file via CLI", async () => {
    // We run the built JS file using node
    const cmd = `node ${BIN_PATH} --files ${join(
      TEST_DIR,
      "valid.ts"
    )} --output ${OUTPUT_DIR}`;

    try {
      await execAsync(cmd);
    } catch (e: any) {
      console.error("Bundler failed:", e.stdout, e.stderr);
      throw e;
    }

    // Check if output exists
    const dartFile = join(OUTPUT_DIR, "valid_source.dart");

    // We expect the file to exist.
    // Use access to check existence
    await expect(access(dartFile, constants.F_OK)).resolves.toBeUndefined();
  }, 30000); // increase timeout for build/bundle
});
