part of 'runtime.dart';

final class NativeGlobeRuntime extends dart_ffi.Opaque {}

typedef _CallGlobeRuntimeInitFnNative = NativeFunction<
    Int Function(
      Pointer<Utf8>, // module
      Pointer<Void>, // dart API-DL
      Uint64, // dart send port
      Pointer<Pointer<Utf8>>, // error pointer
    )>;
typedef _CallGlobeRuntimeInitFnDart = int Function(
  Pointer<Utf8>,
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
    )>;
typedef _CallGlobeFunctionFnDart = int Function(
  Pointer<Utf8>,
  int,
  Pointer<Pointer<Void>>,
  Pointer<Int32>,
  Pointer<IntPtr>,
  int,
);

typedef _DisposeAiFnNative = NativeFunction<Uint8 Function()>;
typedef _DisposeAiFnDart = int Function();

class _$GlobeRuntimeImpl implements GlobeRuntime {
  final ReceivePort _receivePort;
  final HashMap<int, OnFunctionData> _completers = HashMap();

  int _messageCount = 0;

  static late final dylib = DynamicLibrary.open(
    path.join(
      Directory.current.path,
      'target',
      'debug',
      Platform.isMacOS ? 'libdartv8.dylib' : 'libdartv8.so',
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

  _$GlobeRuntimeImpl(String module)
      : _receivePort = ReceivePort("globe_runtime") {
    final modulePtr = module.toNativeUtf8();
    final Pointer<Pointer<Utf8>> errorPtr = calloc();

    final initialized = _globeRuntimeInitFn.call(
      modulePtr,
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

    calloc.free(modulePtr);
    calloc.free(errorPtr);

    _receivePort.listen((data) {
      if (data is! Uint8List) return;

      final jsonData = utf8.decode(data);
      final decodedData = jsonDecode(jsonData);

      final callbackId = decodedData['callback_id'];
      _completers[callbackId]!(decodedData['data']);
      _completers.remove(callbackId);

      _receivePort.close();
    });
  }

  void dispose() {
    final result = _disposeAiFn.call();
    if (result == 0) return;
    throw StateError("Failed to dispose AI SDK");
  }

  @override
  _$GlobeRuntimeImpl get _impl => this;

  @override
  void call_function({
    required String function,
    List<FFIConvertible?> args = const [],
    required OnFunctionData onData,
  }) {
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
        sizes[i] = objectAtIndex.value.length; // ✅ Store size of Uint8List
      } else {
        sizes[i] = 0; // ✅ Default for non-binary types
      }
    }

    _messageCount += 1;
    final int messageIdentifier = _messageCount;
    _completers[messageIdentifier] = onData;

    _callGlobeFunction(
      functionNamePtr,
      messageIdentifier,
      argPointers,
      typeIds,
      sizes,
      args.length,
    );

    calloc.free(functionNamePtr);
    calloc.free(argPointers);
    calloc.free(typeIds);
  }
}
