import 'dart:async';

import 'package:globe_runtime/globe_runtime.dart';
import 'package:msgpack_dart/msgpack_dart.dart' as msg_parkr;

abstract class AiProvider {
  final String? baseUrl;
  final String name;
  final String apiKey;

  const AiProvider({this.baseUrl, required this.name, required this.apiKey});
}

class OpenAIProvider extends AiProvider {
  const OpenAIProvider({super.baseUrl, required super.apiKey})
      : super(name: 'OpenAI');
}

class GeminiAIProvider extends AiProvider {
  const GeminiAIProvider({required super.apiKey}) : super(name: 'Gemini');
}

final class GlobeAISdk {
  final GlobeRuntime _runtime;
  final AiProvider provider;

  GlobeAISdk._(this.provider, this._runtime);

  static GlobeAISdk instance(AiProvider provider) {
    return GlobeAISdk._(provider, GlobeRuntime.instance);
  }

  Future<String?> generate({
    required String query,
    required String model,
  }) async {
    final completer = Completer<String?>();

    _runtime.call_function(
      function: "${provider.name.toLowerCase()}_generate",
      args: [provider.apiKey.toFFIType, model.toFFIType, query.toFFIType],
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
    required String query,
    required String model,
  }) {
    final streamController = StreamController<String?>();

    _runtime.call_function(
      function: "${provider.name.toLowerCase()}_stream",
      args: [provider.apiKey.toFFIType, model.toFFIType, query.toFFIType],
      onData: (data) {
        final decoded = msg_parkr.deserialize(data);
        if (decoded == 'e-o-s') {
          streamController.close();
          return true;
        }
        final cbunk = decoded['choices'][0]['delta']['content'];
        streamController.add(cbunk);
        return false;
      },
    );

    return streamController.stream;
  }
}
