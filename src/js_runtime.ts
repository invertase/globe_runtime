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

Object.defineProperty(globalThis, "self", {
  value: core.propGetterOnly(() => globalThis),
  enumerable: true,
  configurable: false,
  writable: false,
});

Object.defineProperty(globalThis, "Window", {
  value: globalInterfaces.windowConstructorDescriptor,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "setTimeout", {
  value: timers.setTimeout,
  enumerable: true,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "clearTimeout", {
  value: timers.clearTimeout,
  enumerable: true,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "ReadableStream", {
  value: streams.ReadableStream,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "TransformStream", {
  value: streams.TransformStream,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "WritableStream", {
  value: streams.WritableStream,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "TextEncoder", {
  value: encoding.TextEncoder,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "TextDecoder", {
  value: encoding.TextDecoder,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "TextDecoderStream", {
  value: encoding.TextDecoderStream,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "TextEncoderStream", {
  value: encoding.TextEncoderStream,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "URL", {
  value: url.URL,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "URLPattern", {
  value: urlPattern.URLPattern,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "URLSearchParams", {
  value: urlPattern.URLSearchParams,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "AbortController", {
  value: abortSignal.AbortController,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "FileReader", {
  value: fileReader.FileReader,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "atob", {
  value: base64.atob,
  enumerable: true,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "btoa", {
  value: base64.btoa,
  enumerable: true,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "DOMException", {
  value: DOMException,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "CompressionStream", {
  value: compression.CompressionStream,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "DecompressionStream", {
  value: compression.DecompressionStream,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "ImageData", {
  value: imageData.ImageData,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "MessageChannel", {
  value: messagePort.MessageChannel,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "MessagePort", {
  value: messagePort.MessagePort,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "structuredClone", {
  value: messagePort.structuredClone,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "Performance", {
  value: performance.Performance,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "PerformanceEntry", {
  value: performance.PerformanceEntry,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "PerformanceMark", {
  value: performance.PerformanceMark,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "PerformanceMeasure", {
  value: performance.PerformanceMeasure,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "EventSource", {
  value: eventSource.EventSource,
  enumerable: false,
  configurable: true,
  writable: true,
});

Deno.core.setWasmStreamingCallback(fetch.handleWasmStreaming);

Object.defineProperty(globalThis, "fetch", {
  value: fetch.fetch,
  enumerable: true,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "Request", {
  value: request.Request,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "Response", {
  value: response.Response,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "Headers", {
  value: headers.Headers,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "FormData", {
  value: formData.FormData,
  enumerable: false,
  configurable: true,
  writable: true,
});
