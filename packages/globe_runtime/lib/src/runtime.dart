import 'dart:async';
import 'dart:collection';
import 'dart:ffi';
import 'dart:io';
import 'dart:isolate';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:ffi/ffi.dart';
import 'package:path/path.dart' as path;
import 'package:msgpack_dart/msgpack_dart.dart' as msg_parkr;

import '../generated/dart_runtime_entry.pbserver.dart';

part 'runtime_impl.dart';
part 'runtime_data.dart';

/// Callback function for when data is received from the runtime.
///
/// Return `true` to unregister the callback.
typedef OnFunctionData = bool Function(DartMessage data);

interface class GlobeRuntime {
  final _$GlobeRuntimeImpl? _instance;

  GlobeRuntime._(this._instance);

  static GlobeRuntime? _cachedInstance;
  static GlobeRuntime get instance {
    if (_cachedInstance != null) return _cachedInstance!;
    return _cachedInstance = GlobeRuntime._(_$GlobeRuntimeImpl());
  }

  FutureOr<void> registerModule(
    String moduleName,
    String modulePath, {
    String? workingDir,
    List<FFIConvertible?> args = const [],
  }) {
    workingDir ??= Directory.current.path;
    return _instance!.registerModule(
      moduleName,
      path.join(workingDir, modulePath),
      args: args,
    );
  }

  bool isModuleRegistered(String moduleName) {
    return _instance!.isModuleRegisted(moduleName);
  }

  void callFunction(
    String moduleName, {
    required String function,
    List<FFIConvertible?> args = const [],
    required OnFunctionData onData,
  }) {
    return _instance!.callFunction(
      moduleName,
      function: function,
      args: args,
      onData: onData,
    );
  }

  String get version => _instance!.getVersion();

  void dispose() => _instance!.dispose();
}
