declare global {
  type DartValue = Uint8Array | undefined;

  interface DartGlobal {
    /**
     * Sends data back to Dart from JavaScript.
     *
     * @param callbackId - A unique identifier for the callback.
     * @param data - The data to send.
     * @returns {boolean} - Returns true if the data was sent successfully.
     */
    send_value: (callbackId: CallbackId, data: DartValue) => boolean;

    /**
     * Sends an error message back to Dart from JavaScript.
     *
     * @param callbackId - A unique identifier for the callback.
     * @param error - The error message to send.
     */
    send_error: (callbackId: CallbackId, error: string) => boolean;

    /**
     * Sends data back to Dart from JavaScript.
     *
     * @param callbackId - A unique identifier for the callback.
     * @param data - The data to send.
     * @returns {boolean} - Returns true if the data was sent successfully.
     */
    stream_value: (callbackId: CallbackId, data: DartValue) => boolean;

    /**
     * Sends data back to Dart from JavaScript.
     *
     * @param callbackId - A unique identifier for the callback.
     * @param data - The data to send.
     * @returns {boolean} - Returns true if the data was sent successfully.
     */
    stream_value_end: (callbackId: CallbackId, data?: DartValue) => boolean;
  }

  const Dart: DartGlobal;

  const JsonPayload: {
    // Encoding payload using MessagePack
    encode(value: unknown): DartValue;
    // Decoding payload using MessagePack
    decode(value: Uint8Array): any;
  };
}

/**
 * A callback identifier used by the Dart runtime.
 */
export type CallbackId = number;

/**
 * Worker functions must never return a value directly.
 * They must always send results using Dart.send_value or Dart.stream_value.
 */
export type WorkerFunctionReturn = void | Promise<void>;

/**
 * Marker types for Dart collection types
 */
export type DartMap = { __dartType: "Map" };
export type DartList = { __dartType: "List" };
export type DartSet = { __dartType: "Set" };

/**
 * Marker type for single-value Dart returns
 */
export type DartReturn<T> = void & { __dartReturnType?: T };

/**
 * Marker type for streaming Dart returns
 */
export type DartStreamReturn<T> = void & { __dartStreamReturnType?: T };

/**
 * A worker function receives:
 *   - state: the object returned from init()
 *   - args: arguments from Dart (excluding callbackId)
 *   - callbackId: always the last parameter
 *
 * T = the type of the value that will be encoded and sent via send_value/stream_value.
 * Args = argument types excluding callbackId.
 */
export type WorkerFunction<T, State, Args extends any[]> = (
  state: State,
  ...argsAndCallback: [...args: Args, callbackId: CallbackId]
) => DartReturn<T>;

export type StreamWorkerFunction<T, State, Args extends any[]> = (
  state: State,
  ...argsAndCallback: [...args: Args, callbackId: CallbackId]
) => DartStreamReturn<T>;

/**
 * Define a worker function that sends a single value back to Dart.
 *
 * @example
 * const myFunc = defineFunction<string>()(
 *   (state: ModuleState, value: number, callbackId: number) => {
 *     const result = processValue(value);
 *     Dart.send_value(callbackId, new TextEncoder().encode(result));
 *   }
 * );
 */
export function defineFunction<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartReturn<any>;

/**
 * Define a worker function that streams multiple values back to Dart.
 *
 * @example
 * const myStreamFunc = defineStreamFunction<string>()(
 *   (state: ModuleState, value: number, callbackId: number) => {
 *     Dart.stream_value(callbackId, new TextEncoder().encode("chunk1"));
 *     Dart.stream_value(callbackId, new TextEncoder().encode("chunk2"));
 *     Dart.stream_value_end(callbackId);
 *   }
 * );
 */
export function defineStreamFunction<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartStreamReturn<any>;

// ======================================================
//  Pre-configured Helpers - Single Value Returns
// ======================================================

/**
 * Helper for functions that return a string to Dart (Dart: String, JS: string).
 * @example
 * const myFunc = returnString((state, value, callbackId) => {
 *   Dart.send_value(callbackId, new TextEncoder().encode("result"));
 * });
 */
export function returnString<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartReturn<string>;

/**
 * Helper for functions that return an int to Dart (Dart: int, JS: number).
 * @example
 * const myFunc = returnInt((state, value, callbackId) => {
 *   const result = 42;
 *   Dart.send_value(callbackId, new TextEncoder().encode(result.toString()));
 * });
 */
export function returnInt<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartReturn<number>;

/**
 * Helper for functions that return a double to Dart (Dart: double, JS: number).
 * @example
 * const myFunc = returnDouble((state, value, callbackId) => {
 *   const result = 3.14;
 *   Dart.send_value(callbackId, new TextEncoder().encode(result.toString()));
 * });
 */
export function returnDouble<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartReturn<number>;

/**
 * Helper for functions that return a number to Dart (Dart: num, JS: number).
 * @example
 * const myFunc = returnNumber((state, value, callbackId) => {
 *   Dart.send_value(callbackId, new TextEncoder().encode("42"));
 * });
 */
