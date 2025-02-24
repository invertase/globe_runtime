//
//  Generated code. Do not modify.
//  source: dart_runtime_data.proto
//
// @dart = 2.12

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_final_fields
// ignore_for_file: unnecessary_import, unnecessary_this, unused_import

import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

enum DartMessage_Payload {
  data, 
  error, 
  notSet
}

class DartMessage extends $pb.GeneratedMessage {
  factory DartMessage({
    $core.bool? done,
    $core.List<$core.int>? data,
    $core.String? error,
  }) {
    final $result = create();
    if (done != null) {
      $result.done = done;
    }
    if (data != null) {
      $result.data = data;
    }
    if (error != null) {
      $result.error = error;
    }
    return $result;
  }
  DartMessage._() : super();
  factory DartMessage.fromBuffer($core.List<$core.int> i, [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) => create()..mergeFromBuffer(i, r);
  factory DartMessage.fromJson($core.String i, [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) => create()..mergeFromJson(i, r);

  static const $core.Map<$core.int, DartMessage_Payload> _DartMessage_PayloadByTag = {
    3 : DartMessage_Payload.data,
    4 : DartMessage_Payload.error,
    0 : DartMessage_Payload.notSet
  };
  static final $pb.BuilderInfo _i = $pb.BuilderInfo(_omitMessageNames ? '' : 'DartMessage', package: const $pb.PackageName(_omitMessageNames ? '' : 'globe_runtime'), createEmptyInstance: create)
    ..oo(0, [3, 4])
    ..aOB(2, _omitFieldNames ? '' : 'done')
    ..a<$core.List<$core.int>>(3, _omitFieldNames ? '' : 'data', $pb.PbFieldType.OY)
    ..aOS(4, _omitFieldNames ? '' : 'error')
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

  DartMessage_Payload whichPayload() => _DartMessage_PayloadByTag[$_whichOneof(0)]!;
  void clearPayload() => clearField($_whichOneof(0));

  @$pb.TagNumber(2)
  $core.bool get done => $_getBF(0);
  @$pb.TagNumber(2)
  set done($core.bool v) { $_setBool(0, v); }
  @$pb.TagNumber(2)
  $core.bool hasDone() => $_has(0);
  @$pb.TagNumber(2)
  void clearDone() => clearField(2);

  @$pb.TagNumber(3)
  $core.List<$core.int> get data => $_getN(1);
  @$pb.TagNumber(3)
  set data($core.List<$core.int> v) { $_setBytes(1, v); }
  @$pb.TagNumber(3)
  $core.bool hasData() => $_has(1);
  @$pb.TagNumber(3)
  void clearData() => clearField(3);

  @$pb.TagNumber(4)
  $core.String get error => $_getSZ(2);
  @$pb.TagNumber(4)
  set error($core.String v) { $_setString(2, v); }
  @$pb.TagNumber(4)
  $core.bool hasError() => $_has(2);
  @$pb.TagNumber(4)
  void clearError() => clearField(4);
}


const _omitFieldNames = $core.bool.fromEnvironment('protobuf.omit_field_names');
const _omitMessageNames = $core.bool.fromEnvironment('protobuf.omit_message_names');
