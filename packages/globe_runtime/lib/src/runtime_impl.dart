part of 'runtime.dart';

final class NativeGlobeRuntime extends dart_ffi.Opaque {}

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
  int,
  Pointer<Pointer<Void>>,
  Pointer<Int32>,
  Pointer<IntPtr>,
  int,
  Pointer<Pointer<Utf8>>,
);

typedef _DisposeAiFnNative = NativeFunction<Uint8 Function()>;
typedef _DisposeAiFnDart = int Function();

class _$GlobeRuntimeImpl implements GlobeRuntime {
  final ReceivePort _receivePort;
  final HashMap<int, OnFunctionData> _callbacks = HashMap();

  int _messageCount = 0;

  static late final dylib = DynamicLibrary.open(
    path.join(
      '/Users/codekeyz/Projects/OpenSource/dart_v8_runtime',
      'target',
      'debug',
      Platform.isMacOS ? 'libglobe_runtime.dylib' : 'libglobe_runtime.so',
    ),
  );

  final _globeRuntimeInitFn = dylib
      .lookup<_CallGlobeRuntimeInitFnNative>('init_runtime')
      .asFunction<_CallGlobeRuntimeInitFnDart>();

  final _disposeAiFn = dylib
      .lookup<_DisposeAiFnNative>('dispose_runtime')
      .asFunction<_DisposeAiFnDart>();

  final _callGlobeFunction = dylib
      .lookup<_CallGlobeFunctionNative>('call_globe_function')
      .asFunction<_CallGlobeFunctionFnDart>();

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
      final callbackData = data[1] as Uint8List;

      // If the callback returns true, remove it from the list
      final completed = _callbacks[callbackId]!(callbackData);
      if (completed) _callbacks.remove(callbackId);
    });

    ProcessSignal.sigterm.watch().listen((_) {
      dispose();
    });
  }

  void dispose() {
    _receivePort.close();

    final result = _disposeAiFn.call();
    if (result == 0) return;
    throw StateError("Failed to dispose AI SDK");
  }

  @override
  void call_function({
    required String function,
    List<FFIConvertible?> args = const [],
    required OnFunctionData onData,
  }) {
    final Pointer<Pointer<Utf8>> errorPtr = calloc();
    final functionNamePtr = function.toNativeUtf8();
    final Pointer<Pointer<Void>> argPointers = calloc(args.length);
    final Pointer<Int32> typeIds = calloc(args.length);
    final Pointer<IntPtr> sizes = calloc(args.length);

    for (int i = 0; i < args.length; i++) {
      final objectAtIndex = args[i];

      argPointers[i] = objectAtIndex == null ? nullptr : objectAtIndex.toFFI();
      typeIds[i] = objectAtIndex == null
          ? FFITypeId.none.value
          : objectAtIndex.typeId.value;

      if (objectAtIndex is FFIBytes) {
        sizes[i] = objectAtIndex.value.length;
      } else {
        sizes[i] = 0;
      }
    }

    _messageCount += 1;
    final int messageIdentifier = _messageCount;
    _callbacks[messageIdentifier] = onData;

    final callResult = _callGlobeFunction(
      functionNamePtr,
      messageIdentifier,
      argPointers,
      typeIds,
      sizes,
      args.length,
      errorPtr,
    );

    calloc.free(functionNamePtr);
    calloc.free(argPointers);
    calloc.free(typeIds);

    if (callResult != 0) {
      final Pointer<Utf8> errorMsgPtr = errorPtr.value;
      final errorMgs = errorMsgPtr.address == 0
          ? "Failed to call Globe Function"
          : errorMsgPtr.toDartString();

      throw StateError(errorMgs);
    }

    calloc.free(errorPtr);
  }

  @override
  void loadModule(String modulePath, {String? workingDirectory}) {}
}
