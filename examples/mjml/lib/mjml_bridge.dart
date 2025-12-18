import 'dart:async';

import 'package:globe_runtime/globe_runtime.dart';
import 'package:mjml_bridge/mjml_bridge_source.dart';

const _module = InlinedModule(name: 'mjml_bridge', sourceCode: packageSource);

final class MjmlBridge {
  MjmlBridge._();

  static Future<MjmlBridge> init() async {
    await _module.register();
    return MjmlBridge._();
  }

  Future<MJMLResult> render(String mjml, {MJMLOptions? options}) async {
    final completer = Completer<MJMLResult>();

    await _module.register();

    _module.callFunction(
      'render',
      args: [
        mjml.toFFIType,
        (options?.toJson() ?? {}).toFFIType,
      ],
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          final json = data.data.unpack();
          completer.complete(MJMLResult.fromJson(json));
        }
        return true;
      },
    );
    return completer.future;
  }
}

class MJMLOptions {
  final bool? keepComments;
  final bool? socialIconPath;
  final String? fonts;
  final String? validationLevel;

  const MJMLOptions({
    this.keepComments,
    this.socialIconPath,
    this.fonts,
    this.validationLevel,
  });

  Map<String, dynamic> toJson() {
    return {
      if (keepComments != null) 'keepComments': keepComments,
      if (socialIconPath != null) 'socialIconPath': socialIconPath,
      if (fonts != null) 'fonts': fonts,
      if (validationLevel != null) 'validationLevel': validationLevel,
    };
  }
}

class MJMLResult {
  final String html;
  final List<dynamic> errors;

  const MJMLResult({required this.html, required this.errors});

  factory MJMLResult.fromJson(Map<dynamic, dynamic> json) {
    return MJMLResult(
      html: json['html'] ?? '',
      errors: json['errors'] ?? [],
    );
  }
}
