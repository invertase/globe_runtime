part of 'ai_sdk.dart';

typedef _CallAiFnNative
    = NativeFunction<Uint8 Function(Pointer<Utf8>, Uint8, Uint64)>;
typedef _CallAiFnDart = int Function(Pointer<Utf8>, int, int);

typedef _DisposeAiFnNative = NativeFunction<Uint8 Function()>;
typedef _DisposeAiFnDart = int Function();

class _$AISdkImpl implements AISdk {
  final ReceivePort _receivePort;
  final Map<int, Completer<String?>> _completers = <int, Completer<String?>>{};
  int _messageCount = 0;

  static late final dylib = DynamicLibrary.open(
    path.join(
      Directory.current.path,
      'target',
      'debug',
      Platform.isMacOS ? 'libdartv8.dylib' : 'libdartv8.so',
    ),
  );

  final _callAiFnAsync = dylib
      .lookup<_CallAiFnNative>('ai_sdk_execute_async')
      .asFunction<_CallAiFnDart>();

  final _disposeAiFn = dylib
      .lookup<_DisposeAiFnNative>('ai_sdk_dispose_sdk')
      .asFunction<_DisposeAiFnDart>();

  _$AISdkImpl() : _receivePort = ReceivePort("ai_sdk_receive_port") {
    final initialized = dylib
        .lookupFunction<IntPtr Function(Pointer<Void>),
            int Function(Pointer<Void>)>("ai_sdk_initialize_sdk")
        .call(NativeApi.initializeApiDLData);

    if (initialized != 0) {
      throw StateError("Failed to initialize Dart API");
    }

    _receivePort.listen((message) {
      final formattedJson =
          JsonEncoder.withIndent(' ').convert(json.decode(message));

      stdout.writeln('Received message in Dart land: \n$formattedJson');

      _receivePort.close();
    });
  }

  Future<String?> execute(String query, String model, String? apiKey) {
    final completer = Completer<String?>();
    _messageCount += 1;
    final int messageIdentifier = _messageCount;
    _completers[messageIdentifier] = completer;

    final namePtr = "What is the president of Ghana?".toNativeUtf8();
    final int nativePort = _receivePort.sendPort.nativePort;

    _callAiFnAsync(namePtr, messageIdentifier, nativePort);

    calloc.free(namePtr);

    return completer.future;
  }

  void dispose() {
    final result = _disposeAiFn.call();
    if (result == 0) return;
    throw StateError("Failed to dispose AI SDK");
  }
}
