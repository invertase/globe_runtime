import 'dart:convert';
import 'dart:io';
import 'package:globe_neon/globe_neon.dart';

// ignore: constant_identifier_names
const NEON_DB_URL =
    'postgresql://neondb_owner:npg_m0JcpqH8PkOU@ep-cold-sunset-a5r0xvn1-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';

void main() async {
  final neon = GlobeNeonSdk.create(NEON_DB_URL);

  var result = await neon.sql('SELECT * FROM posts');

  print(JsonEncoder.withIndent(' ').convert(result));

  result = await neon.transaction([
    NeonSQL.sql('SELECT * FROM posts'),
    NeonSQL.sql('SELECT * FROM posts WHERE id = 1'),
  ]);

  print(JsonEncoder.withIndent(' ').convert(result));

  exit(0);
}
