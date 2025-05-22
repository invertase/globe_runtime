const sdk = {
  init: function () {
    return {};
  },
  functions: {
    json_encode: function (_, DartCallbackId) {
      Dart.send_value(
        DartCallbackId,
        JsonPayload.encode({
          name: "FooBar",
          age: 42,
          isAlive: true,
          friends: ["Alice", "Bob"],
          address: {
            city: "Wonderland",
            zipCode: 12345,
          },
        })
      );
    },
    json_decode: function (_, encoded, DartCallbackId) {
      const data = JsonPayload.decode(encoded);

      const mapKeys = Object.keys(data);

      Dart.send_value(DartCallbackId, JsonPayload.encode(mapKeys));
    },
    say_hello: function (_, name, DartCallbackId) {
      const greeting = `Hello, ${name}`;
      const result = new TextEncoder().encode(greeting);

      Dart.send_value(DartCallbackId, result);
    },
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
    fetch_url_streamed: async function (_, url, DartCallbackId) {
      try {
        const response = await fetch(url);

        for await (const chunk of response.body.values()) {
          Dart.stream_value(DartCallbackId, chunk);
        }

        Dart.stream_value_end(DartCallbackId);
      } catch (err) {
        Dart.send_error(DartCallbackId, `Fetch failed: ${err.message}`);
      }
    },
  },
};

export default sdk;
