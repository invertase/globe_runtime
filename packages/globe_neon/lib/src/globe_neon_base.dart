// ignore_for_file: constant_identifier_names

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:globe_runtime/globe_runtime.dart';

enum TransactionIsolateLevel {
  ReadUncommitted,
  ReadCommitted,
  RepeatableRead,
  Serializable,
}

class NeonSQLOptions {
  final String? authToken;
  final Map<String, dynamic>? fetchOptions;

  final bool arrayMode;
  final bool fullResults;

  const NeonSQLOptions({
    this.authToken,
    this.arrayMode = false,
    this.fullResults = false,
    this.fetchOptions,
  });

  Map<String, dynamic> toJson() => {
        'authToken': authToken,
        'arrayMode': arrayMode,
        'fetchOptions': fetchOptions,
        'fullResults': fullResults,
      };

  String toJsonEncoded() => jsonEncode(toJson());

  /// Create a Dart object from JSON string
  factory NeonSQLOptions.fromJson(String jsonString) {
    final Map<String, dynamic> data = jsonDecode(jsonString);
    return NeonSQLOptions(
      authToken: data['authToken'],
      arrayMode: data['arrayMode'],
      fetchOptions: data['fetchOptions'],
      fullResults: data['fullResults'],
    );
  }
}

class NeonSQL {
  final String sql;
  final NeonSQLOptions? options;

  const NeonSQL(this.sql, this.options);

  factory NeonSQL.sql(String sql) => NeonSQL(sql, const NeonSQLOptions());

  Map<String, dynamic> toJson() => {
        'sql': sql,
        'options': options?.toJson(),
      };
}

final class NeonTxnOptions extends NeonSQLOptions {
  final bool readOnly;
  final bool deferrable;
  final TransactionIsolateLevel? isolationLevel;

  const NeonTxnOptions({
    super.arrayMode,
    super.authToken,
    super.fetchOptions,
    super.fullResults,
    this.isolationLevel,
    this.readOnly = false,
    this.deferrable = false,
  });

  @override
  Map<String, dynamic> toJson() => {
        ...super.toJson(),
        'readOnly': readOnly,
        'deferrable': deferrable,
        'isolationLevel': isolationLevel?.name,
      };
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
    NeonSQLOptions options = const NeonSQLOptions(),
  }) async {
    await _registerModuleIfNotAlready();

    final completer = Completer();

    final encodedOptions = json.encode({...options.toJson(), 'params': params});

    _runtime.callFunction(
      _moduleName,
      function: "neon_execute",
      args: [_databaseUrl.toFFIType, sql.toFFIType, encodedOptions.toFFIType],
      onData: (data) {
        if (data.type == MessageType.error) {
          completer.completeError(data.message);
          return true;
        }

        completer.complete(data.message);
        return true;
      },
    );

    return completer.future;
  }

  Future<dynamic> transaction(
    List<NeonSQL> sqls, {
    NeonTxnOptions options = const NeonTxnOptions(),
  }) async {
    await _registerModuleIfNotAlready();

    final completer = Completer();

    final encodedSQls = json.encode(sqls);
    final encodedOptions = json.encode(options.toJson());

    _runtime.callFunction(
      _moduleName,
      function: "neon_transaction",
      args: [
        _databaseUrl.toFFIType,
        encodedSQls.toFFIType,
        encodedOptions.toFFIType,
      ],
      onData: (data) {
        if (data.type == MessageType.error) {
          completer.completeError(data.message);
          return true;
        }

        completer.complete(data.message);
        return true;
      },
    );

    return completer.future;
  }
}
