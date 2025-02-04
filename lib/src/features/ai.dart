part of '../runtime.dart';

class GlobeAISdk {
  final GlobeRuntime _runtime;

  GlobeAISdk._(this._runtime);

  Future<String?> generate({
    required String query,
    required String model,
  }) async {
    final completer = Completer<String?>();

    _runtime.call_function(
      function: "ai_generate",
      args: [model.toFFIType, query.toFFIType],
      onData: (data) {
        final result = utf8.decode(data);
        completer.complete(result);
        return true;
      },
    );

    return completer.future;
  }

  void dispose() => _runtime.dispose();
}
