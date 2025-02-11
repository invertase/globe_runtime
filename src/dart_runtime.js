import * as msgParkr from "ext:js_msg_packr/index.js";

const { core } = Deno;

const MessageType = {
  VALUE: 0,
  ERROR: 1,
  STREAM_START: 2,
  STREAM_END: 3,
};

const wrap_dart_send = (callbackId, value) => {
  const buffer = msgParkr.pack(value);
  return core.ops.op_send_to_dart(callbackId, buffer);
};

Object.defineProperty(globalThis, "send_error_to_dart", {
  value: (callbackId, data) => {
    const message = { type: MessageType.ERROR, data };
    return wrap_dart_send(callbackId, message);
  },
  enumerable: true,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "send_value_to_dart", {
  value: (callbackId, data) => {
    const message = { type: MessageType.VALUE, data };
    return wrap_dart_send(callbackId, message);
  },
  enumerable: true,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "stream_value_to_dart", {
  value: (callbackId, data) => {
    const message = { type: MessageType.STREAM_START, data };
    return wrap_dart_send(callbackId, message);
  },
  enumerable: true,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "stream_end_to_dart", {
  value: (callbackId, data) => {
    const message = { type: MessageType.STREAM_END, data };
    return wrap_dart_send(callbackId, message);
  },
  enumerable: true,
  configurable: true,
  writable: true,
});

function register_js_module(moduleName, moduleFunctions) {
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
