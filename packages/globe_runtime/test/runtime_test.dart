import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:globe_runtime/globe_runtime.dart';
import 'package:test/test.dart';
import 'package:path/path.dart' as path;

void main() {
  final module = FileModule(
    name: 'TestModule',
    filePath: path.join(Directory.current.path, 'test', 'module.js'),
  );

  final runtime = GlobeRuntime.instance;

  Future<List<int>> callJsFunction(
    String functionName, {
    List<FFIConvertible> args = const [],
  }) async {
    final completer = Completer<List<int>>();
    module.callFunction(
      functionName,
      args: args,
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          completer.complete(data.data);
        }
        return true;
      },
    );
    return completer.future;
  }

  test('should return same instance', () {
    expect(runtime, equals(GlobeRuntime.instance));
  });

  test('should return runtime version', () {
    expect(runtime.version, isNotNull);
  });

  test('should register module', () async {
    await module.register(args: ['Foobar'.toFFIType]);

    expect(module.isReady, isTrue);
  });

  test('should call function from module', () async {
    final result = await callJsFunction(
      'say_hello',
      args: ['FooBar'.toFFIType],
    ).then(utf8.decode);

    expect(result, 'Hello, FooBar');
  });

  group('JSON Encoding & Decoding (JsonPayload)', () {
    const mapData = {
      'name': 'FooBar',
      'age': 42,
      'isAlive': true,
      'friends': ['Alice', 'Bob'],
      'address': {
        'city': 'Wonderland',
        'zipCode': 12345,
      },
    };

    test('should encode object', () async {
      final result = await callJsFunction('json_encode').then(
        (data) => data.unpack(),
      );

      expect(
        result,
        isA<Map<dynamic, dynamic>>().having(
          (d) => d,
          'has same data',
          mapData,
        ),
      );
    });

    test('should decode object', () async {
      final result =
          await callJsFunction('json_decode', args: [mapData.toFFIType])
              .then((data) => data.unpack());

      expect(
        result,
        isA<List<dynamic>>().having(
          (d) => d,
          'has same keys',
          mapData.keys.toList(),
        ),
      );
    });
  });

  test('should call fetch from javascript (Promise)', () async {
    final result = await callJsFunction(
      'fetch_url',
      args: ['https://jsonplaceholder.typicode.com/posts/1'.toFFIType],
    ).then((data) => data.unpack());

    expect(
      result,
      isA<Map<dynamic, dynamic>>().having((data) => data.keys, 'has keys', [
        'userId',
        'id',
        'title',
        'body',
      ]),
    );
  });

  test('should call fetch from javascript (Streamed)', () async {
    final streamController = StreamController<List<int>>();

    runtime.callFunction(
      module.name,
      function: 'fetch_url_streamed',
      args: ['https://jsonplaceholder.typicode.com/posts/1'.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          streamController.addError(data.error);
        } else {
          streamController.add(data.data);
        }

        if (data.done) {
          streamController.close();
        }
        return data.done;
      },
    );

    final response =
        await utf8.decodeStream(streamController.stream).then(jsonDecode);

    expect(
      response,
      isA<Map<dynamic, dynamic>>().having((data) => data.keys, 'has keys', [
        'userId',
        'id',
        'title',
        'body',
      ]),
    );
  });

  test('should catch errors from Javascript', () async {
    try {
      runtime.callFunction(
        module.name,
        function: 'throw_error',
        onData: (data) => true,
      );
    } catch (e) {
      expect(e, isA<StateError>());
    }
  });
}
