/**
 * Utility functions
 */

/**
 * Converts a snake_case string to camelCase
 * @param str - The string to convert
 * @returns The camelCase version of the string
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}
