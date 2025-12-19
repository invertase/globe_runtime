import * as url from "ext:deno_url/00_url.js";
import * as urlPattern from "ext:deno_url/01_urlpattern.js";

import * as headers from "ext:deno_fetch/20_headers.js";
import * as formData from "ext:deno_fetch/21_formdata.js";
import * as request from "ext:deno_fetch/23_request.js";
import * as response from "ext:deno_fetch/23_response.js";
import * as fetch from "ext:deno_fetch/26_fetch.js";
import * as eventSource from "ext:deno_fetch/27_eventsource.js";

import * as infra from "ext:deno_web/00_infra.js";
import * as DOMException from "ext:deno_web/01_dom_exception.js";
import * as mimesniff from "ext:deno_web/01_mimesniff.js";
import * as event from "ext:deno_web/02_event.js";
import * as structuredClone from "ext:deno_web/02_structured_clone.js";
import * as timers from "ext:deno_web/02_timers.js";
import * as abortSignal from "ext:deno_web/03_abort_signal.js";
import * as globalInterfaces from "ext:deno_web/04_global_interfaces.js";
import * as base64 from "ext:deno_web/05_base64.js";
import * as streams from "ext:deno_web/06_streams.js";
import * as encoding from "ext:deno_web/08_text_encoding.js";
import * as file from "ext:deno_web/09_file.js";
import * as fileReader from "ext:deno_web/10_filereader.js";
import * as location from "ext:deno_web/12_location.js";
import * as messagePort from "ext:deno_web/13_message_port.js";
import * as compression from "ext:deno_web/14_compression.js";
import * as performance from "ext:deno_web/15_performance.js";
import * as imageData from "ext:deno_web/16_image_data.js";

import { core } from "ext:core/mod.js";

Object.assign(globalThis, timers);
Object.assign(globalThis, streams);
Object.assign(globalThis, encoding);
Object.assign(globalThis, url);
Object.assign(globalThis, urlPattern);
Object.assign(globalThis, abortSignal);
Object.assign(globalThis, fileReader);
Object.assign(globalThis, base64);
Object.assign(globalThis, compression);
Object.assign(globalThis, imageData);
Object.assign(globalThis, messagePort);
Object.assign(globalThis, performance);
Object.assign(globalThis, eventSource);
Object.assign(globalThis, fetch);
Object.assign(globalThis, request);
Object.assign(globalThis, response);
Object.assign(globalThis, headers);
Object.assign(globalThis, formData);
Object.assign(globalThis, globalInterfaces);
Object.assign(globalThis, file);

// window refers back to globalThis
globalThis.window = globalThis;
globalThis.self = globalThis;

Object.defineProperty(globalThis, "DOMException", {
  value: DOMException,
  enumerable: false,
  configurable: true,
  writable: true,
});

Deno.core.setWasmStreamingCallback(fetch.handleWasmStreaming);
