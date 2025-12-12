import { describe, it, expect } from "vitest";
import { toCamelCase } from "../../src/utils";

describe("utils", () => {
  it("should convert snake_case to camelCase", () => {
    expect(toCamelCase("hello_world")).toBe("helloWorld");
    expect(toCamelCase("foo__bar")).toBe("fooBar");
  });

  it("should handle already camelCase", () => {
    expect(toCamelCase("helloWorld")).toBe("helloWorld");
  });

  it("should handle kebab-case", () => {
    expect(toCamelCase("hello-world")).toBe("helloWorld");
  });

  it("should handle single word", () => {
    expect(toCamelCase("hello")).toBe("hello");
  });
});
