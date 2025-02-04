import 'package:globe_runtime/globe_runtime.dart';

void main() async {
  final globeAI = GlobeRuntime.AI();

  final result = await globeAI.generate(
    model: 'gemini-1.5-flash',
    query: 'What is the eral value of pie?',
  );

  print(result);

  globeAI.dispose();
}
