# Globe Runtime

[![Pub](https://img.shields.io/pub/v/globe_runtime.svg)](https://pub.dev/packages/globe_runtime)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A **minimalist runtime** designed to leverage the JavaScript ecosystem and its tools to accelerate development in **Dart**. Globe Runtime enables seamless **communication between Dart and JavaScript** by utilizing Dart FFI, V8, Rust, and Deno extensions.

## 🚀 Quick Start

### Installation

Add Globe Runtime to your `pubspec.yaml`:

```yaml
dependencies:
  globe_runtime: ^1.0.7
```

### Basic Usage

Here's a simple example that calls a JavaScript function from Dart:

```dart
import 'dart:async';
import 'dart:convert';
import 'package:globe_runtime/globe_runtime.dart';

// Create a module from a JavaScript file
final module = FileModule(
  name: 'MyModule',
  filePath: 'lib/my_module.js',
);

// Call a JavaScript function
Future<String> callJsFunction(String functionName, {List<FFIConvertible> args = const []}) async {
  final completer = Completer<String>();

  module.callFunction(
    functionName,
    args: args,
    onData: (data) {
      if (data.hasError()) {
        completer.completeError(data.error);
      } else {
        completer.complete(utf8.decode(data.data));
      }
      return true; // Unregister callback
    },
  );

  return completer.future;
}

void main() async {
  // Register the module
  await module.register();

  // Call JavaScript function
  final result = await callJsFunction('greet', args: ['World'.toFFIType]);
  print(result); // Output: Hello, World!
}
```

And your JavaScript module (`lib/my_module.js`):

```javascript
const sdk = {
  init: function () {
    return {};
  },
  functions: {
    greet: function (_, name, callbackId) {
      const greeting = `Hello, ${name}!`;
      const result = new TextEncoder().encode(greeting);
      Dart.send_value(callbackId, result);
    },
  },
};

export default sdk;
```

## 📚 Core Concepts

### What is Globe Runtime?

Globe Runtime is a **bridge** that allows you to call JavaScript code from Dart applications. Unlike full-fledged JavaScript runtimes like Deno or Node.js, Globe Runtime is specifically designed to **integrate Dart with JavaScript tools and libraries** efficiently.

### Key Features

- **🔗 Seamless Dart-JavaScript Interop**: Call JavaScript functions directly from Dart
- **📦 JavaScript Ecosystem Access**: Use any JavaScript library or npm package
- **⚡ Lightweight**: Minimal overhead compared to full JavaScript runtimes
- **🔄 Bidirectional Communication**: Send data both ways with proper type conversion
- **📡 Network Capabilities**: Built-in `fetch` API support
- **🔄 Streaming Support**: Handle real-time data streams
- **🔧 Multiple Module Types**: File-based, remote, or inline modules

### How It Works

Globe Runtime embeds **V8 within Rust** and exposes key APIs through Dart FFI:

1. **Module Registration**: Load JavaScript code into the runtime
2. **Function Calls**: Execute JavaScript functions from Dart
3. **Data Exchange**: Convert between Dart and JavaScript types automatically
4. **Callback Handling**: Manage asynchronous responses and streams

## 🛠️ Module Types

Globe Runtime supports three types of modules:

### 1. FileModule

Load JavaScript code from a local file:

```dart
final module = FileModule(
  name: 'MyModule',
  filePath: 'lib/my_module.js',
);
```

### 2. RemoteModule

Load JavaScript code from a remote URL:

```dart
final module = RemoteModule(
  name: 'RemoteModule',
  url: 'https://example.com/module.js',
);
```

### 3. InlinedModule

Embed JavaScript code directly in your Dart code:

```dart
final module = InlinedModule(
  name: 'InlineModule',
  sourceCode: '''
const sdk = {
  init: function () { return {}; },
  functions: {
    hello: function (_, callbackId) {
      const result = new TextEncoder().encode('Hello from inline!');
      Dart.send_value(callbackId, result);
    },
  },
};
export default sdk;
''',
);
```

## 📊 Data Types & Conversion

Globe Runtime automatically converts between Dart and JavaScript types:

### Supported Types

| Dart Type            | JavaScript Type | FFI Type         |
| -------------------- | --------------- | ---------------- |
| `String`             | `string`        | `FFIString`      |
| `int`                | `number`        | `FFIInt`         |
| `double`             | `number`        | `FFIDouble`      |
| `bool`               | `boolean`       | `FFIBool`        |
| `List<int>`          | `Uint8Array`    | `FFIBytes`       |
| `Map`, `List`, `Set` | `object`        | `FFIJsonPayload` |

### Type Conversion Examples

```dart
// Basic types
module.callFunction('process', args: [
  'Hello'.toFFIType,           // String
  42.toFFIType,                // int
  3.14.toFFIType,              // double
  true.toFFIType,              // bool
]);

// Complex objects (automatically serialized as JSON)
final user = {
  'name': 'John',
  'age': 30,
  'hobbies': ['coding', 'reading'],
};
module.callFunction('processUser', args: [user.toFFIType]);
```

## 🔄 Asynchronous Operations

### Promise-based Functions

Handle JavaScript promises and async/await:

```dart
Future<Map<String, dynamic>> fetchData(String url) async {
  final completer = Completer<Map<String, dynamic>>();

  module.callFunction(
    'fetchData',
    args: [url.toFFIType],
    onData: (data) {
      if (data.hasError()) {
        completer.completeError(data.error);
      } else {
        // Unpack JSON data
        final result = Map<String, dynamic>.from(data.data.unpack());
        completer.complete(result);
      }
      return true;
    },
  );

  return completer.future;
}
```

JavaScript side:

```javascript
const sdk = {
  init: function () {
    return {};
  },
  functions: {
    fetchData: async function (_, url, callbackId) {
      try {
        const response = await fetch(url);
        const data = await response.json();

        const encoded = JsonPayload.encode(data);
        if (!encoded) {
          Dart.send_error(callbackId, "Failed to encode response");
          return;
        }

        Dart.send_value(callbackId, encoded);
      } catch (err) {
        Dart.send_error(callbackId, `Fetch failed: ${err.message}`);
      }
    },
  },
};
export default sdk;
```

### Streaming Data

Handle real-time data streams:

```dart
Stream<String> streamData(String url) {
  final streamController = StreamController<String>();

  module.callFunction(
    'streamData',
    args: [url.toFFIType],
    onData: (data) {
      if (data.hasError()) {
        streamController.addError(data.error);
        return true;
      }

      if (data.hasData()) {
        final chunk = utf8.decode(data.data);
        streamController.add(chunk);
      }

      if (data.done) {
        streamController.close();
        return true;
      }

      return false; // Keep listening for more data
    },
  );

  return streamController.stream;
}
```

JavaScript streaming:

```javascript
const sdk = {
  init: function () {
    return {};
  },
  functions: {
    streamData: async function (_, url, callbackId) {
      try {
        const response = await fetch(url);

        for await (const chunk of response.body.values()) {
          Dart.stream_value(callbackId, chunk);
        }

        Dart.stream_value_end(callbackId);
      } catch (err) {
        Dart.send_error(callbackId, `Stream failed: ${err.message}`);
      }
    },
  },
};
export default sdk;
```

## 🏗️ Advanced Patterns

### Module Initialization with Arguments

Pass initialization arguments to your JavaScript modules:

```dart
// Register with arguments
await module.register(args: [
  'api_key_123'.toFFIType,
  'production'.toFFIType,
]);
```

JavaScript module with initialization:

```javascript
const sdk = {
  init: function (apiKey, environment) {
    return { apiKey, environment };
  },
  functions: {
    makeRequest: function (state, endpoint, callbackId) {
      const headers = {
        Authorization: `Bearer ${state.apiKey}`,
        "X-Environment": state.environment,
      };

      fetch(endpoint, { headers })
        .then((response) => response.json())
        .then((data) => {
          const encoded = JsonPayload.encode(data);
          Dart.send_value(callbackId, encoded);
        })
        .catch((err) => {
          Dart.send_error(callbackId, err.message);
        });
    },
  },
};
export default sdk;
```

### Error Handling

Comprehensive error handling patterns:

```dart
Future<T> safeCall<T>(String functionName, {List<FFIConvertible> args = const []}) async {
  final completer = Completer<T>();

  try {
    module.callFunction(
      functionName,
      args: args,
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(GlobeRuntimeException(data.error));
        } else {
          try {
            final result = data.data.unpack();
            completer.complete(result);
          } catch (e) {
            completer.completeError(DataParsingException(e.toString()));
          }
        }
        return true;
      },
    );
  } catch (e) {
    completer.completeError(FunctionCallException(e.toString()));
  }

  return completer.future;
}

// Custom exception classes
class GlobeRuntimeException implements Exception {
  final String message;
  GlobeRuntimeException(this.message);

  @override
  String toString() => 'GlobeRuntimeException: $message';
}

class DataParsingException implements Exception {
  final String message;
  DataParsingException(this.message);

  @override
  String toString() => 'DataParsingException: $message';
}

class FunctionCallException implements Exception {
  final String message;
  FunctionCallException(this.message);

  @override
  String toString() => 'FunctionCallException: $message';
}
```

## 🔧 JavaScript Module Structure

Every JavaScript module must follow this structure:

```javascript
const sdk = {
  // Initialize the module and return state
  init: function (...args) {
    // args are the arguments passed from Dart during registration
    return {
      // Return any state you want to persist
      config: args[0],
      environment: args[1],
    };
  },

  // Define your functions
  functions: {
    // Function signature: (state, ...args, callbackId)
    myFunction: function (state, arg1, arg2, callbackId) {
      // state: The object returned from init()
      // arg1, arg2: Arguments passed from Dart
      // callbackId: Unique identifier for this call

      try {
        // Your logic here
        const result = processData(arg1, arg2);

        // Send result back to Dart
        const encoded = JsonPayload.encode(result);
        Dart.send_value(callbackId, encoded);
      } catch (error) {
        // Send error back to Dart
        Dart.send_error(callbackId, error.message);
      }
    },

    // Async function example
    asyncFunction: async function (state, url, callbackId) {
      try {
        const response = await fetch(url);
        const data = await response.json();

        const encoded = JsonPayload.encode(data);
        Dart.send_value(callbackId, encoded);
      } catch (error) {
        Dart.send_error(callbackId, error.message);
      }
    },
  },
};

export default sdk;
```

### Available JavaScript APIs

In your JavaScript modules, you have access to:

- **`Dart.send_value(callbackId, data)`**: Send data back to Dart
- **`Dart.send_error(callbackId, error)`**: Send error back to Dart
- **`Dart.stream_value(callbackId, chunk)`**: Send streaming data
- **`Dart.stream_value_end(callbackId)`**: End streaming
- **`JsonPayload.encode(data)`**: Encode data as JSON payload
- **`fetch()`**: Make HTTP requests
- **`TextEncoder`/`TextDecoder`**: Text encoding utilities

## 📦 Working with NPM Packages

Globe Runtime supports using NPM packages through a bundling approach. This allows you to use any JavaScript library in your Dart applications.

### Recommended Approach: Using @globe/dart_source_generator (Easiest)

The **recommended way** to create Globe Runtime SDKs is using the `@globe/dart_source_generator` CLI with `@globe/runtime_types`. This provides:

- **Type-safe SDK definitions** with full TypeScript support
- **Automatic bundling** of your code with all dependencies
- **Seamless Dart integration** with generated wrapper classes
- **Hot reload support** in watch mode during development

#### Step 1: Set up your TypeScript SDK

Create a new directory for your SDK and initialize it:

```bash
mkdir my_sdk
cd my_sdk
npm init -y
npm install @globe/runtime_types @globe/dart_source_generator -D
```

#### Step 2: Define your SDK in TypeScript

Create `src/sdk.ts`:

```typescript
import { defineSdk, returnString, streamString } from "@globe/runtime_types";

type ModuleState = {
  apiUrl: string;
  timeout: number;
};

const fetchUsers = streamString(
  async (state: ModuleState, callbackId: number) => {
    try {
      const url = `${state.apiUrl}/users`;
      const response = await fetch(url, { 
        signal: AbortSignal.timeout(state.timeout) 
      });

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

#### Step 3: Generate Dart source files

Run the generator:

```bash
npx @globe/dart_source_generator --files src/sdk.ts --output lib/generated/
```

This generates `lib/generated/sdk_source.dart` containing the bundled JavaScript code.

#### Step 4: Use in your Dart project

Add to your `pubspec.yaml`:

```yaml
dependencies:
  globe_runtime: ^1.0.7
```

Then use in your Dart code:

```dart
import 'dart:async';
import 'package:your_package/generated/sdk_source.dart';

void main() async {
  // Create an instance of your SDK with initialization parameters
  final sdk = await Sdk.create(
    apiUrl: 'https://api.custom.com',
    timeout: 10000,
  );

  // Call single-value functions (returns a Future)
  final price = await sdk.calculatePrice(10, 99);
  print('Total Price: $price');

  // Call streaming functions (returns a Stream)
  final userStream = await sdk.fetchUsers();
  
  final completer = Completer<void>();
  userStream.listen((user) {
    print('User: $user');
  }, onDone: completer.complete);

  await completer.future;

  // Clean up when done
  sdk.dispose();
}
```

The `@globe/dart_source_generator` automatically generates the SDK wrapper class with type-safe methods that handle all the Dart FFI interop boilerplate. You simply call methods and get properly typed `Future` or `Stream` objects back.

For more details, see the [@globe/dart_source_generator documentation](https://www.npmjs.com/package/@globe/dart_source_generator) and [@globe/runtime_types documentation](https://www.npmjs.com/package/@globe/runtime_types).

---

### Alternative Approach 1: Using esbuild (JavaScript - Simpler)

#### Step 1: Create package.json

```json
{
  "name": "my_module",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "esbuild": "^0.23.0"
  },
  "scripts": {
    "build": "node build.mjs"
  }
}
```

#### Step 2: Create build script (build.mjs)

```javascript
import * as esbuild from 'esbuild';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import pkg from './package.json' with { type: 'json' };

const dartFileName = `${pkg.name}_source.dart`;

// Bundle the JavaScript using esbuild
const result = await esbuild.build({
    entryPoints: ['lib/my_module.js'],
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'browser',
    write: false,
});

// Get the bundled source code
const jsSource = result.outputFiles[0].text;

// Write the source code into the .dart file
const dartFileContent = `// GENERATED FILE — DO NOT MODIFY BY HAND
const packageVersion = '${pkg.version}';
const packageSource = r'''
${jsSource}
''';
`;

writeFileSync(resolve(`lib/${dartFileName}`), dartFileContent);
console.log(`✅ Created lib/${dartFileName}`);
```

#### Step 3: Create JavaScript module (lib/my_module.js)

```javascript
import { sum } from "lodash";

const sdk = {
  init: function () {
    return {};
  },
  functions: {
    addNumbers: function (_, numbers, callbackId) {
      try {
        const result = sum(numbers);
        const encoded = JsonPayload.encode(result);
        Dart.send_value(callbackId, encoded);
      } catch (error) {
        Dart.send_error(callbackId, error.message);
      }
    },
  },
};

export default sdk;
```

#### Step 4: Install dependencies and build

```bash
# Install NPM packages
npm install

# Build the module (creates lib/my_module_source.dart)
npm run build
```

#### Step 5: Use in Dart

```dart
import 'dart:async';
import 'package:globe_runtime/globe_runtime.dart';
import 'my_module_source.dart';

class MyModule {
  final Module _module;

  MyModule._(this._module);

  static Future<MyModule> create() async {
    final module = InlinedModule(
      name: 'MyModule',
      sourceCode: packageSource,
    );

    await module.register();
    return MyModule._(module);
  }

  Future<num> addNumbers(List<num> numbers) async {
    final completer = Completer<num>();

    _module.callFunction(
      'addNumbers',
      args: [numbers.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          final result = data.data.unpack() as num;
          completer.complete(result);
        }
        return true;
      },
    );

    return completer.future;
  }
}

