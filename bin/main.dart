import 'dart:io';

import 'package:globe_runtime/globe_runtime.dart';

const OPEN_API_KEY =
    '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';

void main() async {
  final globeAI = GlobeRuntime.AI();

  // future
  final result = await globeAI.generate(
    apiKey: OPEN_API_KEY,
    model: 'gpt-4o',
    query: 'Who is the president of the United States?',
  );
  stdout.writeln(result);

  stdout.writeln('\n');

  // stream
  final stream = globeAI.stream(
    apiKey: OPEN_API_KEY,
    model: 'gpt-4o',
    query: 'Tell me short 5 line story',
  );
  await for (final data in stream) stdout.write(data);

  globeAI.dispose();
}
