// GENERATED FILE — DO NOT MODIFY BY HAND
// This file was generated from @globe/dart_source_generator
// ignore_for_file: unused_import

import 'dart:async';
import 'dart:convert';
import 'package:globe_runtime/globe_runtime.dart';

/// Package version
const packageVersion = '1.0.0';

/// Package source code
const packageSource = r'''
globalThis.Dart??={},globalThis.JsonPayload??={};const e=()=>function(e){return e},t=e,n=e;t(),t(),t();const r=t();t(),t();const i=t();t(),t();const a=n();n(),n(),n(),n(),n(),n(),n(),n();var o=e()({init(e,t){return{apiUrl:e,timeout:t??5e3}},functions:{streamAllUsers:a(async(e,t)=>{try{let n=`${e.apiUrl}/users`,r=await fetch(n);if(!r.body){Dart.send_error(t,`Response body is null`);return}for await(let e of r.body.values())Dart.stream_value(t,e);Dart.stream_value_end(t)}catch(e){Dart.send_error(t,`Streaming users failed: ${e.message}`)}}),getUserData:i(async(e,t,n)=>{try{let r=`${e.apiUrl}/users/${t}`,i=await(await fetch(r)).json(),a=JsonPayload.encode(i);if(!a){Dart.send_error(n,`Failed to encode response`);return}Dart.send_value(n,a)}catch(e){Dart.send_error(n,`Fetching user data with userId (${t}) failed: ${e.message}`)}}),calculateSum:r((e,t,n,r)=>{try{let e=t+n;Dart.send_value(r,JsonPayload.encode(e))}catch(e){Dart.send_error(r,`Calculating sum of ${t} and ${n} failed: ${e.message}`)}})}});export{o as default};
''';

/// {@template JsToDartDocs}
/// JsToDartDocs class
/// {@endtemplate}
class JsToDartDocs {
  /// {@macro JsToDartDocs}
  JsToDartDocs._(this._module);

  /// Module instance
  final Module _module;

  /// Initialize the SDK with authentication credentials
  ///
  /// This sets up the SDK with your API key and configures the timeout for all
  /// network requests.
  ///
  /// **Parameters:**
  /// * [apiUrl]: Your API url to fetch data from
  /// * [timeout]: Request timeout in milliseconds
  static Future<JsToDartDocs> create({String? apiUrl, num? timeout}) async {
    const module = InlinedModule(
      name: 'JsToDartDocs',
      sourceCode: packageSource,
    );

    await module.register(args: [apiUrl?.toFFIType, timeout?.toFFIType]);
    return JsToDartDocs._(module);
  }

  /// Disposes of the runtime instance
  void dispose() {
    GlobeRuntime.instance.dispose();
  }

  /// Stream all users from the API
  ///
  /// **Returns:** `A list of users encoded as a JSON string`
  Stream<String> streamAllUsers() {
    final controller = StreamController<String>();

    _module.callFunction(
      'streamAllUsers',
      args: [],
      onData: (data) {
        if (data.hasError()) {
          controller.addError(data.error);
          return true;
        }

        if (data.hasData()) {
          final value = data.data;
          controller.add(utf8.decode(value));
        }

        if (data.done) {
          controller.close();
          return true;
        }

        return false; // Keep listening for more data
      },
    );

    return controller.stream;
  }

  /// Fetches user data from the API
  ///
  /// This function retrieves user information based on the provided user ID. It
  /// handles authentication automatically using the configured API key.
  ///
  /// **Parameters:**
  /// * [userId]: The unique identifier for the user
  ///
  /// **Returns:** `A JSON string containing the user's profile information`
  Future<Map<dynamic, dynamic>> getUserData(num userId) async {
    final completer = Completer<Map<dynamic, dynamic>>();

    _module.callFunction(
      'getUserData',
      args: [userId.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          final value = data.data.unpack();
          completer.complete(value as Map<dynamic, dynamic>);
        }
        return true;
      },
    );

    return completer.future;
  }

  /// Calculates the sum of two numbers
  ///
  /// **Parameters:**
  /// * [a]: First number
  /// * [b]: Second number
  ///
  /// **Returns:** `The sum of a and b`
  Future<num> calculateSum(num a, num b) async {
    final completer = Completer<num>();

    _module.callFunction(
      'calculateSum',
      args: [a.toFFIType, b.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          final value = data.data.unpack();
          completer.complete(value as num);
        }
        return true;
      },
    );

    return completer.future;
  }
}