// Usage
void main() async {
  final module = await MyModule.create();
  final result = await module.addNumbers([1, 2, 3, 4, 5]);
  print('Sum: $result'); // Output: Sum: 15
}
```

### Alternative Approach 2: Using tsup (TypeScript)

#### Step 1: Create package.json

```json
{
  "name": "my_module",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "@globe/runtime_types": "https://gitpkg.now.sh/invertase/globe_runtime/packages/globe_runtime_ts?main",
    "tsup": "^8.3.6",
    "typescript": "^5.8.3"
  },
  "scripts": {
    "build": "tsup"
  }
}
```

#### Step 2: Create tsup.config.ts

```typescript
import { defineConfig } from "tsup";
import { version, name } from "./package.json";
import { writeFileSync, readFileSync } from "fs";
import { resolve } from "path";

const outputFileName = `${name}_v${version}`;
const dartFileName = `${name}_source.dart`;

export default defineConfig({
  entry: {
    [outputFileName]: `lib/${name}.ts`,
  },
  onSuccess: async () => {
    const actualFile = resolve(`dist/${outputFileName}.js`);
    const dartFile = resolve(`lib/${dartFileName}`);

    const jsSource = readFileSync(actualFile, "utf8");

    writeFileSync(
      dartFile,
      `// GENERATED FILE — DO NOT MODIFY BY HAND
const packageVersion = '${version}';
const packageSource = r'''
${jsSource}
''';
`
    );
    console.log(`✅ Created lib/${dartFileName}`);
  },
  format: ["esm"],
  minify: true,
  bundle: true,
  treeshake: true,
  clean: true,
  noExternal: [/.*/],
  platform: "browser",
});
```

#### Step 3: Create TypeScript module (lib/my_module.ts)

```typescript
import { sum } from "lodash";

