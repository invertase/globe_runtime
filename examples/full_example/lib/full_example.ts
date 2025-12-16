import pretty_bytes from "pretty-bytes";
import pretty_ms from "pretty-ms";
import {
  defineSdk,
  returnString,
  returnInt,
  returnDouble,
  returnBoolean,
  returnUint8Array,
  returnMap,
  returnList,
  returnSet,
  streamString,
  streamInt,
  streamNumber,
  streamMap,
  streamList,
} from "@globe/runtime_types";

type Language = "en" | "fr" | "es";

type ModuleState = {
  language: Language;
  verbose: boolean;
};

// ======================================================
//  Single Value Functions - All Supported Types
// ======================================================

// String return (Dart: String, JS: string)
const make_pretty_bytes = returnString(
  (state: ModuleState, value: number, callbackId: number) => {
    const str = pretty_bytes(value, { locale: state.language });
    Dart.send_value(callbackId, new TextEncoder().encode(str));
  }
);

// String return (Dart: String, JS: string)
const make_pretty_ms = returnString(
  (state: ModuleState, value: number, callbackId: number) => {
    const str = pretty_ms(value, { verbose: state.verbose });
    Dart.send_value(callbackId, new TextEncoder().encode(str));
  }
);

// Int return (Dart: int, JS: number)
const calculate_sum = returnInt(
  (state: ModuleState, a: number, b: number, callbackId: number) => {
    const result = Math.floor(a + b);
    Dart.send_value(callbackId, new TextEncoder().encode(result.toString()));
  }
);

// Double return (Dart: double, JS: number)
const calculate_average = returnDouble(
  (state: ModuleState, values: number[], callbackId: number) => {
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    Dart.send_value(callbackId, new TextEncoder().encode(avg.toString()));
  }
);

// Boolean return (Dart: bool, JS: boolean)
const is_valid = returnBoolean(
  (state: ModuleState, value: string, callbackId: number) => {
    const isValid = value.length > 0;
    Dart.send_value(callbackId, JsonPayload.encode(isValid)!);
  }
);

// Uint8Array return (Dart: List<int>, JS: Uint8Array)
const generate_bytes = returnUint8Array(
  (state: ModuleState, length: number, callbackId: number) => {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    Dart.send_value(callbackId, bytes);
  }
);

// Map return (Dart: Map<dynamic, dynamic>, JS: object)
const get_metadata = returnMap(
  (state: ModuleState, id: string, callbackId: number) => {
    const metadata = {
      id,
      language: state.language,
      timestamp: Date.now(),
      nested: {
        key: "value",
      },
    };
    const encoded = JsonPayload.encode(metadata);
    if (encoded) {
      Dart.send_value(callbackId, encoded);
    }
  }
);

// List return (Dart: List<dynamic>, JS: object)
const get_items = returnList(
  (state: ModuleState, count: number, callbackId: number) => {
    const items = Array.from({ length: count }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    const encoded = JsonPayload.encode(items);
    if (encoded) {
      Dart.send_value(callbackId, encoded);
    }
  }
);

// Set return (Dart: Set<dynamic>, JS: object)
const get_unique_values = returnSet(
  (state: ModuleState, values: number[], callbackId: number) => {
    const uniqueValues = [...new Set(values)];
    const encoded = JsonPayload.encode(uniqueValues);
    if (encoded) {
      Dart.send_value(callbackId, encoded);
    }
  }
);

// ======================================================
//  Streaming Functions - All Supported Types
// ======================================================

// Stream<String> (Dart: Stream<String>, JS: string)
const stream_messages = streamString(
  (state: ModuleState, count: number, callbackId: number) => {
    for (let i = 0; i < count; i++) {
      const message = `Message ${i + 1} in ${state.language}`;
      Dart.stream_value(callbackId, new TextEncoder().encode(message));
    }
    Dart.stream_value_end(callbackId);
  }
);

// Stream<int> (Dart: Stream<int>, JS: number)
const stream_integers = streamInt(
  (state: ModuleState, max: number, callbackId: number) => {
    for (let i = 0; i < max; i++) {
      Dart.stream_value(callbackId, new TextEncoder().encode(i.toString()));
    }
    Dart.stream_value_end(callbackId);
  }
);

// Stream<num> (Dart: Stream<num>, JS: number)
const stream_random_numbers = streamNumber(
  (state: ModuleState, count: number, callbackId: number) => {
    for (let i = 0; i < count; i++) {
      const num = Math.random() * 1000;
      Dart.stream_value(callbackId, new TextEncoder().encode(num.toString()));
    }
    Dart.stream_value_end(callbackId);
  }
);

// Stream<Map<dynamic, dynamic>> (Dart: Stream<Map<dynamic, dynamic>>, JS: object)
const stream_updates = streamMap(
  async (state: ModuleState, count: number, callbackId: number) => {
    for (let i = 0; i < count; i++) {
      const update = {
        index: i,
        timestamp: Date.now(),
        language: state.language,
      };
      // Pause for 100ms
      await new Promise((resolve) => setTimeout(resolve, 100));
      const encoded = JsonPayload.encode(update);
      if (encoded) {
        Dart.stream_value(callbackId, encoded);
      }
    }
    Dart.stream_value_end(callbackId);
  }
);

// Stream<List<dynamic>> (Dart: Stream<List<dynamic>>, JS: object)
const stream_batches = streamList(
  (
    state: ModuleState,
    batchCount: number,
    batchSize: number,
    callbackId: number
  ) => {
    for (let i = 0; i < batchCount; i++) {
      const batch = Array.from(
        { length: batchSize },
        (_, j) => i * batchSize + j
      );
      const encoded = JsonPayload.encode(batch);
      if (encoded) {
        Dart.stream_value(callbackId, encoded);
      }
    }
    Dart.stream_value_end(callbackId);
  }
);

// ======================================================
//  SDK Definition
// ======================================================

export default defineSdk({
  init(language: Language = "en", verbose: boolean = false): ModuleState {
    return { language, verbose };
  },
  functions: {
    // Single value functions
    make_pretty_bytes,
    make_pretty_ms,
    calculate_sum,
    calculate_average,
    is_valid,
    generate_bytes,
    get_metadata,
    get_items,
    get_unique_values,

    // Streaming functions
    stream_messages,
    stream_integers,
    stream_random_numbers,
    stream_updates,
    stream_batches,
  },
});
