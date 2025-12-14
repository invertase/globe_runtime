# Globe Runtime Types (@globe/runtime_types)

Type definitions and helpers for building Globe runtime SDKs. This package provides TypeScript utilities for defining strongly-typed SDKs that communicate with the Globe Dart runtime.

## Overview

`@globe/runtime_types` is used in conjunction with the Globe runtime to create JavaScript/TypeScript SDKs that can be called from Dart/Flutter applications. It provides type-safe wrappers for defining functions that return single values or streams, along with global Dart interop APIs.

## Installation

```bash
npm install @globe/runtime_types
```

## Core Concepts

### Module State

Your SDK maintains state that is initialized once and passed to all functions. Define your state type based on what data your functions need:

```typescript
type ModuleState = {
  apiUrl: string;
  timeout: number;
  userId: string;
};
```

### Worker Functions

Worker functions are async functions that receive:
- **state**: The object returned from `init()`
- **args**: Arguments passed from Dart (excluding callbackId)
- **callbackId**: A unique identifier for the callback (always last parameter)

Functions must not return values directly. Instead, they send data back to Dart using the `Dart` global object.

## API Reference

### SDK Definition

#### `defineSdk(definition)`

Define a typed SDK with initialization and functions.

```typescript
export default defineSdk({
  init(apiUrl: string = "https://api.example.com", timeout: number = 5000): ModuleState {
    return { apiUrl, timeout };
  },
  functions: {
    fetchUsers,
    calculatePrice,
    streamData,
  },
});
```

### Single Value Return Helpers

These helpers define functions that send a single value back to Dart.

#### `returnString<State, Args>(fn)`

Returns a string to Dart (Dart: `String`, JS: `string`).

```typescript
const fetchUser = returnString(
  async (state: ModuleState, userId: string, callbackId: number) => {
    const url = `${state.apiUrl}/users/${userId}`;
    const response = await fetch(url);
    const user = await response.json();
    Dart.send_value(callbackId, new TextEncoder().encode(JSON.stringify(user)));
  }
);
```

#### `returnInt<State, Args>(fn)`

Returns an integer to Dart (Dart: `int`, JS: `number`).

```typescript
const calculateSum = returnInt(
  (state: ModuleState, a: number, b: number, callbackId: number) => {
    const result = Math.floor(a + b);
    Dart.send_value(callbackId, new TextEncoder().encode(result.toString()));
  }
);
```

#### `returnDouble<State, Args>(fn)`

Returns a double-precision number to Dart (Dart: `double`, JS: `number`).

```typescript
const calculateAverage = returnDouble(
  (state: ModuleState, values: number[], callbackId: number) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    Dart.send_value(callbackId, new TextEncoder().encode(avg.toString()));
  }
);
```

#### `returnNumber<State, Args>(fn)`

Returns a generic number to Dart (Dart: `num`, JS: `number`).

#### `returnBoolean<State, Args>(fn)`

Returns a boolean to Dart (Dart: `bool`, JS: `boolean`).

```typescript
const isValid = returnBoolean(
  (state: ModuleState, value: string, callbackId: number) => {
    const valid = value.length > 0;
    Dart.send_value(callbackId, JsonPayload.encode(valid)!);
  }
);
```

#### `returnUint8Array<State, Args>(fn)`

Returns binary data to Dart (Dart: `List<int>`, JS: `Uint8Array`).

```typescript
const generateBytes = returnUint8Array(
  (state: ModuleState, length: number, callbackId: number) => {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    Dart.send_value(callbackId, bytes);
  }
);
```

#### `returnMap<State, Args>(fn)`

Returns a map/object to Dart (Dart: `Map<dynamic, dynamic>`, JS: `object`).

```typescript
const getMetadata = returnMap(
  (state: ModuleState, id: string, callbackId: number) => {
    const metadata = { id, url: state.apiUrl, timestamp: Date.now() };
    const encoded = JsonPayload.encode(metadata);
    if (encoded) {
      Dart.send_value(callbackId, encoded);
    }
  }
);
```

#### `returnList<State, Args>(fn)`

Returns a list to Dart (Dart: `List<dynamic>`, JS: `object`).

```typescript
const getItems = returnList(
  (state: ModuleState, count: number, callbackId: number) => {
    const items = Array.from({ length: count }, (_, i) => ({ id: i }));
    const encoded = JsonPayload.encode(items);
    if (encoded) {
      Dart.send_value(callbackId, encoded);
    }
  }
);
```

#### `returnSet<State, Args>(fn)`

Returns a set to Dart (Dart: `Set<dynamic>`, JS: `object`).

```typescript
const getUniqueValues = returnSet(
  (state: ModuleState, values: number[], callbackId: number) => {
    const unique = [...new Set(values)];
    const encoded = JsonPayload.encode(unique);
    if (encoded) {
      Dart.send_value(callbackId, encoded);
    }
  }
);
```

