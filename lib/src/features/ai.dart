part of '../runtime.dart';

enum AiProvider { gemini, openai }

class GlobeAISdk {
  final GlobeRuntime _runtime;

  GlobeAISdk._(this._runtime);

  Future<String?> generate({
    AiProvider provider = AiProvider.openai,
    required String apiKey,
    required String query,
    required String model,
  }) async {
    final completer = Completer<String?>();

    _runtime.call_function(
      function: "${provider.name.toLowerCase()}_generate",
      args: [apiKey.toFFIType, model.toFFIType, query.toFFIType],
      onData: (data) {
        final decoded = msg_parkr.deserialize(data);
        final message = decoded['choices'][0]['message']['content'];
        completer.complete(message);
        return true;
      },
    );

    return completer.future;
  }

  Stream<String?> stream({
    AiProvider provider = AiProvider.openai,
    required String apiKey,
    required String query,
    required String model,
  }) {
    final streamController = StreamController<String?>();

    _runtime.call_function(
      function: "${provider.name.toLowerCase()}_stream",
      args: [apiKey.toFFIType, model.toFFIType, query.toFFIType],
      onData: (data) {
        final decoded = msg_parkr.deserialize(data);
        if (decoded == 'e-o-s') {
          streamController.close();
          return true;
        }

        streamController.add("Woohoo");
        return false;
      },
    );

    return streamController.stream;
  }

  void dispose() => _runtime.dispose();
}
