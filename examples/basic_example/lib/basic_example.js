const sdk = {
  init: function (apiKey) {
    return { apiKey };
  },
  functions: {
    fetch_url: async function (_, url, DartCallbackId) {
      try {
        const response = await fetch(url);

        const data = await response.json();

        const encoded = JsonPayload.encode(data);
        if (!encoded) {
          Dart.send_error(DartCallbackId, "Failed to encode response");
          return;
        }

        Dart.send_value(DartCallbackId, encoded);
      } catch (err) {
        Dart.send_error(DartCallbackId, `Fetch failed: ${err.message}`);
      }
    },
  },
};

export default sdk;
