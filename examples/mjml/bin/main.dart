import 'dart:io';
import 'package:globe_runtime/globe_runtime.dart';
import 'package:mjml_bridge/mjml_bridge.dart';

const mjml = r'''
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>
              Hello World!
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  ''';

void main() async {
  print('Rendering MJML...');

  final result = await render(mjml);
  print(result.html);

  GlobeRuntime.instance.dispose();
  exit(0);
}
