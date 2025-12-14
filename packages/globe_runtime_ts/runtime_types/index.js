/**
 * Helper function to return a worker function with proper typing.
 *
 * @returns {(fn: Function) => Function} A function that takes a worker function and returns it with proper typing
 */
const returnFn = () => {
  return function (fn) {
    return fn;
  };
};

/**
 * Define a worker function that sends a single value back to Dart.
 * 
 * @template T
 * @returns {function} A function that takes a worker function and returns it with proper typing
 */
export const defineFunction = returnFn;

/**
 * Define a worker function that streams multiple values back to Dart.
 * 
 * @template T
 * @returns {function} A function that takes a worker function and returns it with proper typing
 */
export const defineStreamFunction = returnFn;

// ======================================================
//  Pre-configured Helpers - Single Value Returns
// ======================================================

/**
 * Helper for functions that return a string to Dart (Dart: String, JS: string).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const returnString = defineFunction();

/**
 * Helper for functions that return an int to Dart (Dart: int, JS: number).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const returnInt = defineFunction();

/**
 * Helper for functions that return a double to Dart (Dart: double, JS: number).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const returnDouble = defineFunction();

/**
 * Helper for functions that return a number to Dart (Dart: num, JS: number).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const returnNumber = defineFunction();

/**
 * Helper for functions that return a boolean to Dart (Dart: bool, JS: boolean).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const returnBoolean = defineFunction();

/**
 * Helper for functions that return a Uint8Array to Dart (Dart: List<int>, JS: Uint8Array).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const returnUint8Array = defineFunction();

/**
 * Helper for functions that return a Map to Dart (Dart: Map<dynamic, dynamic>, JS: object).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const returnMap = defineFunction();

/**
 * Helper for functions that return a List to Dart (Dart: List<dynamic>, JS: object).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const returnList = defineFunction();

/**
 * Helper for functions that return a Set to Dart (Dart: Set<dynamic>, JS: object).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const returnSet = defineFunction();

// ======================================================
//  Pre-configured Helpers - Streaming Returns
// ======================================================

/**
 * Helper for functions that stream strings to Dart (Dart: Stream<String>, JS: string).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const streamString = defineStreamFunction();

/**
 * Helper for functions that stream ints to Dart (Dart: Stream<int>, JS: number).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const streamInt = defineStreamFunction();

/**
 * Helper for functions that stream doubles to Dart (Dart: Stream<double>, JS: number).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const streamDouble = defineStreamFunction();

/**
 * Helper for functions that stream numbers to Dart (Dart: Stream<num>, JS: number).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const streamNumber = defineStreamFunction();

/**
 * Helper for functions that stream booleans to Dart (Dart: Stream<bool>, JS: boolean).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const streamBoolean = defineStreamFunction();

/**
 * Helper for functions that stream Uint8Array to Dart (Dart: Stream<List<int>>, JS: Uint8Array).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const streamUint8Array = defineStreamFunction();

/**
 * Helper for functions that stream Maps to Dart (Dart: Stream<Map<dynamic, dynamic>>, JS: object).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const streamMap = defineStreamFunction();

/**
 * Helper for functions that stream Lists to Dart (Dart: Stream<List<dynamic>>, JS: object).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const streamList = defineStreamFunction();

/**
 * Helper for functions that stream Sets to Dart (Dart: Stream<Set<dynamic>>, JS: object).
 * 
 * @param {function} fn - The worker function to wrap
 * @returns {function} The wrapped worker function
 */
export const streamSet = defineStreamFunction();

/**
 * Typed SDK creator.
 *
 * @param {Object} def - SDK definition with init and functions
 * @param {Function} def.init - Initialization function that returns state
 * @param {Object} def.functions - Object containing worker functions
 * @returns {Object} The SDK definition
 */
export const defineSdk = returnFn();