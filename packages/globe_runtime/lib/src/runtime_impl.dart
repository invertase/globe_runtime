part of 'runtime.dart';

typedef GetRuntimeVersionC = NativeFunction<Pointer<Utf8> Function()>;
typedef GetRuntimeVersionDart = Pointer<Utf8> Function();

typedef _CallGlobeRuntimeInitFnNative = NativeFunction<
    Int Function(
      Pointer<Void>, // dart API-DL
      Uint64, // dart send port
      Pointer<Pointer<Utf8>>, // error pointer
    )>;
typedef _CallGlobeRuntimeInitFnDart = int Function(
  Pointer<Void>,
  int,
  Pointer<Pointer<Utf8>>,
);

typedef _CallGlobeFunctionNative = NativeFunction<
    Int Function(
      Pointer<Utf8>, // Module name
      Pointer<Utf8>, // Function name
      Int, // Message identifier
      Pointer<Pointer<Void>>, // Arguments pointer
      Pointer<Int32>, // Argument type IDs
      Pointer<IntPtr>, // Argument sizes (for List<String>, Uint8List)
      Int, // Number of arguments
      Pointer<Pointer<Utf8>>, // error pointer
    )>;
typedef _CallGlobeFunctionFnDart = int Function(
  Pointer<Utf8>,
  Pointer<Utf8>,
  int,
  Pointer<Pointer<Void>>,
  Pointer<Int32>,
  Pointer<IntPtr>,
  int,
  Pointer<Pointer<Utf8>>,
);

typedef _RegisterModuleFnNative = NativeFunction<
    Uint8 Function(
      Pointer<Utf8>,
      Pointer<Utf8>,
      Pointer<Pointer<Utf8>>,
      //
      Pointer<Pointer<Void>>, // Arguments pointer
      Pointer<Int32>, // Argument type IDs
      Pointer<IntPtr>, // Argument sizes (for List<String>, Uint8List)
      Int, // Number of arguments
    )>;
typedef _RegisterModuleFnDart = int Function(
  Pointer<Utf8>,
  Pointer<Utf8>,
  Pointer<Pointer<Utf8>>,
  //
  Pointer<Pointer<Void>>,
  Pointer<Int32>,
  Pointer<IntPtr>,
  int,
);

typedef _IsModuleRegisteredFnNative
    = NativeFunction<Uint8 Function(Pointer<Utf8>)>;
typedef _IsModuleRegisteredFnDart = int Function(Pointer<Utf8>);

typedef _DisposeAiFnNative = NativeFunction<Uint8 Function()>;
typedef _DisposeAiFnDart = int Function();

void validateRuntimeLibraryExists(String path) {
  if (!File(path).existsSync()) {
    throw StateError(
      'Globe Runtime library not found at $path. '
      'Please run `globe runtime install` to install it.',
    );
  }
}

String? _dylibPathCache;
String get _dylibPath {
  if (_dylibPathCache != null) return _dylibPathCache!;

  if (Platform.environment['GLOBE'] != null) {
    return _dylibPathCache = '/usr/lib/$dylibName';
  }

  var filePath =
      path.join(Directory.current.path, 'target', 'debug', dylibName);
  if (File(filePath).existsSync()) return _dylibPathCache = filePath;

  return _dylibPathCache = path.join(globeRuntimeInstallDirectory, dylibName);
}

class _$GlobeRuntimeImpl {
  final ReceivePort _receivePort;
  final HashMap<int, OnFunctionData> _callbacks = HashMap();

  int _messageCount = 0;

  static final dylib = () {
    final libraryPath =
        Platform.environment['GLOBE_RUNTIME_LIB_PATH'] ?? _dylibPath;
    validateRuntimeLibraryExists(libraryPath);
    return DynamicLibrary.open(libraryPath);
  }();

  final _globeRuntimeInitFn = dylib
      .lookup<_CallGlobeRuntimeInitFnNative>('init_runtime')
      .asFunction<_CallGlobeRuntimeInitFnDart>();

  final _registerModuleFn = dylib
      .lookup<_RegisterModuleFnNative>('register_module')
      .asFunction<_RegisterModuleFnDart>();

  final _isModuleRegisteredFn = dylib
      .lookup<_IsModuleRegisteredFnNative>('is_module_registered')
      .asFunction<_IsModuleRegisteredFnDart>();

  final _callGlobeFunction = dylib
      .lookup<_CallGlobeFunctionNative>('call_js_function')
      .asFunction<_CallGlobeFunctionFnDart>();

  final _disposeRuntimeFn = dylib
      .lookup<_DisposeAiFnNative>('dispose_runtime')
      .asFunction<_DisposeAiFnDart>();

  // Lookup the symbol
  final GetRuntimeVersionDart getRuntimeVersion =
      dylib.lookup<GetRuntimeVersionC>('get_runtime_version').asFunction();

