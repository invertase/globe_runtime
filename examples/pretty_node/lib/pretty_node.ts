import pretty_bytes from "pretty-bytes";
import pretty_ms from "pretty-ms";

type ModuleState = {};

const make_pretty_bytes = (
  _: ModuleState,
  value: number,
  callbackId: number
) => {
  const byte_str = pretty_bytes(value);
  const result = new TextEncoder().encode(byte_str);
  Dart.send_value(callbackId, result);
};

const make_pretty_ms = (_: ModuleState, value: number, callbackId: number) => {
  const byte_str = pretty_ms(value);
  const result = new TextEncoder().encode(byte_str);
  Dart.send_value(callbackId, result);
};

export default {
  init: (..._: any[]): ModuleState => {
    return {};
  },
  functions: {
    make_pretty_bytes,
    make_pretty_ms,
  },
};
