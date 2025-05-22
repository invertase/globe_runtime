import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:globe_runtime/globe_runtime.dart';
import 'package:test/test.dart';
import 'package:path/path.dart' as path;

void main() {
  final modulePath = path.join(Directory.current.path, 'test', 'module.js');
  const moduleName = 'TestModule';

  final runtime = GlobeRuntime.instance;

  Future<List<int>> callJsFunction(
    String functionName, {
    List<FFIConvertible> args = const [],
  }) async {
    final completer = Completer<List<int>>();
    runtime.callFunction(
      moduleName,
      function: functionName,
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
    await runtime.registerModule(
      moduleName,
      modulePath,
      args: ['Foobar'.toFFIType],
    );

    expect(runtime.isModuleRegistered(moduleName), isTrue);
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
      final mapDataAsArg = mapData.pack();
      final result = await callJsFunction('json_decode', args: [mapDataAsArg])
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

  test('should call fetch from javascript', () async {
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
}
