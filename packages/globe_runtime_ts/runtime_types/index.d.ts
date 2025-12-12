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
) => WorkerFunctionReturn;

// ======================================================
//  SDK Definition Structure
// ======================================================

/**
 * The overall shape of the SDK module.
 *
 * init(...args) -> state
 * functions: { ...worker functions... }
 *
 * Fns is an object whose keys are string function names and whose values
 * are WorkerFunction instances.
 */
// Helper types to validate worker functions structure.
// This is necessary because strict constraints on generic Fns would fail due to contravariance
// when concrete functions with specific arguments are provided.
type ValidateWorker<F, State> = F extends (
  state: infer S,
  ...args: infer P
) => infer R
  ? State extends S
    ? P extends [...any[], CallbackId]
      ? R extends WorkerFunctionReturn
        ? F
        : never
      : never
    : never
  : never;

type ValidateFns<Fns, State> = {
  [K in keyof Fns]: ValidateWorker<Fns[K], State>;
};

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
export type Sdk<
  InitArgs extends any[],
  State,
  Fns extends Record<string, any>
> = SdkDefinition<InitArgs, State, Fns>;

// ======================================================
//  defineSdk Helper
// ======================================================

/**
 * Typed SDK creator.
 *
 * Example:
 * ```ts
 * const sdk = defineSdk({
 *   init(a: string, b: number) {
 *     return { a, b };
 *   },
 *   functions: {
 *     myFunc: <T = string>(state: {a: string, b: number}, x: string, callbackId: number) => { ... }
 *  }
 * });
 * ```
 *
 * All worker functions MUST return void | Promise<void>.
 */
export declare function defineSdk<
  InitArgs extends any[],
  State,
  Fns extends Record<string, any>
>(
  def: SdkDefinition<InitArgs, State, Fns> & {
    functions: ValidateFns<Fns, NoInfer<State>>;
  }
): Sdk<InitArgs, State, Fns>;

export {};