const sdk = {
  init: function () {
    return {};
  },
  functions: {
    addNumbers: function (_, numbers, callbackId) {
      try {
        const result = sum(numbers);
        const encoded = JsonPayload.encode(result);
        Dart.send_value(callbackId, encoded);
      } catch (error) {
        Dart.send_error(callbackId, error.message);
      }
    },
  },
};

export default sdk;
```

#### Step 4: Install dependencies and build

```bash
# Install NPM packages
npm install

# Build the module (creates lib/my_module_source.dart)
npm run build
```

#### Step 5: Use in Dart

```dart
import 'dart:async';
import 'package:globe_runtime/globe_runtime.dart';
import 'my_module_source.dart';

class MyModule {
  final Module _module;

  MyModule._(this._module);

  static Future<MyModule> create() async {
    final module = InlinedModule(
      name: 'MyModule',
      sourceCode: packageSource,
    );

    await module.register();
    return MyModule._(module);
  }

  Future<num> addNumbers(List<num> numbers) async {
    final completer = Completer<num>();

    _module.callFunction(
      'addNumbers',
      args: [numbers.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          final result = data.data.unpack() as num;
          completer.complete(result);
        }
        return true;
      },
    );

    return completer.future;
  }
}

// Usage
void main() async {
  final module = await MyModule.create();
  final result = await module.addNumbers([1, 2, 3, 4, 5]);
  print('Sum: $result'); // Output: Sum: 15
}
```

### Why This Approach Works

1. **Bundling**: Bundlers like `tsup` or `esbuild` bundle all NPM dependencies into a single JavaScript file
2. **TypeScript Support**: Full type safety and IntelliSense
3. **No external dependencies**: The bundled file contains everything needed
4. **InlinedModule**: Uses the bundled code directly, avoiding file path and module resolution issues
5. **Proper type casting**: Helper functions ensure Dart types are correctly cast from JavaScript objects
6. **Tree-shaking**: Importing specific functions reduces bundle size

## 🚨 Error Handling & Debugging

### Common Issues

1. **Module not found**: Ensure the JavaScript file exists and follows the correct structure
2. **Function not found**: Check that the function is exported in the `functions` object
3. **Type conversion errors**: Verify that you're using supported data types
4. **Memory leaks**: Always return `true` from `onData` callbacks when done

### Debugging Tips

```dart
// Enable verbose logging
void debugModule(Module module) async {
  print('Module name: ${module.name}');
  print('Module ready: ${module.isReady}');
  print('Runtime version: ${GlobeRuntime.instance.version}');

  final source = await module.source;
  print('Module source preview: ${source.substring(0, 200)}...');
}

// Safe function calling with timeout
Future<T> callWithTimeout<T>(
  Module module,
  String function,
  List<FFIConvertible> args, {
  Duration timeout = const Duration(seconds: 30),
}) async {
  return await module.callFunction(function, args: args, onData: (data) {
    // Handle response
    return true;
  }).timeout(timeout);
}
```

## 🔒 Security Considerations

- **Input Validation**: Always validate data before passing to JavaScript
- **Error Handling**: Never expose sensitive information in error messages
- **Module Sources**: Be careful with remote modules from untrusted sources
- **Memory Management**: Dispose of modules when no longer needed

## 📈 Performance Tips

1. **Reuse Modules**: Register modules once and reuse them
2. **Batch Operations**: Group related function calls
3. **Streaming**: Use streaming for large datasets
4. **Memory Cleanup**: Dispose of the runtime when done

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
