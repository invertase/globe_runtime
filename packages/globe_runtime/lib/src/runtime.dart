import 'dart:collection';
import 'dart:ffi';
import 'dart:ffi' as dart_ffi;
import 'dart:io';
import 'dart:isolate';
import 'dart:typed_data';
import 'package:ffi/ffi.dart';
import 'package:path/path.dart' as path;
import 'package:ffi/ffi.dart' as ffi;

part 'runtime_impl.dart';
part 'runtime_data.dart';

/// Callback function for when data is received from the runtime.
///
/// Return `true` to unregister the callback.
typedef OnFunctionData = bool Function(Uint8List data);

abstract interface class GlobeRuntime {
  static late final _impl = _$GlobeRuntimeImpl();

  static GlobeRuntime get instance => _impl;

  GlobeRuntime._();

  void loadModule(String module) {
    return _impl.loadModule(module, workingDirectory: Directory.current.path);
  }

  void call_function({
    required String function,
    List<FFIConvertible?> args = const [],
    required OnFunctionData onData,
  }) {
    return _impl.call_function(
      function: function,
      args: args,
      onData: onData,
    );
  }

  void dispose() => _impl.dispose();
}
