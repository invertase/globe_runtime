# Globe Runtime

## Overview

Globe Runtime is a **minimalist runtime** designed to leverage the JavaScript ecosystem and its tools to accelerate development in **Dart**. It enables seamless **communication between Dart and JavaScript** by utilizing Dart FFI, V8, Rust, and Deno extensions.

## Why Globe Runtime?

Unlike full-fledged JavaScript runtimes like **Deno** or **Node.js**, Globe Runtime is specifically designed to **integrate Dart with JavaScript tools and libraries** efficiently. It provides **just enough JavaScript capabilities** to support essential operations such as:

- **`fetch` API** for network requests
- Encoding and decoding utilities
- Readable and Writable Streams
- Interfacing with JavaScript libraries and frameworks

## How It Works

Globe Runtime does **not** use the full Deno runtime. Instead, it takes advantage of **Deno's Rust-based tooling & packages** around V8 to extend JavaScript capabilities efficiently. By embedding **V8 within Rust** and exposing key APIs, it provides:

- **Fast and lightweight execution** of JavaScript within a Dart ecosystem
- **Interop between Dart and JavaScript** through FFI and V8
- **Access to JavaScript libraries and tooling** to enhance Dart's capabilities
- **Customizable Module registration** for expanding functionality as needed

## Limitations

Since Globe Runtime is **not a full JavaScript runtime**, it is optimized to provide **only the necessary features** to facilitate Dart-JavaScript interaction and integration with JavaScript tooling.

Globe Runtime is designed to be **lean, efficient, and purpose-driven**, focusing on **interoperability and leveraging JavaScript tools to accelerate Dart development**.

## TODO

MVP

- 2x models, openai + google-vertex: apiKey + model name
- generate text + stream text

void main() {
  await ai.generateText();
  await ai.streamText();
}

CI Job -> Maxtrix -> Windows/Mac/Linux -> GitHub Release / Arifact 

Nice TO have: CLI -> `globe runtime install` / `update` checks the registry

Versioned:

Runtime 
Package -> dart (pub), assets (js)

runtime.globe.dev/packages/globe_ai/0.1.2.js
