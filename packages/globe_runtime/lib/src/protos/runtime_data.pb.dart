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

import 'runtime_data.pbenum.dart';

export 'runtime_data.pbenum.dart';

class DartMessage extends $pb.GeneratedMessage {
  factory DartMessage({
    MessageType? type,
    $core.List<$core.int>? data,
  }) {
    final $result = create();
    if (type != null) {
      $result.type = type;
    }
    if (data != null) {
      $result.data = data;
    }
    return $result;
  }
  DartMessage._() : super();
  factory DartMessage.fromBuffer($core.List<$core.int> i, [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) => create()..mergeFromBuffer(i, r);
  factory DartMessage.fromJson($core.String i, [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) => create()..mergeFromJson(i, r);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(_omitMessageNames ? '' : 'DartMessage', package: const $pb.PackageName(_omitMessageNames ? '' : 'globe_runtime'), createEmptyInstance: create)
    ..e<MessageType>(1, _omitFieldNames ? '' : 'type', $pb.PbFieldType.OE, defaultOrMaker: MessageType.VALUE, valueOf: MessageType.valueOf, enumValues: MessageType.values)
    ..a<$core.List<$core.int>>(2, _omitFieldNames ? '' : 'data', $pb.PbFieldType.OY)
    ..hasRequiredFields = false
  ;

  @$core.Deprecated(
  'Using this can add significant overhead to your binary. '
  'Use [GeneratedMessageGenericExtensions.deepCopy] instead. '
  'Will be removed in next major version')
  DartMessage clone() => DartMessage()..mergeFromMessage(this);
  @$core.Deprecated(
  'Using this can add significant overhead to your binary. '
  'Use [GeneratedMessageGenericExtensions.rebuild] instead. '
  'Will be removed in next major version')
  DartMessage copyWith(void Function(DartMessage) updates) => super.copyWith((message) => updates(message as DartMessage)) as DartMessage;

  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static DartMessage create() => DartMessage._();
  DartMessage createEmptyInstance() => create();
  static $pb.PbList<DartMessage> createRepeated() => $pb.PbList<DartMessage>();
  @$core.pragma('dart2js:noInline')
  static DartMessage getDefault() => _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<DartMessage>(create);
  static DartMessage? _defaultInstance;

  @$pb.TagNumber(1)
  MessageType get type => $_getN(0);
  @$pb.TagNumber(1)
  set type(MessageType v) { setField(1, v); }
  @$pb.TagNumber(1)
  $core.bool hasType() => $_has(0);
  @$pb.TagNumber(1)
  void clearType() => clearField(1);

  @$pb.TagNumber(2)
  $core.List<$core.int> get data => $_getN(1);
  @$pb.TagNumber(2)
  set data($core.List<$core.int> v) { $_setBytes(1, v); }
  @$pb.TagNumber(2)
  $core.bool hasData() => $_has(1);
  @$pb.TagNumber(2)
  void clearData() => clearField(2);
}


const _omitFieldNames = $core.bool.fromEnvironment('protobuf.omit_field_names');
const _omitMessageNames = $core.bool.fromEnvironment('protobuf.omit_message_names');
