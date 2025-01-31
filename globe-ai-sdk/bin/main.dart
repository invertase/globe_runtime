import 'package:globe_ai_sdk/globe_ai_sdk.dart';

void main() async {
  final result = await AISdk.run(
    query: 'Greet me in 3 different languages',
    model: 'claude',
  );

  print(result);

  AISdk.dispose();
}
