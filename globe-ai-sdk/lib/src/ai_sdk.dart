import 'dart:async';
import 'dart:ffi';
import 'dart:io';
import 'dart:isolate';
import 'package:ffi/ffi.dart';
import 'package:path/path.dart' as path;

part 'ai_sdk_impl.dart';

abstract interface class AISdk {
  static final _aiSdkImpl = _$AISdkImpl();

  static Future<String?> run({
    required String query,
    required String model,
    String? apiKey,
  }) async {
    final aiResponse = await _aiSdkImpl.execute(query, model, apiKey);
    if (aiResponse == null) {
      throw Exception('Failed to execute AI query');
    }

    return aiResponse;
  }
}

void main() async {
  final result = await AISdk.run(
    query: 'Greet me in 3 different languages',
    model: 'claude',
  );

  print(result);
}
