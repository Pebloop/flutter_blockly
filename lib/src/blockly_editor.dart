import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_blockly_plus/src/types/blockly_toolbox_data.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'html/html.dart' as html;
import 'types/types.dart';

/// The Flutter Blockly visual programming editor
class BlocklyEditor {
  /// ## Example
  /// ```dart
  /// late final BlocklyEditor editor;
  ///
  /// @override
  /// void initState() {
  ///   super.initState();
  ///   editor = BlocklyEditor(
  ///     workspaceConfiguration: widget.workspaceConfiguration,
  ///     initial: widget.initial,
  ///     onError: widget.onError,
  ///     onInject: widget.onInject,
  ///     onChange: widget.onChange,
  ///     onDispose: widget.onDispose,
  ///   );
  /// }
  /// ```
  BlocklyEditor({
    this.workspaceConfiguration,
    this.initial,
    this.onError,
    this.onInject,
    this.onChange,
    this.onDispose,
    this.addons,
    this.debug = false,
  });

  /// [BlocklyOptions interface](https://developers.google.com/blockly/reference/js/blockly.blocklyoptions_interface)
  final BlocklyOptions? workspaceConfiguration;

  /// Initial state of Blockly editor (xml string or json)
  final dynamic initial;

  /// It is called on any error
  /// ## Example
  /// ```dart
  /// void onError(dynamic error) {}
  /// ```
  final Function? onError;

  /// It is called on inject editor
  /// ## Example
  /// ```dart
  /// void onInject(BlocklyData data) {}
  /// ```
  final Function? onInject;

  /// It is called on change editor sate
  /// ## Example
  /// ```dart
  /// void onChange(BlocklyData data) {}
  /// ```
  final Function? onChange;

  /// It is called on dispose editor
  /// ## Example
  /// ```dart
  /// void onDispose(BlocklyData data) {}
  /// ```
  final Function? onDispose;

  /// All the custom extensions to add
  final List<String>? addons;

  /// Is blockly launched in debug mode ?
  final bool debug;

  /// The WebViewController used for the WebViewWidget
  /// ## Example
  /// ```dart
  /// editor.blocklyController;
  /// ```
  final WebViewController blocklyController = WebViewController();

  /// Create a default Blockly state
  BlocklyState _state = const BlocklyState();

  /// Toolbox data, for debugging purposes
  BlocklyToolboxData _toolbox = BlocklyToolboxData();

  /// The Blockly toolbox
  ToolboxInfo? _toolboxConfig;

  bool _readOnly = false;

  /// code
  BlocklyCode _code = const BlocklyCode();

  /// ## Example
  /// ```dart
  /// editor.blocklyController
  ///   ..setNavigationDelegate(NavigationDelegate(
  ///     onPageFinished: (url) {
  ///       editor.init();
  ///     },
  ///   ));
  /// ```
  void init({BlocklyOptions? workspaceConfiguration, dynamic initial}) {
    if (_toolboxConfig != null || (!Platform.isAndroid && !Platform.isIOS)) {
      return;
    }

    _init(workspaceConfiguration, initial);

  }

  Future<void> _init(BlocklyOptions? workspaceConfiguration, dynamic initial) async {

    await blocklyController.runJavaScript(
      await rootBundle.loadString('packages/flutter_blockly_plus/assets/blockly.min.js'),
    );
    await blocklyController.runJavaScript(
      await rootBundle.loadString('packages/flutter_blockly_plus/assets/dart_compressed.js'),
    );
    await blocklyController.runJavaScript(
      await rootBundle.loadString('packages/flutter_blockly_plus/assets/javascript_compressed.js'),
    );
    await blocklyController.runJavaScript(
      await rootBundle.loadString('packages/flutter_blockly_plus/assets/lua_compressed.js'),
    );
    await blocklyController.runJavaScript(
      await rootBundle.loadString('packages/flutter_blockly_plus/assets/php_compressed.js'),
    );
    await blocklyController.runJavaScript(
      await rootBundle.loadString('packages/flutter_blockly_plus/assets/python_compressed.js'),
    );
    await blocklyController.runJavaScript(
      await rootBundle.loadString('packages/flutter_blockly_plus/assets/dart_wrapper.js'),
    );


    for (final addon in addons ?? []) {
      await blocklyController.runJavaScript(
        addon,
      );
    }

    _readOnly = workspaceConfiguration?.readOnly ??
        this.workspaceConfiguration?.readOnly ??
        false;
    await postData(
      event: 'init',
      data: {
        'debug': debug,
        'workspaceConfiguration':
        workspaceConfiguration ?? this.workspaceConfiguration,
        'initial': initial ?? this.initial,
      },
    );
  }

