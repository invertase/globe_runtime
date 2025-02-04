import 'package:globe_runtime/globe_runtime.dart';

void main() async {
  final globeAI = GlobeRuntime.ai();

  final result = await globeAI.generate(
    model: 'gemini-1.5-flash',
    query: 'Greet me in 3 different languages',
  );

  print(result);

  globeAI.dispose();
}
