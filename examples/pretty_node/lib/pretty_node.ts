import { defineSdk, returnString } from "@globe/runtime_types";
import pretty_bytes from "pretty-bytes";
import pretty_ms from "pretty-ms";

type Language = "en" | "fr" | "es";

type ModuleState = {
  language: Language;
  verbose: boolean;
};

// Single-value function - returns DartReturn<string>
const make_pretty_bytes = returnString(
  (state: ModuleState, value: number, callbackId: number) => {
    const str = pretty_bytes(value, { locale: state.language });
    Dart.send_value(callbackId, new TextEncoder().encode(str));
  }
);

// Single-value function - returns DartReturn<string>
const make_pretty_ms = returnString(
  (state: ModuleState, value: number, callbackId: number) => {
    const str = pretty_ms(value, { verbose: state.verbose });
    Dart.send_value(callbackId, new TextEncoder().encode(str));
  }
);

export default defineSdk({
  init(language: Language = "en", verbose: boolean = false): ModuleState {
    return { language, verbose };
  },
  functions: {
    make_pretty_bytes,
    make_pretty_ms,
  },
});
