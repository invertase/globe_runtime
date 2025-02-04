import 'package:globe_runtime/globe_runtime.dart';

void main() async {
  final globeAI = GlobeRuntime.AI();

  final result = await globeAI.generate(
    model: 'gemini-1.5-flash',
    query: 'How many planets do we have?',
  );

  print(result);

  globeAI.dispose();
}
