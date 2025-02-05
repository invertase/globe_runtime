import 'dart:convert';

import 'package:globe_runtime/globe_runtime.dart';

const NEON_DB_URL =
    'postgresql://neondb_owner:npg_m0JcpqH8PkOU@ep-cold-sunset-a5r0xvn1-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';

void main() async {
  final GlobeNeonDriver neon = GlobeRuntime.Neon(NEON_DB_URL);

  final result = await neon.sql('SELECT * FROM posts');

  print(JsonEncoder.withIndent(' ').convert(result));

  neon.dispose();
}
