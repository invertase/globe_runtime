/**
 * @typedef {number} CallbackId
 */

/**
 * Global Dart interop interface for sending data back to the Dart runtime.
 *
 * @typedef {Object} DartGlobal
 * @property {(callbackId: CallbackId, data: Uint8Array) => boolean} send_value - Sends data back to Dart from JavaScript.
 * @property {(callbackId: CallbackId, error: string) => boolean} send_error - Sends an error message back to Dart from JavaScript.
 * @property {(callbackId: CallbackId, data: Uint8Array) => boolean} stream_value - Sends data back to Dart from JavaScript.
 * @property {(callbackId: CallbackId, data?: Uint8Array) => boolean} stream_value_end - Sends data back to Dart from JavaScript.
 */

/**
 * Global payload encoding/decoding interface using MessagePack format.
 *
 * @typedef {Object} JsonPayloadGlobal
 * @property {(value: unknown) => Uint8Array | undefined} encode - Encoding payload using MessagePack
 * @property {(value: Uint8Array) => any} decode - Decoding payload using MessagePack
 */

/**
 * Global Dart interop object for communicating with the Dart runtime.
 * @global
 * @type {DartGlobal}
 */
globalThis.Dart ??= {};

/**
 * Global payload encoding/decoding utility using MessagePack.
 * @global
 * @type {JsonPayloadGlobal}
 */
globalThis.JsonPayload ??= {};

/**
 * @typedef {void | Promise<void>} WorkerFunctionReturn
 */

/**
 * @typedef {{ __dartType: "Map" }} DartMap
 */

/**
 * @typedef {{ __dartType: "List" }} DartList
 */

/**
 * @typedef {{ __dartType: "Set" }} DartSet
 */

/**
 * @template T
 * @typedef {void & { __dartReturnType?: T }} DartReturn
 */

/**
 * @template T
 * @typedef {void & { __dartStreamReturnType?: T }} DartStreamReturn
 */

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
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartReturn<any>} The wrapped worker function
 */
export const defineFunction = returnFn;

/**
 * Define a worker function that streams multiple values back to Dart.
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartStreamReturn<any>} The wrapped worker function
 */
export const defineStreamFunction = returnFn;

// ======================================================
//  Pre-configured Helpers - Single Value Returns
// ======================================================

/**
 * Helper for functions that return a string to Dart (Dart: String, JS: string).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartReturn<string>} The wrapped worker function
 */
export const returnString = defineFunction();

/**
 * Helper for functions that return an int to Dart (Dart: int, JS: number).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartReturn<number>} The wrapped worker function
 */
export const returnInt = defineFunction();

/**
 * Helper for functions that return a double to Dart (Dart: double, JS: number).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartReturn<number>} The wrapped worker function
 */
export const returnDouble = defineFunction();

/**
 * Helper for functions that return a number to Dart (Dart: num, JS: number).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartReturn<number>} The wrapped worker function
 */
export const returnNumber = defineFunction();

/**
 * Helper for functions that return a boolean to Dart (Dart: bool, JS: boolean).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartReturn<boolean>} The wrapped worker function
 */
export const returnBoolean = defineFunction();

/**
 * Helper for functions that return a Uint8Array to Dart (Dart: List<int>, JS: Uint8Array).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartReturn<Uint8Array>} The wrapped worker function
 */
export const returnUint8Array = defineFunction();

/**
 * Helper for functions that return a Map to Dart (Dart: Map<dynamic, dynamic>, JS: object).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartReturn<DartMap>} The wrapped worker function
 */
export const returnMap = defineFunction();

/**
 * Helper for functions that return a List to Dart (Dart: List<dynamic>, JS: object).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartReturn<DartList>} The wrapped worker function
 */
export const returnList = defineFunction();

/**
 * Helper for functions that return a Set to Dart (Dart: Set<dynamic>, JS: object).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartReturn<DartSet>} The wrapped worker function
 */
export const returnSet = defineFunction();

// ======================================================
//  Pre-configured Helpers - Streaming Returns
// ======================================================

/**
 * Helper for functions that stream strings to Dart (Dart: Stream<String>, JS: string).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartStreamReturn<string>} The wrapped worker function
 */
export const streamString = defineStreamFunction();

/**
 * Helper for functions that stream ints to Dart (Dart: Stream<int>, JS: number).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartStreamReturn<number>} The wrapped worker function
 */
export const streamInt = defineStreamFunction();

/**
 * Helper for functions that stream doubles to Dart (Dart: Stream<double>, JS: number).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartStreamReturn<number>} The wrapped worker function
 */
export const streamDouble = defineStreamFunction();

/**
 * Helper for functions that stream numbers to Dart (Dart: Stream<num>, JS: number).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartStreamReturn<number>} The wrapped worker function
 */
export const streamNumber = defineStreamFunction();

/**
 * Helper for functions that stream booleans to Dart (Dart: Stream<bool>, JS: boolean).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartStreamReturn<boolean>} The wrapped worker function
 */
export const streamBoolean = defineStreamFunction();

/**
 * Helper for functions that stream Uint8Array to Dart (Dart: Stream<List<int>>, JS: Uint8Array).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartStreamReturn<Uint8Array>} The wrapped worker function
 */
export const streamUint8Array = defineStreamFunction();

/**
 * Helper for functions that stream Maps to Dart (Dart: Stream<Map<dynamic, dynamic>>, JS: object).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartStreamReturn<DartMap>} The wrapped worker function
 */
export const streamMap = defineStreamFunction();

/**
 * Helper for functions that stream Lists to Dart (Dart: Stream<List<dynamic>>, JS: object).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartStreamReturn<DartList>} The wrapped worker function
 */
export const streamList = defineStreamFunction();

/**
 * Helper for functions that stream Sets to Dart (Dart: Stream<Set<dynamic>>, JS: object).
 *
 * @template State, Args
 * @param {(state: State, ...argsAndCallback: [...Args, CallbackId]) => WorkerFunctionReturn} fn - The worker function to wrap
 * @returns {(state: State, ...argsAndCallback: [...Args, CallbackId]) => DartStreamReturn<DartSet>} The wrapped worker function
 */
export const streamSet = defineStreamFunction();

/**
 * Typed SDK creator.
 *
 * @template InitFn, Fns, State, InitArgs
 * @param {Object} def - SDK definition with init and functions
 * @param {InitFn} def.init - Initialization function that returns state
 * @param {Fns} def.functions - Object containing worker functions
 * @returns {{init: InitFn, functions: Fns}} The SDK definition
 */
export const defineSdk = returnFn();