import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:globe_runtime/globe_runtime.dart';
import 'package:path/path.dart' as path;

final module = FileModule(
  name: 'BasicExample',
  filePath: path.join(Directory.current.path, 'lib', 'basic_example.js'),
);

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

void main() async {
  await module.register(args: ['100'.toFFIType]);

  final result = await callJsFunction(
    'fetch_url',
    args: ['https://jsonplaceholder.typicode.com/todos'.toFFIType],
  ).then((data) => data.unpack());
  stdout.writeln(JsonEncoder.withIndent('  ').convert(result));

  exit(0);
}
