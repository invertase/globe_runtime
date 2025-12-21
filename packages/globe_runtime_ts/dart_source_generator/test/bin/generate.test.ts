import { exec } from "child_process";
import { constants, existsSync } from "fs";
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
import { defineSdk, returnString, returnNumber } from "@globe/runtime_types";

type ModuleState = {
  apiKey: string;
  timeout: number;
};

export default defineSdk({
  /**
   * Initialize the SDK with authentication credentials
   * 
   * This sets up the SDK with your API key and configures the timeout
   * for all network requests.
   * 
   * @param apiKey - Your API key for authentication
   * @param timeout - Request timeout in milliseconds
   */
  init(apiKey: string, timeout: number = 5000): ModuleState {
    return { apiKey, timeout };
  },
  functions: {
    /**
     * Fetches user data from the API
     * 
     * This function retrieves user information based on the provided user ID.
     * It handles authentication automatically using the configured API key.
     * 
     * @param userId - The unique identifier for the user
     * @returns A JSON string containing the user's profile information
     */
    getUserData: returnString(
      (state: ModuleState, userId: string, callbackId: number) => {
        // implementation
      }
    ),
    
    /**
     * Calculates the sum of two numbers
     * @param a - First number
     * @param b - Second number
     * @returns The sum of a and b
     */
    calculateSum: returnNumber(
      (state: ModuleState, a: number, b: number, callbackId: number) => {
        // implementation
      }
    ),
  },
});
`;
  const fileName = "my-sdk.ts";
  const outputFileName = "my_sdk_source.dart";
  let filePath: string;
  let testDir: string;
  let outputDir: string;

  beforeAll(async () => {
    if (!existsSync(BIN_PATH)) {
      // Compile the project first to ensure dist/bin/generate.js exists
      await execAsync("npm run build");
    }
  });

  beforeEach(async () => {
    testDir = join(TEST_DIR, Date.now().toString());
    outputDir = join(OUTPUT_DIR, Date.now().toString());

    await mkdir(testDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });

    filePath = join(testDir, fileName);
    await writeFile(filePath, validFileContent);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    await rm(outputDir, { recursive: true, force: true });
  });

  it(
    "should generate dart source for valid input file via CLI",
    async () => {
      // We run the built JS file using node
      const cmd = `node ${BIN_PATH} --files ${filePath} --output ${outputDir} --verbose`;

      try {
        const output = await execAsync(cmd);
        console.log(output.stdout);
        console.error(output.stderr);
      } catch (e: any) {
        console.error("Bundler failed:", e.stdout, e.stderr);
        throw e;
      }

      // Check if output exists
      const dartFile = join(outputDir, outputFileName);

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
      const cmd = `node ${BIN_PATH} --input ${testDir} --output ${outputDir} --verbose`;

      try {
        const output = await execAsync(cmd);
        console.log(output.stdout);
        console.error(output.stderr);
      } catch (e: any) {
        console.error("Bundler failed:", e.stdout, e.stderr);
        throw e;
      }

      // Check if output exists
      const dartFile = join(outputDir, outputFileName);

      // We expect the file to exist.
      // Use access to check existence
      await expect(access(dartFile, constants.F_OK)).resolves.toBeUndefined();
    },
    timeout
  );

  it("should generate nested files", async () => {
    const nestedFolder = "nested";
    await mkdir(join(testDir, nestedFolder), { recursive: true });
    await writeFile(join(testDir, nestedFolder, fileName), validFileContent);
    await writeFile(join(testDir, fileName), validFileContent);

    // We run the built JS file using node
    const cmd = `node ${BIN_PATH} --input ${testDir} --output ${outputDir} --verbose`;

    try {
      const output = await execAsync(cmd);
      console.log(output.stdout);
      console.error(output.stderr);
    } catch (e: any) {
      console.error("Bundler failed:", e.stdout, e.stderr);
      throw e;
    }

    // Check if output exists
    const nestedDartFile = join(outputDir, nestedFolder, outputFileName);
    await expect(
      access(nestedDartFile, constants.F_OK)
    ).resolves.toBeUndefined();
    const dartFile = join(outputDir, outputFileName);
    await expect(access(dartFile, constants.F_OK)).resolves.toBeUndefined();
  });
});