  _$GlobeRuntimeImpl() : _receivePort = ReceivePort("globe_runtime") {
    final Pointer<Pointer<Utf8>> errorPtr = calloc();
    final initialized = _globeRuntimeInitFn.call(
      NativeApi.initializeApiDLData,
      _receivePort.sendPort.nativePort,
      errorPtr,
    );
    if (initialized != 0) {
      final Pointer<Utf8> errorMsgPtr = errorPtr.value;
      final errorMgs = errorMsgPtr.address == 0
          ? "Failed to initialize Globe Runtime"
          : errorMsgPtr.toDartString();

      throw StateError(errorMgs);
    }

    calloc.free(errorPtr);

    _receivePort.listen((data) {
      if (data is! List) return;

      // callbackId will always be the first element
      final callbackId = data[0] as int;

      final callbackData = DartMessage.fromBuffer(data[1]);

      final callback = _callbacks[callbackId];
      if (callback == null) return;

      // If the callback returns true, remove it from the list
      if (callback(callbackData)) _callbacks.remove(callbackId);
    });

    ProcessSignal.sigterm.watch().listen((_) {
      dispose();
    });
  }

  String getVersion() {
    final versionPtr = getRuntimeVersion();
    return versionPtr.toDartString();
  }

  void dispose() {
    _receivePort.close();
    final result = _disposeRuntimeFn.call();
    if (result == 0) return;
    throw StateError("Failed to dispose AI SDK");
  }

  void callFunction(
    String moduleName, {
    required String function,
    List<FFIConvertible?> args = const [],
    required OnFunctionData onData,
  }) {
    final moduleNamePtr = moduleName.toNativeUtf8();
    final functionNamePtr = function.toNativeUtf8();
    final arguments = getTypeArguments(args);

    final Pointer<Pointer<Utf8>> errorPtr = calloc();

    _messageCount += 1;
    final int messageIdentifier = _messageCount;
    _callbacks[messageIdentifier] = onData;

    final callResult = _callGlobeFunction(
      moduleNamePtr,
      functionNamePtr,
      messageIdentifier,
      arguments.argPointers,
      arguments.typeIds,
      arguments.sizes,
      args.length,
      errorPtr,
    );

    malloc.free(functionNamePtr);
    malloc.free(moduleNamePtr);
    arguments.free();

    if (callResult != 0) {
      final Pointer<Utf8> errorMsgPtr = errorPtr.value;
      final errorMgs = errorMsgPtr.address == 0
          ? "Failed to call Globe Function"
          : errorMsgPtr.toDartString();

      throw StateError(errorMgs);
    }

    calloc.free(errorPtr);
  }

  FutureOr<void> registerModule(
    String name,
    String source,
    List<FFIConvertible?> args,
  ) async {
    final arguments = getTypeArguments(args);

    final moduleNamePtr = name.toNativeUtf8();
    final moduleSrcPtr = source.toNativeUtf8();

    final Pointer<Pointer<Utf8>> errorPtr = calloc();

    if (_registerModuleFn(
          moduleNamePtr,
          moduleSrcPtr,
          errorPtr,
          arguments.argPointers,
          arguments.typeIds,
          arguments.sizes,
          args.length,
        ) !=
        0) {
      final Pointer<Utf8> errorMsgPtr = errorPtr.value;
      final errorMgs = errorMsgPtr.address == 0
          ? "Failed to register `$name` module"
          : errorMsgPtr.toDartString();

      throw StateError(errorMgs);
    }

    malloc.free(moduleNamePtr);
    malloc.free(moduleSrcPtr);
    calloc.free(errorPtr);
  }

  bool isModuleRegisted(String moduleName) {
    final moduleNamePtr = moduleName.toNativeUtf8();
    final result = _isModuleRegisteredFn(moduleNamePtr);
    malloc.free(moduleNamePtr);
    return result == 0;
  }
}

String get globeRuntimeInstallDirectory {
  return path.join(userHomeDirectory, '.globe', 'runtime');
}

String get userHomeDirectory {
  if (Platform.isWindows) {
    return Platform.environment['USERPROFILE'] ?? r'C:\Users\Default';
  } else {
    return Platform.environment['HOME'] ?? '/';
  }
}

String get dylibName {
  final currentAbi = Abi.current();

  return switch (currentAbi) {
    Abi.macosX64 => 'libglobe_runtime-x86_64-apple-darwin.dylib',
    Abi.macosArm64 => 'libglobe_runtime-aarch64-apple-darwin.dylib',
    Abi.linuxX64 => 'libglobe_runtime-x86_64-unknown-linux-gnu.so',
    Abi.linuxArm64 => 'libglobe_runtime-aarch64-unknown-linux-gnu.so',
    Abi.windowsX64 => 'globe_runtime-x86_64-pc-windows-msvc.dll',
    _ => throw UnsupportedError('Unsupported ABI: $currentAbi'),
  };
}
