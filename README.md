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
