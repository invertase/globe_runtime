# Globe Dart Source Generator (@globe/dart_source_generator)

A powerful code generation tool that transforms TypeScript/JavaScript source files into Dart-compatible source files. This package bundles your TypeScript code with all dependencies and generates type-safe Dart source files for seamless integration with Dart/Flutter projects.

## Overview

The tool is used to generate the Dart source files for use with the Globe runtime. For more information, see the [Globe Runtime](https://github.com/globe-runtime/globe_runtime).

Your TypeScript files should export an SDK object that is used to generate the Dart source files. To do this, you should use the wrappers from the [`@globe/runtime_types`](https://github.com/globe-runtime/globe_runtime_ts) package.

## Features

- **Automatic Bundling**: Bundles TypeScript/JavaScript files with all dependencies into single, minified outputs
- **Type Preservation**: Generates TypeScript declaration files (.d.ts) and converts them to Dart-compatible formats
- **Documentation Transfer**: Function JSDoc comments and parameter names are preserved from TypeScript to Dart
- **Init Documentation**: `init` function documentation and parameters are transferred to the Dart `create` factory

```
Notes: 
- The `init` function is optional.
- The `functions` object is required.
- To preserve documentation all documentation must be in JSDoc format and declared within the defineSdk function.
```
- **Batch Processing**: Process multiple files in a single run
- **Watch Mode**: Monitor files for changes and automatically regenerate
- **Flexible Input**: Accept individual files or scan entire directories
- **Tree-shaking**: Removes unused code to minimize output size
- **Verbose Logging**: Optional detailed logging for debugging

## Installation

### Prerequisites

You need to have both the CLI installed on your development system and the Globe runtime package in your Dart/Flutter project.

**Install the CLI:**
```bash
npm install -g @globe/dart_source_generator
# or use npx to run without installing globally
```

**Add Globe runtime to your Dart/Flutter project:**
```bash
flutter pub add globe_runtime
# or for Dart projects
dart pub add globe_runtime
```

## Usage

### Via Command Line

The generator is available as an executable that can be run directly:

```bash
npx @globe/dart_source_generator [options]
```

### Basic Examples

**Generate from specific files:**
```bash
npx @globe/dart_source_generator --files src/utils.ts src/helpers.ts --output dist/
```

**Generate from a directory:**
```bash
npx @globe/dart_source_generator --input src/ --output dist/
```

**Watch mode for development:**
```bash
npx @globe/dart_source_generator --input src/ --output dist/ --watch
```

**Enable verbose logging:**
```bash
npx @globe/dart_source_generator --files src/index.ts --output dist/ --verbose
```

### Command Options

| Option | Type | Description |
|--------|------|-------------|
| `--files <file>` | string (multiple) | List of input files to process (can be repeated) |
| `--input <dir>` | string | Input directory to scan for .ts and .js files |
| `--output <dir>` | string | Output directory for generated Dart files (default: current directory) |
| `--watch` | boolean | Watch input files for changes and regenerate automatically |
| `--verbose` | boolean | Enable detailed logging output |
| `--help` | boolean | Display help message |

## How It Works

1. **Input**: Accepts TypeScript or JavaScript files as input
2. **Bundling**: Uses `tsdown` to bundle your code with all dependencies, applying tree-shaking and minification
3. **Extraction**: Extracts the bundled ESM output and TypeScript declarations
4. **Dart Generation**: Converts the bundled code and type information into Dart-compatible source files
5. **Output**: Generates `<filename>_source.dart` files in your specified output directory. The output filename is a snake_case version of the TypeScript filename (e.g., `my-sdk.ts` or `mySdk.ts` -> `my_sdk_source.dart`).

## Example Workflow

Your TypeScript SDK should export a default object created with `defineSdk()` that includes initialization and function definitions:

#### TypeScript Input (`src/sdk.ts`)

```typescript
import { defineSdk, returnInt, streamMap } from "@globe/runtime_types";

type ModuleState = {
  apiUrl: string;
  timeout: number;
};

export default defineSdk({
  /**
   * Initialize the SDK with authentication credentials
   *
   * This sets up the SDK with your API key and configures the timeout
   * for all network requests.
   *
   * @param apiUrl - The base URL for API requests
   * @param timeout - Request timeout in milliseconds
   */
  init(
    apiUrl: string = "https://api.example.com",
    timeout: number = 5000
  ): ModuleState {
    return { apiUrl, timeout };
  },
  functions: {
    /**
     * Streams user information from the API
     *
     * This function retrieves user information based on the provided user ID.
     *
     * @param userId - The unique identifier for the user
     * @returns The user's information as a map of key-value pairs in a stream.
     */
    fetch_user: streamMap(
      async (state: ModuleState, userId: string, callbackId: number) => {
        try {
          const url = `${state.apiUrl}/user/${userId}`;
          const response = await fetch(url, {
            signal: AbortSignal.timeout(state.timeout),
          });

          for await (const chunk of response.body!.values()) {
            Dart.stream_value(callbackId, chunk);
          }

          Dart.stream_value_end(callbackId);
        } catch (error) {
          Dart.send_error(
            callbackId,
            `Stream failed: ${(error as Error).message}`
          );
        }
      }
    ),

    /**
     * Calculates the total price based on quantity and price per unit
     *
     * @param quantity - The number of units
     * @param price - The price per unit
     * @returns The total price
     */
    calculate_price: returnInt(
      (
        state: ModuleState,
        quantity: number,
        price: number,
        callbackId: number
      ) => {
        const total = quantity * price;
        Dart.send_value(callbackId, new TextEncoder().encode(total.toString()));
      }
    ),
  },
});
```

#### Generate Dart Source

```bash
npx @globe/dart_source_generator --files src/sdk.ts --output lib/generated/
```

The generator will create a Dart file for each TypeScript file in the specified output directory.

The generated Dart file would be (`lib/generated/sdk_source.dart`):

```dart
// GENERATED FILE — DO NOT MODIFY BY HAND
// This file was generated from @globe/dart_source_generator
// ignore_for_file: unused_import

import 'dart:async';
import 'dart:convert';
import 'package:globe_runtime/globe_runtime.dart';

/// Package version
const packageVersion = '1.0.0';

/// Package source code
const packageSource = r'''
...(minified code)
''';

/// {@template Sdk}
/// Sdk class
/// {@endtemplate}
class Sdk {
  /// {@macro Sdk}
  Sdk._(this._module);

  /// Module instance
  final Module _module;

  /// Initialize the SDK with authentication credentials
  ///
  /// This sets up the SDK with your API key and configures the timeout for all
  /// network requests.
  ///
  /// **Parameters:**
  /// * [apiUrl]: The base URL for API requests
  /// * [timeout]: Request timeout in milliseconds
  static Future<Sdk> create({String? apiUrl, num? timeout}) async {
    const module = InlinedModule(
      name: 'Sdk',
      sourceCode: packageSource,
    );

    await module.register(args: [apiUrl?.toFFIType, timeout?.toFFIType]);
    return Sdk._(module);
  }

  /// Disposes of the runtime instance
  void dispose() {
    GlobeRuntime.instance.dispose();
  }

  /// Streams user information from the API
  ///
  /// This function retrieves user information based on the provided user ID.
  ///
  /// **Parameters:**
  /// * [userId]: The unique identifier for the user
  ///
  /// **Returns:** The user's information as a map of key-value pairs in a stream.
  Stream<Map<dynamic, dynamic>> fetchUser(String userId) {
    final controller = StreamController<Map<dynamic, dynamic>>();

    _module.callFunction(
      'fetch_user',
      args: [userId.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          controller.addError(data.error);
          return true;
        }

        if (data.hasData()) {
          final value = data.data.unpack();
          controller.add(value as Map<dynamic, dynamic>);
        }

        if (data.done) {
          controller.close();
          return true;
        }

        return false; // Keep listening for more data
      },
    );

    return controller.stream;
  }

  /// Calculates the total price based on quantity and price per unit
  ///
  /// **Parameters:**
  /// * [quantity]: The number of units
  /// * [price]: The price per unit
  ///
  /// **Returns:** The total price
  Future<num> calculatePrice(num quantity, num price) async {
    final completer = Completer<num>();

    _module.callFunction(
      'calculate_price',
      args: [quantity.toFFIType, price.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          final value = data.data.unpack();
          completer.complete(value as num);
        }
        return true;
      },
    );

    return completer.future;
  }
}
```


#### Output

```
lib/generated/
└── sdk_source.dart
```

The generated Dart file contains the bundled, minified JavaScript code along with type information extracted from your TypeScript definitions, making it ready to use in your Dart/Flutter projects with the Globe runtime.

## Dart Usage Example

Once you've generated your Dart source files, you can use them in your Dart/Flutter project:

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
  final userStream = await sdk.fetchUser('123');
  
  final completer = Completer<void>();
  userStream.listen((user) {
    print('User: $user');
  }, onDone: completer.complete);

  await completer.future;

  // Clean up when done
  sdk.dispose();
}
```

### Key Concepts

- **Initialization**: Call `.create()` with any parameters defined in your SDK's `init()` function
- **Single Values**: Functions wrapped with `returnString`, `returnInt`, etc. return `Future<T>`
- **Streams**: Functions wrapped with `streamString`, `streamInt`, etc. return `Future<Stream<T>>`
- **Cleanup**: Call `.dispose()` to clean up resources when finished

For more detailed examples, see the [Globe Runtime documentation](https://github.com/globe-runtime/globe_runtime).

## Processing Multiple Files

Each input file is processed independently with its own dependency bundle. This ensures that each generated Dart file is self-contained and includes all necessary dependencies.

```bash
npx @globe/dart_source_generator \
  --files src/api.ts src/utils.ts src/validators.ts \
  --output lib/generated/
```

This generates:
- `lib/generated/api_source.dart`
- `lib/generated/utils_source.dart`
- `lib/generated/validators_source.dart`

## Development Mode

Use watch mode while developing to automatically regenerate files as you make changes:

```bash
npx @globe/dart_source_generator --input src/ --output lib/generated/ --watch
```

## Troubleshooting

**"File does not exist" error**: Verify that all file paths are correct and relative to where you're running the command.

**No input files found**: Ensure you're using either `--files` or `--input`. At least one must be provided.

**Enable verbose output**: Use `--verbose` to see detailed logs about the bundling and generation process:
```bash
npx @globe/dart_source_generator --files src/index.ts --output dist/ --verbose
```

## Version

The generator automatically includes version information from your package in the generated Dart files.

## License

See LICENSE for details.