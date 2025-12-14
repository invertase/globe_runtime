import 'dart:async';
import 'dart:io';

import 'package:pretty_node/full_example/full_example_source.dart';

void main() async {
  final fullExample = await FullExample.create(language: 'en', verbose: true);

  final prettyBytes = await fullExample.makePrettyBytes(569943344333884);
  print('Pretty Bytes: $prettyBytes');

  final prettyMs = await fullExample.makePrettyMs(8003333);
  print('Pretty MS: $prettyMs');

  final sum = await fullExample.calculateSum(10, 20);
  print('Sum: $sum');

  final average = await fullExample.calculateAverage([10, 20, 30, 40, 50]);
  print('Average: $average');

  final isValid = await fullExample.isValid('a');
  print('Is Valid: $isValid');

  final bytes = await fullExample.generateBytes(10);
  print('Bytes: $bytes');

  final metadata = await fullExample.getMetadata('1');
  print('Metadata: $metadata');

  final items = await fullExample.getItems(10);
  print('Items: $items');

  final uniqueValues =
      await fullExample.getUniqueValues([1, 2, 2, 3, 3, 3, 4, 5, 4]);
  print('Unique Values: $uniqueValues');

  final messages = await fullExample.streamMessages(10);
  final completer = Completer<void>();
  messages.listen((message) {
    print('Message: $message');
  }, onDone: completer.complete);

  await completer.future;

  final integers = await fullExample.streamIntegers(10);
  final integerCompleter = Completer<void>();
  integers.listen((integer) {
    print('Integer: $integer');
  }, onDone: integerCompleter.complete);

  await integerCompleter.future;

  final randomNumbers = await fullExample.streamRandomNumbers(10);
  final randomNumbersCompleter = Completer<void>();
  randomNumbers.listen((randomNumber) {
    print('Random Number: $randomNumber');
  }, onDone: randomNumbersCompleter.complete);

  await randomNumbersCompleter.future;

  final updates = await fullExample.streamUpdates(10);
  final updatesCompleter = Completer<void>();
  updates.listen((update) {
    print('Update: $update');
  }, onDone: updatesCompleter.complete);

  await updatesCompleter.future;

  final batches = await fullExample.streamBatches(10, 10);
  final batchesCompleter = Completer<void>();
  batches.listen((batch) {
    print('Batch: $batch');
  }, onDone: batchesCompleter.complete);

  await batchesCompleter.future;

  print('Done');
  fullExample.dispose();

  exit(0);
}
