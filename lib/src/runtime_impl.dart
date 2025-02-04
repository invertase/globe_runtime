part of 'runtime.dart';

final class NativeGlobeRuntime extends dart_ffi.Opaque {}

typedef _CallGlobeRuntimeInitFnNative = NativeFunction<
    Int Function(
      Pointer<Utf8>,
      Pointer<Void>,
      Uint64,
      Pointer<Pointer<NativeGlobeRuntime>>,
    )>;
typedef _CallGlobeRuntimeInitFnDart = int Function(
  Pointer<Utf8>,
  Pointer<Void>,
  int,
  Pointer<Pointer<NativeGlobeRuntime>>,
);

typedef _CallGlobeFunctionNative = NativeFunction<
    Int Function(
      Pointer<Utf8>,
      Int,
      Pointer<Pointer<Void>>,
      Pointer<Int32>,
      Pointer<Pointer<NativeGlobeRuntime>>,
    )>;
typedef _CallGlobeFunctionFnDart = int Function(
  Pointer<Utf8>,
  int,
  Pointer<Pointer<Void>>,
  Pointer<Int32>,
  Pointer<Pointer<NativeGlobeRuntime>>,
);

typedef _DisposeAiFnNative = NativeFunction<Uint8 Function()>;
typedef _DisposeAiFnDart = int Function();

class _$GlobeRuntimeImpl implements GlobeRuntime {
  final ReceivePort _receivePort;
  final HashMap<int, OnFunctionData> _completers = HashMap();
  final Pointer<Pointer<NativeGlobeRuntime>> runtimeOut = allocate();

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
      .lookup<_CallGlobeFunctionNative>('call_js_function')
      .asFunction<_CallGlobeFunctionFnDart>();

  _$GlobeRuntimeImpl(String module)
      : _receivePort = ReceivePort("globe_runtime") {
    final modulePtr = module.toNativeUtf8();
    final initialized = _globeRuntimeInitFn.call(
      modulePtr,
      NativeApi.initializeApiDLData,
      _receivePort.sendPort.nativePort,
      runtimeOut,
    );
    if (initialized != 0) {
      throw StateError("Failed to initialize Dart API");
    }

    calloc.free(modulePtr);

    _receivePort.listen((message) {
      final formattedJson =
          JsonEncoder.withIndent(' ').convert(json.decode(message));

      stdout.writeln('Received message in Dart land: \n$formattedJson');

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

    for (int i = 0; i < args.length; i++) {
      final objectAtIndex = args[i];

      argPointers[i] = objectAtIndex == null ? nullptr : objectAtIndex.toFFI();
      typeIds[i] = objectAtIndex == null
          ? FFITypeId.none.value
          : objectAtIndex.typeId.value;
    }

    _messageCount += 1;
    final int messageIdentifier = _messageCount;
    _completers[messageIdentifier] = onData;

    _callGlobeFunction(
      functionNamePtr,
      messageIdentifier,
      argPointers,
      typeIds,
      runtimeOut,
    );

    calloc.free(functionNamePtr);
    calloc.free(argPointers);
    calloc.free(typeIds);
  }
}