  /// ## Example
  /// ```dart
  /// @override
  /// void dispose() {
  ///   super.dispose();
  ///   editor.dispose();
  /// }
  /// ```
  void dispose() {
    if (_toolboxConfig != null) {
      postData(event: 'dispose');
      _onCallback(cb: onDispose, arg: _getData());
      _state = const BlocklyState();
      _toolboxConfig = null;
      _readOnly = false;
    }
  }

  /// It is called on message from the WebViewWidget
  /// ## Example
  /// ```dart
  /// editor.blocklyController
  ///   ..addJavaScriptChannel(
  ///     'FlutterWebView',
  ///     onMessageReceived: editor.onMessage,
  ///   );
  /// ```
  void onMessage(JavaScriptMessage e) {
    try {
      final json = jsonDecode(e.message);
      switch (json['event']) {
        case 'onInject':
          _state = BlocklyState.fromJson(json['data']);
          _onCallback(cb: onInject, arg: _getData());
          break;
        case 'onChange':
          _toolbox = BlocklyToolboxData.fromJson(json['data']);
          _state = BlocklyState.fromJson(json['data']);
          _code = BlocklyCode.fromJson(json['data']);
          _onCallback(cb: onChange, arg: _getData());
          break;
        case 'onError':
          _onCallback(cb: onError, arg: json['data']);
          break;
        case 'toolboxConfig':
          _toolboxConfig = ToolboxInfo.fromJson(json['data']);
          break;
      }
    } catch (err) {
      _onCallback(cb: onError, arg: err);
    }
  }

  /// Update the Blockly editor toolbox
  /// ## Example
  /// ```dart
  /// editor.updateToolboxConfig((prevConfig) {
  ///   return newConfiguration;
  /// });
  /// ```
  void updateToolboxConfig(ToolboxInfo Function(ToolboxInfo) cb) {
    try {
      if (_toolboxConfig != null) {
        ToolboxInfo configuration = cb(_toolboxConfig!);
        if (!_readOnly) {
          postData(event: 'updateToolboxConfig', data: configuration);
        }
      }
    } catch (err) {
      _onCallback(cb: onError, arg: err);
    }
  }

  /// Update the Blockly editor state
  /// ## Example
  /// ```dart
  /// editor.state((prevState) {
  ///   return newStateJson;
  /// });
  /// ```
  void updateState(BlocklyJsonState Function(BlocklyState) cb) {
    try {
      if (_toolboxConfig != null) {
        BlocklyJsonState newState = cb(_state);
        postData(event: 'updateState', data: newState);
      }
    } catch (err) {
      _onCallback(cb: onError, arg: err);
    }
  }

  /// Get the current state
  /// ## Example
  /// ```dart
  /// editor.state();
  /// ```
  BlocklyState state() {
    return _state;
  }

  /// Get the current code
  /// ## Example
  /// ```dart
  /// editor.code();
  /// ```
  BlocklyCode code() {
    return _code;
  }

  /// ## Example
  /// ```dart
  /// editor.blocklyController
  ///   ..loadHtmlString(editor.htmlRender());
  /// ```
  String htmlRender({
    String? style,
  }) {
    return html.htmlRender(
      style: html.htmlStyle(style: style),
    );
  }

  /// Post message to the WebViewWidget
  /// ## Example
  /// ```dart
  /// editor.postData(event: 'eval', data: 'alert(editor.state().xml)');
  /// ```
  Future<void> postData({required String event, dynamic data}) async {
    try {
      await blocklyController.runJavaScript(
        "window.message(${jsonEncode({'event': event, 'data': data})})",
      );
    } catch (err) {
      _onCallback(cb: onError, arg: err);
    }
  }

  /// run javascript in WebView
  /// ## Example
  /// ```dart
  /// editor.runJS('alert(editor.state().xml)');
  /// ```
  void runJS(String code) {
    postData(event: 'eval', data: code);
  }

  /// get state and code
  _getData() {
    final data = _state.toJson();
    data?.addAll(_code.toJson() ?? {});
    data?.addAll(_toolbox.toJson() ?? {});
    return BlocklyData.fromJson(data);
  }

  void _onCallback({Function? cb, dynamic arg}) {
    try {
      if (cb != null) {
        cb(arg);
      }
    } catch (err) {
      _onCallback(cb: onError, arg: err);
    }
  }
}
