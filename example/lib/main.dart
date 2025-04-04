import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_blockly_plus/flutter_blockly_plus.dart';

import 'content.dart';

void main() {
  runApp(
    const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: WebViewApp(),
    ),
  );
}

class WebViewApp extends StatefulWidget {
  const WebViewApp({super.key});

  @override
  State<WebViewApp> createState() => _WebViewAppState();
}

class _WebViewAppState extends State<WebViewApp> {
  // final BlocklyOptions workspaceConfiguration = BlocklyOptions(
  //   grid: const GridOptions(
  //     spacing: 20,
  //     length: 3,
  //     colour: '#ccc',
  //     snap: true,
  //   ),
  //   toolbox: ToolboxInfo.fromJson(initialToolboxJson),
  // );

  final BlocklyOptions workspaceConfiguration = BlocklyOptions.fromJson(const {
    'grid': {
      'spacing': 20,
      'length': 3,
      'colour': '#ccc',
      'snap': true,
    },
    'toolbox': initialToolboxJson,
    // null safety example
    'collapse': null,
    'comments': null,
    'css': null,
    'disable': null,
    'horizontalLayout': null,
    'maxBlocks': null,
    'maxInstances': null,
    'media': null,
    'modalInputs': null,
    'move': null,
    'oneBasedIndex': null,
    'readOnly': null,
    'renderer': null,
    'rendererOverrides': null,
    'rtl': null,
    'scrollbars': null,
    'sounds': null,
    'theme': null,
    'toolboxPosition': null,
    'trashcan': null,
    'maxTrashcanContents': null,
    'plugins': null,
    'zoom': null,
    'parentWorkspace': null,
  });

  void onInject(BlocklyData data) {

  }

  void onChange(BlocklyData data) {
    print("test" + data.toolbox.toString());
  }

  void onDispose(BlocklyData data) {
  }

  void onError(dynamic err) {
    debugPrint('onError: $err');
  }

  Future<List<String>> loadAddons() async {
    List<String> addons = [];

    addons.add(await rootBundle.loadString("assets/blocks/block_int_to_string.js"));
    return addons;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: FutureBuilder(
          future: loadAddons(),
          builder: (context, snapshot) {
            if (snapshot.hasData) {
              return BlocklyEditorWidget(
                workspaceConfiguration: workspaceConfiguration,
                initial: initialXml,
                onInject: onInject,
                onChange: onChange,
                onDispose: onDispose,
                onError: onError,
                addons: snapshot.data,
                debug: false
              );
            } else {
              return Center(
                child: CircularProgressIndicator(),
              );
            }
          },
        ),
      )
    );

  }
}