export function returnNumber<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartReturn<number>;

/**
 * Helper for functions that return a boolean to Dart (Dart: bool, JS: boolean).
 * @example
 * const myFunc = returnBoolean((state, value, callbackId) => {
 *   Dart.send_value(callbackId, new TextEncoder().encode("true"));
 * });
 */
export function returnBoolean<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartReturn<boolean>;

/**
 * Helper for functions that return a Uint8Array to Dart (Dart: List<int>, JS: Uint8Array).
 * @example
 * const myFunc = returnUint8Array((state, value, callbackId) => {
 *   Dart.send_value(callbackId, new Uint8Array([1, 2, 3]));
 * });
 */
export function returnUint8Array<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartReturn<Uint8Array>;

/**
 * Helper for functions that return a Map to Dart (Dart: Map<dynamic, dynamic>, JS: object).
 * @example
 * const myFunc = returnMap((state, value, callbackId) => {
 *   const encoded = JsonPayload.encode({ key: "value" });
 *   Dart.send_value(callbackId, encoded!);
 * });
 */
export function returnMap<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartReturn<DartMap>;

/**
 * Helper for functions that return a List to Dart (Dart: List<dynamic>, JS: object).
 * @example
 * const myFunc = returnList((state, value, callbackId) => {
 *   const encoded = JsonPayload.encode([1, 2, 3]);
 *   Dart.send_value(callbackId, encoded!);
 * });
 */
export function returnList<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartReturn<DartList>;

/**
 * Helper for functions that return a Set to Dart (Dart: Set<dynamic>, JS: object).
 * @example
 * const myFunc = returnSet((state, value, callbackId) => {
 *   const encoded = JsonPayload.encode([1, 2, 3]); // Sets are encoded as arrays
 *   Dart.send_value(callbackId, encoded!);
 * });
 */
export function returnSet<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartReturn<DartSet>;

// ======================================================
//  Pre-configured Helpers - Streaming Returns
// ======================================================

/**
 * Helper for functions that stream strings to Dart (Dart: Stream<String>, JS: string).
 * @example
 * const myFunc = streamString((state, count, callbackId) => {
 *   Dart.stream_value(callbackId, new TextEncoder().encode("chunk1"));
 *   Dart.stream_value_end(callbackId);
 * });
 */
export function streamString<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartStreamReturn<string>;

/**
 * Helper for functions that stream ints to Dart (Dart: Stream<int>, JS: number).
 */
export function streamInt<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartStreamReturn<number>;

/**
 * Helper for functions that stream doubles to Dart (Dart: Stream<double>, JS: number).
 */
export function streamDouble<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartStreamReturn<number>;

/**
 * Helper for functions that stream numbers to Dart (Dart: Stream<num>, JS: number).
 */
export function streamNumber<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartStreamReturn<number>;

/**
 * Helper for functions that stream booleans to Dart (Dart: Stream<bool>, JS: boolean).
 */
export function streamBoolean<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartStreamReturn<boolean>;

/**
 * Helper for functions that stream Uint8Array to Dart (Dart: Stream<List<int>>, JS: Uint8Array).
 */
export function streamUint8Array<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartStreamReturn<Uint8Array>;

/**
 * Helper for functions that stream Maps to Dart (Dart: Stream<Map<dynamic, dynamic>>, JS: object).
 */
export function streamMap<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartStreamReturn<DartMap>;

/**
 * Helper for functions that stream Lists to Dart (Dart: Stream<List<dynamic>>, JS: object).
 */
export function streamList<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartStreamReturn<DartList>;

/**
 * Helper for functions that stream Sets to Dart (Dart: Stream<Set<dynamic>>, JS: object).
 */
export function streamSet<State, Args extends any[]>(
  fn: (state: State, ...args: Args) => WorkerFunctionReturn
): (state: State, ...args: Args) => DartStreamReturn<DartSet>;

export interface SdkDefinition<
  InitArgs extends any[],
  State,
  Fns extends Record<string, any>
> {
  init: (...args: InitArgs) => State;
  functions: Fns;
}

/**
 * The resolved SDK type after calling defineSdk().
 */
export interface Sdk<
  InitFn extends (...args: any) => any,
  Fns extends Record<string, any>
> {
  init: InitFn;
  functions: Fns;
}

/**
 * Typed SDK creator.
 *
 * @example
 * const sdk = defineSdk({
 *   init(a: string, b: number) {
 *     return { a, b };
 *   },
 *   functions: {
 *     myFunc: returnString((state: {a: string, b: number}, x: string, callbackId) => { ... })
 *   }
 * });
 *
 * All worker functions MUST return DartReturn<T> | DartStreamReturn<T>.
 */
export function defineSdk<
  Def extends {
    init?: (...args: any) => any;
    functions: Record<string, any>;
  }
>(
  def: Def
): Def &
  Sdk<
    Def["init"] extends (...args: any) => any ? Def["init"] : () => void,
    Def["functions"]
  >;

export {};
