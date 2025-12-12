/**
 * Utility functions
 */

/**
 * Converts a kebab-case or snake_case string to camelCase
 * @param str - The string to convert
 * @returns The camelCase version of the string
 */
export function toCamelCase(str: string): string {
  return str.replace(/[_-]+([a-z])/g, (_, letter) => letter.toUpperCase());
}
