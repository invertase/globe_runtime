//
//  Generated code. Do not modify.
//  source: protos/runtime_data.proto
//
// @dart = 2.12

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_final_fields
// ignore_for_file: unnecessary_import, unnecessary_this, unused_import

import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

class MessageType extends $pb.ProtobufEnum {
  static const MessageType VALUE = MessageType._(0, _omitEnumNames ? '' : 'VALUE');
  static const MessageType ERROR = MessageType._(1, _omitEnumNames ? '' : 'ERROR');
  static const MessageType STREAM_START = MessageType._(2, _omitEnumNames ? '' : 'STREAM_START');
  static const MessageType STREAM_END = MessageType._(3, _omitEnumNames ? '' : 'STREAM_END');

  static const $core.List<MessageType> values = <MessageType> [
    VALUE,
    ERROR,
    STREAM_START,
    STREAM_END,
  ];

  static final $core.Map<$core.int, MessageType> _byValue = $pb.ProtobufEnum.initByValue(values);
  static MessageType? valueOf($core.int value) => _byValue[value];

  const MessageType._($core.int v, $core.String n) : super(v, n);
}


const _omitEnumNames = $core.bool.fromEnvironment('protobuf.omit_enum_names');
