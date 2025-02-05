part of '../runtime.dart';

class GlobeNeonDriver extends GlobeRuntimeFeature {
  final String databaseUrl;

  GlobeNeonDriver._(
    super._runtime, {
    required this.databaseUrl,
  });

  Future<List<dynamic>> sql(
    String sql, {
    List<String> params = const [],
  }) async {
    final completer = Completer<List<dynamic>>();
    final jsonParams = msg_parkr.serialize(params);

    _runtime.call_function(
      function: "neon_exec",
      args: [databaseUrl.toFFIType, sql.toFFIType, jsonParams.toFFIType],
      onData: (data) {
        final result = msg_parkr.deserialize(data) as List<dynamic>;
        completer.complete(result);
        return true;
      },
    );

    return completer.future;
  }
}
