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

/// A base class for modules that can be registered with the runtime.
sealed class Module {
  final String name;
  const Module(this.name);

  FutureOr<String> get source;

  GlobeRuntime get _runtime => GlobeRuntime.instance;

  bool get isReady => _runtime.isModuleRegistered(name);

  void callFunction(
    String function, {
    List<FFIConvertible?> args = const [],
    required OnFunctionData onData,
  }) {
    return _runtime.callFunction(
      name,
      function: function,
      args: args,
      onData: onData,
    );
  }

  FutureOr<void> register({List<FFIConvertible?> args = const []}) async {
    if (isReady) return;
    return _runtime.registerModule(this, args: args);
  }
}

// A module that is loaded from a file.
class FileModule extends Module {
  final String filePath;

  const FileModule({required String name, required this.filePath})
      : super(name);

  @override
  Future<String> get source async {
    final file = File(filePath);
    if (!file.existsSync()) {
      throw StateError('Module file not found: $filePath');
    }
    final buffer = StringBuffer();
    buffer.writeln('// @file: file://$filePath');
    buffer.write(await file.readAsString());

    return buffer.toString();
  }
}

// A module that is loaded from a remote URL.
class RemoteModule extends Module {
  final String url;

  const RemoteModule({required String name, required this.url}) : super(name);

  @override
  Future<String> get source async {
    try {
      final uri = Uri.parse(url);
      final response = await http.readBytes(uri);

      // Write to a temp file
      final tempDir = await Directory.systemTemp.createTemp('remote_module_');
      final tempFile = File('${tempDir.path}/${uri.pathSegments.last}');
      await tempFile.writeAsBytes(response);

      // Delegate to FileModule
      final fileModule = FileModule(name: name, filePath: tempFile.path);
      return await fileModule.source;
    } on http.ClientException catch (e) {
      throw StateError('Failed to fetch module from URL: $e');
    }
  }
}

// A module that is inlined as a string.
class InlinedModule extends Module {
  const InlinedModule({required String name, required this.sourceCode})
      : super(name);
  final String sourceCode;

  @override
  Future<String> get source async => sourceCode;
}

interface class GlobeRuntime {
  final _$GlobeRuntimeImpl? _instance;

  GlobeRuntime._(this._instance);

  static GlobeRuntime? _cachedInstance;
  static GlobeRuntime get instance {
    if (_cachedInstance != null) return _cachedInstance!;
    return _cachedInstance = GlobeRuntime._(_$GlobeRuntimeImpl());
  }

  FutureOr<void> registerModule(
    Module module, {
    List<FFIConvertible?> args = const [],
  }) async {
    final source = await module.source;
    return _instance!.registerModule(module.name, source, args);
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
