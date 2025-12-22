import {
  defineSdk,
  returnMap,
  returnNumber,
  streamString,
} from "@globe/runtime_types";

type ModuleState = {
  apiUrl: string;
  timeout?: number;
};

export default defineSdk({
  /**
   * Initialize the SDK with authentication credentials
   *
   * This sets up the SDK with your API key and configures the timeout
   * for all network requests.
   *
   * @param apiUrl - Your API url to fetch data from
   * @param timeout - Request timeout in milliseconds
   */
  init(apiUrl: string, timeout?: number): ModuleState {
    const defaultTimeoutMs = 5000;
    return { apiUrl, timeout: timeout ?? defaultTimeoutMs };
  },
  functions: {
    /**
     * Stream all users from the API
     *
     * @returns A list of users encoded as a JSON string
     */
    streamAllUsers: streamString(
      async (state: ModuleState, callbackId: number) => {
        try {
          const url = `${state.apiUrl}/users`;

          const response = await fetch(url);

          if (!response.body) {
            Dart.send_error(callbackId, "Response body is null");
            return;
          }

          for await (const chunk of response.body.values()) {
            Dart.stream_value(callbackId, chunk);
          }

          Dart.stream_value_end(callbackId);
        } catch (error) {
          Dart.send_error(
            callbackId,
            `Streaming users failed: ${(error as Error).message}`
          );
        }
      }
    ),

    /**
     * Fetches user data from the API
     *
     * This function retrieves user information based on the provided user ID.
     * It handles authentication automatically using the configured API key.
     *
     * @param userId - The unique identifier for the user
     * @returns A JSON string containing the user's profile information
     */
    getUserData: returnMap(
      async (state: ModuleState, userId: number, callbackId: number) => {
        try {
          const url = `${state.apiUrl}/users/${userId}`;

          const response = await fetch(url);

          const data = await response.json();

          const encoded = JsonPayload.encode(data);
          if (!encoded) {
            Dart.send_error(callbackId, "Failed to encode response");
            return;
          }

          Dart.send_value(callbackId, encoded);
        } catch (error) {
          Dart.send_error(
            callbackId,
            `Fetching user data with userId (${userId}) failed: ${
              (error as Error).message
            }`
          );
        }
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
        try {
          const sum = a + b;
          Dart.send_value(callbackId, JsonPayload.encode(sum));
        } catch (error) {
          Dart.send_error(
            callbackId,
            `Calculating sum of ${a} and ${b} failed: ${
              (error as Error).message
            }`
          );
        }
      }
    ),
  },
});
