//
//  Generated code. Do not modify.
//  source: protos/runtime_data.proto
//
// @dart = 2.12

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_final_fields
// ignore_for_file: unnecessary_import, unnecessary_this, unused_import

import 'dart:convert' as $convert;
import 'dart:core' as $core;
import 'dart:typed_data' as $typed_data;

@$core.Deprecated('Use messageTypeDescriptor instead')
const MessageType$json = {
  '1': 'MessageType',
  '2': [
    {'1': 'VALUE', '2': 0},
    {'1': 'ERROR', '2': 1},
    {'1': 'STREAM_START', '2': 2},
    {'1': 'STREAM_END', '2': 3},
  ],
};

/// Descriptor for `MessageType`. Decode as a `google.protobuf.EnumDescriptorProto`.
final $typed_data.Uint8List messageTypeDescriptor = $convert.base64Decode(
    'CgtNZXNzYWdlVHlwZRIJCgVWQUxVRRAAEgkKBUVSUk9SEAESEAoMU1RSRUFNX1NUQVJUEAISDg'
    'oKU1RSRUFNX0VORBAD');

@$core.Deprecated('Use dartMessageDescriptor instead')
const DartMessage$json = {
  '1': 'DartMessage',
  '2': [
    {'1': 'type', '3': 1, '4': 1, '5': 14, '6': '.globe_runtime.MessageType', '10': 'type'},
    {'1': 'data', '3': 2, '4': 1, '5': 12, '10': 'data'},
  ],
};

/// Descriptor for `DartMessage`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List dartMessageDescriptor = $convert.base64Decode(
    'CgtEYXJ0TWVzc2FnZRIuCgR0eXBlGAEgASgOMhouZ2xvYmVfcnVudGltZS5NZXNzYWdlVHlwZV'
    'IEdHlwZRISCgRkYXRhGAIgASgMUgRkYXRh');

