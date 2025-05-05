//
//  Generated code. Do not modify.
//  source: dart_runtime_entry.proto
//
// @dart = 2.12

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_final_fields
// ignore_for_file: unnecessary_import, unnecessary_this, unused_import

import 'dart:convert' as $convert;
import 'dart:core' as $core;
import 'dart:typed_data' as $typed_data;

@$core.Deprecated('Use dartMessageDescriptor instead')
const DartMessage$json = {
  '1': 'DartMessage',
  '2': [
    {'1': 'done', '3': 2, '4': 1, '5': 8, '10': 'done'},
    {'1': 'data', '3': 3, '4': 1, '5': 12, '9': 0, '10': 'data'},
    {'1': 'error', '3': 4, '4': 1, '5': 9, '9': 0, '10': 'error'},
  ],
  '8': [
    {'1': 'payload'},
  ],
};

/// Descriptor for `DartMessage`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List dartMessageDescriptor = $convert.base64Decode(
    'CgtEYXJ0TWVzc2FnZRISCgRkb25lGAIgASgIUgRkb25lEhQKBGRhdGEYAyABKAxIAFIEZGF0YR'
    'IWCgVlcnJvchgEIAEoCUgAUgVlcnJvckIJCgdwYXlsb2Fk');

@$core.Deprecated('Use sendValueRequestDescriptor instead')
const SendValueRequest$json = {
  '1': 'SendValueRequest',
  '2': [
    {'1': 'callback_id', '3': 1, '4': 1, '5': 5, '10': 'callbackId'},
    {
      '1': 'message',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.globe.runtime.DartMessage',
      '10': 'message'
    },
  ],
};

/// Descriptor for `SendValueRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List sendValueRequestDescriptor = $convert.base64Decode(
    'ChBTZW5kVmFsdWVSZXF1ZXN0Eh8KC2NhbGxiYWNrX2lkGAEgASgFUgpjYWxsYmFja0lkEjQKB2'
    '1lc3NhZ2UYAiABKAsyGi5nbG9iZS5ydW50aW1lLkRhcnRNZXNzYWdlUgdtZXNzYWdl');

@$core.Deprecated('Use rpcResponseDescriptor instead')
const RpcResponse$json = {
  '1': 'RpcResponse',
  '2': [
    {'1': 'success', '3': 1, '4': 1, '5': 8, '10': 'success'},
  ],
};

/// Descriptor for `RpcResponse`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List rpcResponseDescriptor = $convert
    .base64Decode('CgtScGNSZXNwb25zZRIYCgdzdWNjZXNzGAEgASgIUgdzdWNjZXNz');

const $core.Map<$core.String, $core.dynamic> DartJSServiceBase$json = {
  '1': 'DartJSService',
  '2': [
    {
      '1': 'SendValue',
      '2': '.globe.runtime.SendValueRequest',
      '3': '.globe.runtime.RpcResponse'
    },
  ],
};

@$core.Deprecated('Use dartJSServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    DartJSServiceBase$messageJson = {
  '.globe.runtime.SendValueRequest': SendValueRequest$json,
  '.globe.runtime.DartMessage': DartMessage$json,
  '.globe.runtime.RpcResponse': RpcResponse$json,
};

/// Descriptor for `DartJSService`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List dartJSServiceDescriptor = $convert.base64Decode(
    'Cg1EYXJ0SlNTZXJ2aWNlEkgKCVNlbmRWYWx1ZRIfLmdsb2JlLnJ1bnRpbWUuU2VuZFZhbHVlUm'
    'VxdWVzdBoaLmdsb2JlLnJ1bnRpbWUuUnBjUmVzcG9uc2U=');
