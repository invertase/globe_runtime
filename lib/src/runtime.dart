import 'dart:async';
import 'dart:collection';
import 'dart:convert';
import 'dart:ffi';
import 'dart:ffi' as dart_ffi;
import 'dart:io';
import 'dart:isolate';
import 'dart:typed_data';
import 'package:ffi/ffi.dart';
import 'package:path/path.dart' as path;
import 'package:ffi/ffi.dart' as ffi;

import 'runtime_data.dart';

part 'runtime_impl.dart';
part 'features/ai.dart';

const allocate = ffi.malloc;

typedef OnFunctionData = void Function(dynamic data);

abstract interface class GlobeRuntime {
  final _$GlobeRuntimeImpl _impl;

  // ignore: unused_element
  GlobeRuntime._(this._impl);

  static GlobeAISdk AI() => GlobeAISdk._(_$GlobeRuntimeImpl("ai.js"));

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
