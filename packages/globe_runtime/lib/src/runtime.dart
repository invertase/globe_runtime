import 'dart:collection';
import 'dart:ffi';
import 'dart:ffi' as dart_ffi;
import 'dart:io';
import 'dart:isolate';
import 'dart:typed_data';
import 'package:ffi/ffi.dart';
import 'package:path/path.dart' as path;

part 'runtime_impl.dart';
part 'runtime_data.dart';

/// Callback function for when data is received from the runtime.
///
/// Return `true` to unregister the callback.
typedef OnFunctionData = bool Function(Uint8List data);

abstract interface class GlobeRuntime {
  static final _impl = _$GlobeRuntimeImpl();

  static GlobeRuntime get instance => _impl;

  GlobeRuntime._();

  void registerModule(String entryFile) {
    return _impl.registerModule(
      entryFile,
      workingDirectory: Directory.current.path,
    );
  }

  void callFunction(
    String moduleName, {
    required String function,
    List<FFIConvertible?> args = const [],
    required OnFunctionData onData,
  }) {
    return _impl.callFunction(
      moduleName,
      function: function,
      args: args,
      onData: onData,
    );
  }

  void dispose() => _impl.dispose();
}
