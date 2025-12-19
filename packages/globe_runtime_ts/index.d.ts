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
    send_value: (callbackId: number, data: DartValue) => boolean;

    /**
     * Sends an error message back to Dart from JavaScript.
     *
     * @param callbackId - A unique identifier for the callback.
     * @param error - The error message to send.
     */
    send_error: (callbackId: number, error: string) => boolean;

    /**
     * Sends data back to Dart from JavaScript.
     *
     * @param callbackId - A unique identifier for the callback.
     * @param data - The data to send.
     * @returns {boolean} - Returns true if the data was sent successfully.
     */
    stream_value: (callbackId: number, data: DartValue) => boolean;

    /**
     * Sends data back to Dart from JavaScript.
     *
     * @param callbackId - A unique identifier for the callback.
     * @param data - The data to send.
     * @returns {boolean} - Returns true if the data was sent successfully.
     */
    stream_value_end: (
      callbackId: number,
      data?:DartValue
    ) => boolean;
  }

  const Dart: DartGlobal;

  const JsonPayload: {
    // Encoding payload using MessagePack
    encode(value: unknown): DartValue;
    // Decoding payload using MessagePack
    decode(value: Uint8Array): any;
  };
}

export {};
