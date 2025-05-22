import 'dart:io';

import 'package:globe_runtime/globe_runtime.dart';
import 'package:test/test.dart';

void main() {
  final GlobeRuntime runtime = GlobeRuntime.instance;

  test('should return same instance', () {
    expect(runtime, equals(GlobeRuntime.instance));
  });

  test('should return runtime version', () {
    final version = runtime.version;
    stdout.write('Runtime version: $version');
    expect(version, isNotNull);
  });
}
