//
//  Generated code. Do not modify.
//  source: dart_runtime_entry.proto
//
// @dart = 2.12

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_final_fields
// ignore_for_file: unnecessary_import, unnecessary_this, unused_import

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import 'dart_runtime_entry.pb.dart' as $0;
import 'dart_runtime_entry.pbjson.dart';

export 'dart_runtime_entry.pb.dart';

abstract class DartJSServiceBase extends $pb.GeneratedService {
  $async.Future<$0.RpcResponse> sendValue($pb.ServerContext ctx, $0.SendValueRequest request);

  $pb.GeneratedMessage createRequest($core.String methodName) {
    switch (methodName) {
      case 'SendValue': return $0.SendValueRequest();
      default: throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $async.Future<$pb.GeneratedMessage> handleCall($pb.ServerContext ctx, $core.String methodName, $pb.GeneratedMessage request) {
    switch (methodName) {
      case 'SendValue': return this.sendValue(ctx, request as $0.SendValueRequest);
      default: throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $core.Map<$core.String, $core.dynamic> get $json => DartJSServiceBase$json;
  $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>> get $messageJson => DartJSServiceBase$messageJson;
}