### Streaming Return Helpers

These helpers define functions that stream multiple values back to Dart.

#### `streamString<State, Args>(fn)`

Streams strings to Dart (Dart: `Stream<String>`, JS: `string`).

```typescript
const streamMessages = streamString(
  async (state: ModuleState, callbackId: number) => {
    for (let i = 0; i < 5; i++) {
      const message = `Message ${i}`;
      Dart.stream_value(callbackId, new TextEncoder().encode(message));
    }
    Dart.stream_value_end(callbackId);
  }
);
```

#### `streamInt<State, Args>(fn)`

Streams integers to Dart (Dart: `Stream<int>`, JS: `number`).

#### `streamDouble<State, Args>(fn)`

Streams doubles to Dart (Dart: `Stream<double>`, JS: `number`).

#### `streamNumber<State, Args>(fn)`

Streams numbers to Dart (Dart: `Stream<num>`, JS: `number`).

#### `streamBoolean<State, Args>(fn)`

Streams booleans to Dart (Dart: `Stream<bool>`, JS: `boolean`).

#### `streamUint8Array<State, Args>(fn)`

Streams binary data to Dart (Dart: `Stream<List<int>>`, JS: `Uint8Array`).

#### `streamMap<State, Args>(fn)`

Streams maps to Dart (Dart: `Stream<Map<dynamic, dynamic>>`, JS: `object`).

```typescript
const streamUpdates = streamMap(
  async (state: ModuleState, callbackId: number) => {
    for (let i = 0; i < 5; i++) {
      const update = { index: i, timestamp: Date.now() };
      const encoded = JsonPayload.encode(update);
      if (encoded) {
        Dart.stream_value(callbackId, encoded);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    Dart.stream_value_end(callbackId);
  }
);
```

#### `streamList<State, Args>(fn)`

Streams lists to Dart (Dart: `Stream<List<dynamic>>`, JS: `object`).

#### `streamSet<State, Args>(fn)`

Streams sets to Dart (Dart: `Stream<Set<dynamic>>`, JS: `object`).

### Dart Global APIs

The `Dart` global object provides methods for sending data back to the Dart runtime:

#### `Dart.send_value(callbackId, data)`

Sends a single value to Dart and completes the callback.

```typescript
Dart.send_value(callbackId, new TextEncoder().encode("result"));
```

#### `Dart.send_error(callbackId, error)`

Sends an error message to Dart and fails the callback.

```typescript
Dart.send_error(callbackId, "An error occurred");
```

#### `Dart.stream_value(callbackId, data)`

Sends a value as part of a stream. Use multiple times to emit multiple values.

```typescript
Dart.stream_value(callbackId, new TextEncoder().encode("chunk1"));
Dart.stream_value(callbackId, new TextEncoder().encode("chunk2"));
```

#### `Dart.stream_value_end(callbackId)`

Completes the stream. Must be called after all values have been sent.

```typescript
Dart.stream_value_end(callbackId);
```

### Payload Encoding

The `JsonPayload` global provides MessagePack-based encoding for complex data types:

#### `JsonPayload.encode(value)`

Encodes a JavaScript object/array to MessagePack bytes.

```typescript
const encoded = JsonPayload.encode({ key: "value" });
Dart.send_value(callbackId, encoded!);
```

#### `JsonPayload.decode(data)`

Decodes MessagePack bytes back to JavaScript objects.

```typescript
const decoded = JsonPayload.decode(bytes);
```

## Complete Example

```typescript
import {
  defineSdk,
  returnString,
  returnInt,
  streamString,
} from "@globe/runtime_types";

type ModuleState = {
  apiUrl: string;
  timeout: number;
};

const fetchUsers = streamString(
  async (state: ModuleState, callbackId: number) => {
    try {
      const response = await fetch(state.apiUrl + "/users");

      for await (const chunk of response.body!.values()) {
        Dart.stream_value(callbackId, chunk);
      }

      Dart.stream_value_end(callbackId);
    } catch (error) {
      Dart.send_error(callbackId, `Stream failed: ${error.message}`);
    }
  }
);

const calculatePrice = returnInt(
  (state: ModuleState, quantity: number, price: number, callbackId: number) => {
    const total = quantity * price;
    Dart.send_value(callbackId, new TextEncoder().encode(total.toString()));
  }
);

export default defineSdk({
  init(apiUrl: string = "https://api.example.com", timeout: number = 5000): ModuleState {
    return { apiUrl, timeout };
  },
  functions: {
    fetchUsers,
    calculatePrice,
  },
});
```

## Next Steps

Once you've defined your SDK, use the [@globe/dart_source_generator](https://www.npmjs.com/package/@globe/dart_source_generator) to generate Dart source files that can be used in your Flutter/Dart projects.

## License

See LICENSE for details.