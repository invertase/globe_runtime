import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:globe_runtime/globe_runtime.dart';
import 'package:path/path.dart' as path;

const moduleName = 'BasicExample';

Future<List<int>> callJsFunction(
  String functionName, {
  List<FFIConvertible> args = const [],
}) async {
  final completer = Completer<List<int>>();
  GlobeRuntime.instance.callFunction(
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

void main() async {
  final runtime = GlobeRuntime.instance;
  final jsCodePath =
      path.join(Directory.current.path, 'lib', 'basic_example.js');

  await runtime.registerModule(
    moduleName,
    jsCodePath,
    args: ['100'.toFFIType],
  );

  final result = await callJsFunction(
    'fetch_url',
    args: ['https://jsonplaceholder.typicode.com/todos/1'.toFFIType],
  ).then((data) => JsonPayload(data: data).unpack());
  stdout.writeln(JsonEncoder.withIndent('  ').convert(result));

  exit(0);
}
