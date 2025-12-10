import pretty_bytes from "pretty-bytes";
import pretty_ms from "pretty-ms";
import { defineSdk } from "@globe/runtime_types";

type ModuleState = {
  language: "en" | "fr" | "es";
};

const make_pretty_bytes = <T = string>(
  state: ModuleState,
  value: number,
  callbackId: number
) => {
  const byte_str = pretty_bytes(value);
  const result = new TextEncoder().encode(byte_str);
  Dart.send_value(callbackId, result);
};

const make_pretty_ms = <T = string>(state: ModuleState, value: number, callbackId: number) => {
  const byte_str = pretty_ms(value);
  const result = new TextEncoder().encode(byte_str);
  Dart.send_value(callbackId, result);
};

export default defineSdk({
  init(language: "en" | "fr" | "es" = "en"): ModuleState {
    return { language };
  },
  functions: {
    make_pretty_bytes,
    make_pretty_ms,
  },
});
