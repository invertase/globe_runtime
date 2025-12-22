import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'js_to_dart_docs_source.dart';

void main() async {
  print('Initializing runtime for JsToDartDocs...');
  // Initialize the runtime
  final sdk =
      await JsToDartDocs.create(apiUrl: 'https://jsonplaceholder.typicode.com');
  print('Runtime initialized for JsToDartDocs');

  // Stream all users
  final completer = Completer<void>();
  String users = '';
  sdk.streamAllUsers().listen((chunk) {
    print('Users streamed: $chunk');
    users += chunk;
  }, onDone: completer.complete);
  await completer.future;
  final usersJson = jsonDecode(users) as List;
  print('Users: ${usersJson.length}');

  // Get user data
  final userId = usersJson.isNotEmpty ? usersJson.first['id'] : '';
  print('First user ID: $userId');

  final userData = await sdk.getUserData(userId);
  print('User data: $userData');

  // Calculate sum
  final sum = await sdk.calculateSum(10, 20);
  print('Sum: $sum');

  // Dispose
  print('Disposing runtime for JsToDartDocs...');
  sdk.dispose();

  exit(0);
}
