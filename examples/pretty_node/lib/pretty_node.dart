import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:globe_runtime/globe_runtime.dart';
import 'package:pretty_node/pretty_node_source.dart';

const moduleName = 'PrettyNode';

Future<String> callJsFunction(
  String functionName, {
  List<FFIConvertible> args = const [],
}) async {
  final completer = Completer<String>();
  GlobeRuntime.instance.callFunction(
    moduleName,
    function: functionName,
    args: args,
    onData: (data) {
      if (data.hasError()) {
        completer.completeError(data.error);
      } else {
        completer.complete(utf8.decode(data.data));
      }
      return true;
    },
  );
  return completer.future;
}

void main() async {
  await GlobeRuntime.instance.registerModule(moduleName, packageSource);

  final prettyBytes = await callJsFunction('make_pretty_bytes', args: [
    569943344333884.toFFIType,
  ]);
  stdout.writeln('Pretty Bytes: $prettyBytes');

  final prettyMs = await callJsFunction('make_pretty_ms', args: [
    8003333.toFFIType,
  ]);
  stdout.writeln('Pretty MS: $prettyMs');

  GlobeRuntime.instance.dispose();

  exit(0);
}
