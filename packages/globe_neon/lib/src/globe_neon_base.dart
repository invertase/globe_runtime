import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:globe_runtime/globe_runtime.dart';

final class NeonOptions {
  final String? authToken;
  final bool? arrayMode;
  final Map<String, dynamic>? fetchOptions;
  final bool? fullResults;

  const NeonOptions({
    this.authToken,
    this.arrayMode,
    this.fetchOptions,
    this.fullResults,
  });

  Map<String, dynamic> toJson() => {
        'authToken': authToken,
        'arrayMode': arrayMode,
        'fetchOptions': fetchOptions,
        'fullResults': fullResults,
      };

  String toJsonEncoded() => jsonEncode(toJson());

  /// Create a Dart object from JSON string
  factory NeonOptions.fromJson(String jsonString) {
    final Map<String, dynamic> data = jsonDecode(jsonString);
    return NeonOptions(
      authToken: data['authToken'],
      arrayMode: data['arrayMode'],
      fetchOptions: data['fetchOptions'],
      fullResults: data['fullResults'],
    );
  }
}

final class GlobeNeonSdk {
  static const String _moduleName = 'GlobeNeonSdk';
  static final String _codeURL =
      "${Directory.current.path}/packages/globe_neon/dist/globe_neon.mjs";

  final GlobeRuntime _runtime;
  final String _databaseUrl;

  GlobeNeonSdk._(this._databaseUrl, this._runtime);

  Future<void> _registerModuleIfNotAlready() async {
    final instance = GlobeRuntime.instance;
    if (instance.isModuleRegistered(_moduleName)) return;
    return GlobeRuntime.instance.registerModule(_codeURL);
  }

  static GlobeNeonSdk create(String databaseUrl) => GlobeNeonSdk._(
        databaseUrl,
        GlobeRuntime.instance,
      );

  Future<dynamic> sql(
    String sql, {
    List<dynamic> params = const [],
    NeonOptions options = const NeonOptions(),
  }) async {
    await _registerModuleIfNotAlready();

    final completer = Completer();

    final encodedOptions = json.encode({...options.toJson(), 'params': params});

    _runtime.callFunction(
      _moduleName,
      function: "neon_execute",
      args: [_databaseUrl.toFFIType, sql.toFFIType, encodedOptions.toFFIType],
      onData: (data) {
        completer.complete(data.message);
        return true;
      },
    );

    return completer.future;
  }
}
