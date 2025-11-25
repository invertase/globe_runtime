import mjml2html from "mjml-browser";

function render(_: any, mjml: string, options: any, callbackId: number) {
  const result = mjml2html(mjml, options);
  const encoded = JsonPayload.encode(result);
  Dart.send_value(callbackId, encoded);
}

export default {
  functions: {
    render,
  },
};
