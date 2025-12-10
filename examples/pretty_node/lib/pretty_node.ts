import pretty_bytes from "pretty-bytes";
import pretty_ms from "pretty-ms";
import { defineSdk } from "@globe/runtime_types";

type Language = "en" | "fr" | "es";

type ModuleState = {
  language: Language;
  verbose: boolean;
};

const make_pretty_bytes = <T = string>(
  state: ModuleState,
  value: number,
  callbackId: number
) => {
  const byte_str = pretty_bytes(value, { locale: state.language });
  const result = new TextEncoder().encode(byte_str);
  Dart.send_value(callbackId, result);
};

const make_pretty_ms = <T = string>(state: ModuleState, value: number, callbackId: number) => {
  const byte_str = pretty_ms(value, { verbose: state.verbose });
  const result = new TextEncoder().encode(byte_str);
  Dart.send_value(callbackId, result);
};

export default defineSdk({
  init(language: Language = "en", verbose: boolean = false): ModuleState {
    return { language, verbose };
  },
  functions: {
    make_pretty_bytes,
    make_pretty_ms,
  },
});
