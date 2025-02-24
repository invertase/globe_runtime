import { DartMessage } from "./dart_runtime_data.ts";

const { core } = Deno;

function register_js_module(moduleName: string, moduleFunctions) {
  if (globalThis[moduleName]) {
    throw new Error(`Module "${moduleName}" is already registered.`);
  }

  // Create the module object inside globalThis
  const moduleObj = { data: {} };
  globalThis[moduleName] = moduleObj;

  Object.entries(moduleFunctions).forEach(([key, func]) => {
    if (typeof func !== "function") {
      throw new Error(
        `Error: "${key}" in module "${moduleName}" is not a function.`
      );
    }

    Object.defineProperty(moduleObj, key, {
      value: func.bind(moduleObj),
      enumerable: true,
      configurable: true,
      writable: true,
    });
  });
}

const wrap_dart_send = (callbackId: number, value: DartMessage) => {
  const writer = DartMessage.encode(value);
  return core.ops.op_send_to_dart(callbackId, writer.finish());
};

register_js_module("Dart", {
  send_value: (callbackId: number, data: Uint8Array) => {
    const message: DartMessage = { data, done: true };
    return wrap_dart_send(callbackId, message);
  },
  stream_value: (callbackId: number, data: Uint8Array) => {
    const message: DartMessage = { data, done: false };
    return wrap_dart_send(callbackId, message);
  },
  stream_value_end: (callbackId: number, data: Uint8Array | undefined) => {
    const message: DartMessage = { data, done: true };
    return wrap_dart_send(callbackId, message);
  },
  send_error: (callbackId, error: string | undefined) => {
    const message: DartMessage = { error, done: true };
    return wrap_dart_send(callbackId, message);
  },
});


Object.defineProperty(globalThis, "registerJSModule", {
  value: register_js_module,
  enumerable: true,
  configurable: true,
  writable: true,
});