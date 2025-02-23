import { DartMessage, MessageType } from "./dart_runtime_data.ts";

const { core } = Deno;

/// TODO(codekeyz): Remove this when other side implements ProtoBuf-ed messages
function objectToUint8Array(obj: any): Uint8Array {
  const jsonString = JSON.stringify(obj); // Convert object to string
  const encoder = new TextEncoder();
  return encoder.encode(jsonString); // Convert string to Uint8Array
}

const wrap_dart_send = (callbackId: number, value: DartMessage) => {
  const writer = DartMessage.encode(value);
  return core.ops.op_send_to_dart(callbackId, writer.finish());
};

Object.defineProperty(globalThis, "send_error_to_dart", {
  value: (callbackId, data) => {
    const message = { type: MessageType.ERROR, data: objectToUint8Array(data) };
    return wrap_dart_send(callbackId, message);
  },
  enumerable: true,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "send_value_to_dart", {
  value: (callbackId: number, data: any) => {
    const message = {
      type: MessageType.VALUE,
      data: objectToUint8Array(data),
    };
    return wrap_dart_send(callbackId, message);
  },
  enumerable: true,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "stream_value_to_dart", {
  value: (callbackId: number, data: any) => {
    const message: DartMessage = {
      type: MessageType.STREAM_START,
      data: objectToUint8Array(data),
    };
    return wrap_dart_send(callbackId, message);
  },
  enumerable: true,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "stream_end_to_dart", {
  value: (callbackId: number, data: any) => {
    const message = {
      type: MessageType.STREAM_END,
      data: objectToUint8Array(data),
    };
    return wrap_dart_send(callbackId, message);
  },
  enumerable: true,
  configurable: true,
  writable: true,
});

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

Object.defineProperty(globalThis, "registerJSModule", {
  value: register_js_module,
  enumerable: true,
  configurable: true,
  writable: true,
});
