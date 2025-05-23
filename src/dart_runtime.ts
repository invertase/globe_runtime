import {
  DartMessage,
  DartJSService,
  RpcResponse,
  SendValueRequest,
} from "./dart_runtime_entry.ts";
import * as msgPackr from "ext:js_msg_packr/index.js";

const { core } = Deno;

// Expose the `JsonPayload` interface to the global scope
Object.defineProperty(globalThis, "JsonPayload", {
  value: {
    encode: (value: unknown): Uint8Array | undefined => {
      if (value === undefined) return undefined;
      return msgPackr.pack(value);
    },
    decode: (value: Uint8Array | undefined): any => {
      if (value === undefined) return undefined;
      return msgPackr.unpack(value);
    },
  },
  enumerable: false,
  writable: true,
  configurable: true,
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

class DartJSServiceImpl implements DartJSService {
  SendValue(request: SendValueRequest): Promise<RpcResponse> {
    const writer = request.message && DartMessage.encode(request.message);
    const success = core.ops.op_send_to_dart(
      request.callbackId,
      writer?.finish()
    );
    return Promise.resolve({ success });
  }
}

const _dartJSService = new DartJSServiceImpl();

register_js_module("Dart", {
  send_value: (callbackId: number, data: Uint8Array) => {
    const message: DartMessage = { data, done: true };
    return _dartJSService.SendValue({ callbackId, message });
  },
  stream_value: (callbackId: number, data: Uint8Array) => {
    const message: DartMessage = { data, done: false };
    return _dartJSService.SendValue({ callbackId, message });
  },
  stream_value_end: (callbackId: number, data: Uint8Array | undefined) => {
    const message: DartMessage = { data, done: true };
    return _dartJSService.SendValue({ callbackId, message });
  },
  send_error: (callbackId, error: string) => {
    const message: DartMessage = { error, done: true };
    return _dartJSService.SendValue({ callbackId, message });
  },
});
