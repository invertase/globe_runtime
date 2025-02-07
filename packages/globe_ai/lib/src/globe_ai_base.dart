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
  static const String _moduleName = 'GlobeAISdk';
  static const String _codeURL =
      "https://globe-tasks.globeapp.dev/runtime/globe_ai.mjs";

  final GlobeRuntime _runtime;
  final AiProvider provider;

  GlobeAISdk._(this.provider, this._runtime);

  static Future<GlobeAISdk> instance(AiProvider provider) async {
    await GlobeRuntime.instance.registerModule(_codeURL);
    return GlobeAISdk._(provider, GlobeRuntime.instance);
  }

  Future<String?> generate({
    required String query,
    required String model,
  }) async {
    final completer = Completer<String?>();

    _runtime.callFunction(
      _moduleName,
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

  Stream<String> stream({
    required String query,
    required String model,
  }) {
    final streamController = StreamController<String>();

    _runtime.callFunction(
      _moduleName,
      function: "${provider.name.toLowerCase()}_stream",
      args: [provider.apiKey.toFFIType, model.toFFIType, query.toFFIType],
      onData: (data) {
        final decoded = msg_parkr.deserialize(data);
        if (decoded == 'e-o-s') {
          streamController.close();
          return true;
        }
        final chunk = decoded['choices'][0]['delta']['content'];
        if (chunk == null) {
          streamController.close();
          return true;
        }

        streamController.add(chunk);
        return false;
      },
    );

    return streamController.stream;
  }
}
