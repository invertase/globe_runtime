import 'dart:io';

import 'package:pretty_node/pretty_node_source.dart';

void main(List<String> args) async {
  final prettyNode = await PrettyNode.create(language: 'en', verbose: true);

  final prettyBytes = await prettyNode.makePrettyBytes(569943344333884);
  print('Pretty Bytes: $prettyBytes');

  final prettyMs = await prettyNode.makePrettyMs(8003333);
  print('Pretty MS: $prettyMs');

  prettyNode.dispose();
  exit(0);
}
