import 'dart:async';
import 'dart:collection';
import 'dart:ffi';
import 'dart:ffi' as dart_ffi;
import 'dart:io';
import 'dart:isolate';
import 'dart:typed_data';
import 'package:ffi/ffi.dart';
import 'package:path/path.dart' as path;
import 'package:ffi/ffi.dart' as ffi;
import 'package:msgpack_dart/msgpack_dart.dart' as msg_parkr;

import 'runtime_data.dart';

part 'runtime_impl.dart';
part 'features/ai.dart';
part 'features/neon.dart';

const allocate = ffi.malloc;

typedef OnFunctionData = bool Function(Uint8List data);

abstract interface class GlobeRuntime {
  final _$GlobeRuntimeImpl _impl;

  GlobeRuntime._(this._impl);

  static GlobeAISdk AI() => GlobeAISdk._(_$GlobeRuntimeImpl("ai.js"));

  static GlobeNeonDriver Neon(String databaseUrl) =>
      GlobeNeonDriver._(_$GlobeRuntimeImpl("neon.js"),
          databaseUrl: databaseUrl);

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

sealed class GlobeRuntimeFeature {
  final GlobeRuntime _runtime;

  GlobeRuntimeFeature(this._runtime);

  void dispose() => _runtime.dispose();
}
