const onCallback = (event, data) => {
  if (window.FlutterWebView) {
    const dataString = JSON.stringify({event, data});
    window.FlutterWebView.postMessage(dataString);
  }
};

const importFromXml = (xml, workspace) => {
  try {
    if (workspace.getAllBlocks(false).length > 0) return;
    Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xml), workspace);
    return true;
  } catch (err) {
    onCallback('onError', err?.toString());
    return false;
  }
};

const importFromJson = (json, workspace) => {
  try {
    Blockly.serialization.workspaces.load(json, workspace);
    return true;
  } catch (err) {
    onCallback('onError', err?.toString());
    return false;
  }
};

function nullToUndefined(data, defaultData) {
  if (data === null || typeof data === 'undefined') {
    return defaultData;
  } else if (Array.isArray(data)) {
    return data.map(item => nullToUndefined(item, defaultData?.[0]));
  } else if (typeof data === 'object') {
    const tempObj = {};
    for (let key in data) {
      tempObj[key] = nullToUndefined(data[key], defaultData?.[key]);
    }
    return tempObj;
  } else {
    return data;
  }
}

const BlocklyEditor = () => {
  let _workspace = null;
  let _toolboxConfig = null;
  let _state = BlocklyState();
  let _readOnly = false;
  let _debugMode = false
  let _code = {
    dart: '',
    js: '',
    lua: '',
    php: '',
    python: '',
  };
  let _toolbox = {
    blocks: [],
    width: 0,
    height: 0,
  };

  function init(params) {
    const element = document.querySelector('#blocklyEditor');
    if (!Blockly || !element || _toolboxConfig) {
      return;
    }

    if (params?.debug) {
      _debugMode = true;
    }

    const workspace = Blockly.inject(
      element,
      nullToUndefined(params?.workspaceConfiguration),
    );

    if (workspace) {
      document.querySelector('.wrapper')?.classList.add('wrapper-active');
      _workspace = workspace;
      _toolboxConfig = params?.workspaceConfiguration?.toolbox || {contents: []};
      _readOnly = !!params?.workspaceConfiguration?.readOnly;
      onCallback('toolboxConfig', _toolboxConfig);
      onCallback('onInject', _getData());
      _setState(params?.initial);
      _workspace.addChangeListener(listener);
    }
  }

  function dispose() {
    if (_workspace) {
      document.querySelector('.wrapper')?.classList.remove('wrapper-active');
      _workspace.removeChangeListener(listener);
      _workspace.dispose();
      _workspace = null;
      _toolboxConfig = null;
      _state = BlocklyState();
      _readOnly = false;
    }
  }

  function listener(event) {
    if (_debugMode) {
      _debug(event);
    }
    if (_workspace) {
      _saveData();
    }
  }

  let clickStatus = "none";
  let listenerAdded = false;

  function refreshToolboxTags() {
    const blockContainer = document.querySelectorAll('.blocklyBlockCanvas')[1];
    //console.log(blockContainer);

    // add tags on the toolbox items
    var xforms = blockContainer.getAttribute('transform');
    var containerX = xforms.split('(')[1].split(',')[0];
    var containerY = xforms.split(',')[1].split(')')[0];
    const rectMap = _workspace.toolbox_.flyout_.rectMap_;
    const toolboxWidth = Math.round(_workspace.toolbox_.width_);
    const toolboxHeight = Math.round(_workspace.toolbox_.height_);
    _workspace.toolbox_.flyout_.contents.forEach((item) => {

      const dom = rectMap.get(item.block);
      const elem = document.createElement('p'); // display block type
      elem.style.zIndex = 100;
      elem.style.position = 'absolute';
      elem.textContent = item.block.type;
      elem.style.fontSize = '3px';
      elem.style.pointerEvents = 'none';
      elem.classList.add('debug-tag');
      document.body.appendChild(elem);

      const elem2 = document.createElement('p'); // display block id
      elem2.style.zIndex = 100;
      elem2.style.position = 'absolute';
      elem2.textContent = item.block.id;
      elem2.style.fontSize = '3px';
      elem2.style.pointerEvents = 'none';
      elem2.classList.add('debug-tag');
      document.body.appendChild(elem2);

      const position = item.block.translation.split('(')[1].split(')')[0];
      var x = position.split(',')[0].trim();
      var y = position.split(',')[1].trim();

      if (_workspace.horizontalLayout) {
        const fullHeight = toolboxHeight + Number(y);
        elem.style.left = (x + Number(containerX)) + 'px'; // add the container x position
        elem.style.top = fullHeight + 'px';
        elem2.style.left = (Number(x) + Number(containerX)) + 'px';
        elem2.style.top = fullHeight + 'px';
      } else {
        const fullWidth = toolboxWidth + Number(x);
        elem.style.left = fullWidth + 'px';
        elem.style.top = (Number(y) + Number(containerY)) + 'px'; // add the container y position
        elem2.style.left = fullWidth + 'px';
        elem2.style.top = (Number(y) + Number(containerY)) + 'px';
      }
    });

    // add scrollbar tags
    const scrollbar = document.querySelectorAll('.blocklyScrollbarHandle');
    const rectScrollbar = scrollbar[2].getBoundingClientRect();
    const scrolledElement = scrollbar[2];
    const svg = document.querySelectorAll('svg')[3];

    if (!listenerAdded) {
      listenerAdded = true;
      scrolledElement.addEventListener('pointerdown', () => {
        // check transform to update the position of the tags
        clickStatus = "down";
      });
      scrolledElement.addEventListener('pointermove', () => {
        if (clickStatus == "down") {
          removeAllDebugTags();
          refreshToolboxTags();
        }
      });
      scrolledElement.addEventListener('pointerup', () => {
        clickStatus = "none";
      });
      scrolledElement.addEventListener('pointercancel', () => {
        clickStatus = "none";
      });
      scrolledElement.addEventListener('pointerleave', () => {
        clickStatus = "none";
      });
      scrolledElement.parentElement.addEventListener('click', () => {
        removeAllDebugTags();
        refreshToolboxTags();
      });
    }
    for (let i = 0; i < 10; i++) {
      const elem = document.createElement('p');
      elem.style.zIndex = 100;
      elem.style.position = 'absolute';
      elem.textContent = "scroll-" + i;
      elem.style.fontSize = '10px';
      elem.style.pointerEvents = 'none';
      elem.classList.add('debug-tag');
      document.body.appendChild(elem);
      if (_workspace.horizontalLayout) {
        const w = (toolboxWidth / 10) * i;
        const h = rectScrollbar.top - 10;
        elem.style.left = w + 'px';
        elem.style.top = h + 'px';
      } else {
        const h = (toolboxHeight / 10) * i;
        const w = rectScrollbar.left - 10;
        elem.style.left = w + 'px';
        elem.style.top = h + 'px';
      }
    }
  }

  function refreshWorkspaceTags() {
    const toolboxWidth = Math.round(_workspace.toolbox_.width_);
    const toolboxHeight = Math.round(_workspace.toolbox_.height_);
    const blocks = _workspace.blockDB;
    blocks.forEach((block) => {
      const elem = document.createElement('p'); // display block type
      elem.style.zIndex = 100;
      elem.style.position = 'absolute';
      elem.textContent = block.type;
      elem.style.fontSize = '3px';
      elem.style.pointerEvents = 'none';
      elem.classList.add('debug-tag');
      document.body.appendChild(elem);

      const elem2 = document.createElement('p'); // display block id
      elem2.style.zIndex = 100;
      elem2.style.position = 'absolute';
      elem2.textContent = block.id;
      elem2.style.fontSize = '3px';
      elem2.style.pointerEvents = 'none';
      elem2.classList.add('debug-tag');
      document.body.appendChild(elem2);

      const position = block.relativeCoords;

      if (_workspace.horizontalLayout) {
        const fullHeight = toolboxHeight + position.y;
        elem.style.left = position.x + 'px';
        elem.style.top = fullHeight + 'px';
        elem2.style.left = position.x + 'px';
        elem2.style.top = fullHeight + 'px';
      } else {
        const fullWidth = toolboxWidth + position.x;
        elem.style.left = fullWidth + 'px';
        elem.style.top = position.y + 'px';
        elem2.style.left = fullWidth + 'px';
        elem2.style.top = position.y + 'px';
      }
    });
  }

  function removeAllDebugTags() {
    const oldTags = document.querySelectorAll('.debug-tag');
    oldTags.forEach((tag) => tag.remove());
  }

  function _debug(event) {
    removeAllDebugTags();
    if (event.type == Blockly.Events.TOOLBOX_ITEM_SELECT) {
      if (event.newItem != undefined) {
        refreshToolboxTags();
      }
    }
    refreshWorkspaceTags()
  }

  function updateToolboxConfig(configuration) {
    try {
      if (
      configuration &&
      _workspace &&
      !_readOnly
      ) {
        _toolboxConfig = configuration;
        _workspace.updateToolbox(configuration);
        onCallback('toolboxConfig', _toolboxConfig);
      }
    } catch (err) {
      onCallback('onError', err?.toString());
    }
  }

  function updateState(newState) {
    try {
      if (newState) {
        _setState(newState);
      }
    } catch(err) {
      onCallback('onError', err?.toString());
    }
  }

  function state() {
    return _state;
  }

  function code() {
    return _code;
  }

  function BlocklyState({xml, json} = {}) {
    return {
      xml: xml || '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
      json: json || {},
    };
  }

  function _setState(newState) {
    if (_workspace) {
      if (typeof newState === 'string') {
        importFromXml(newState, _workspace);
      } else if (newState && typeof newState === 'object') {
        importFromJson(newState, _workspace);
      }
      _saveData();
    }
  }

  function _saveData() {
    try {
      if (_workspace) {
        const newXml = Blockly.Xml.domToText(
          Blockly.Xml.workspaceToDom(_workspace),
        );
        //if (newXml !== _state.xml) {
        _state = BlocklyState({
          xml: newXml,
          json: Blockly.serialization.workspaces.save(_workspace),
        });
        _saveCode()
        onCallback('onChange', _getData());
        return true;
        //}
      }
      return false;
    } catch (err) {
      onCallback('onError', err?.toString());
      return false;
    }
  }

  function _saveCode() {
    if (_workspace) {
      if(window.dart) _code.dart = dart.dartGenerator?.workspaceToCode(_workspace);
      if(window.javascript) _code.js = javascript.javascriptGenerator?.workspaceToCode(_workspace);
      if(window.lua) _code.lua = lua.luaGenerator?.workspaceToCode(_workspace);
      if(window.php) _code.php = php.phpGenerator?.workspaceToCode(_workspace);
      if(window.python) _code.python = python.pythonGenerator?.workspaceToCode(_workspace);
    }
  }

  function _getData() {

    // get data that can be usefull for testing purposes
    const toolboxWidth = Math.round(_workspace.toolbox_.width_);
    const toolboxHeight = Math.round(_workspace.toolbox_.height_);
    _toolbox.blocks =  _workspace.toolbox_.flyout_.contents.map((item) => {

      const width = Math.round(item.block.width);
      const height = Math.round(item.block.height);
      const position = item.block.translation.split('(')[1].split(')')[0];
      var x = position.split(',')[0].trim();
      var y = position.split(',')[1].trim();

      return {
        x: Math.round(Number(x)),
        y: Math.round(Number(y)),
        type: item.block.type,
        height: height,
        width: width,
        id: item.block.id,
      };
    });
    _toolbox.width = toolboxWidth;
    _toolbox.height = toolboxHeight;

    return {
      toolbox: _toolbox,
      ..._state,
      ..._code,
    };
  }

  return {
    workspace: _workspace,
    init,
    dispose,
    state,
    code,
    updateToolboxConfig,
    updateState,
  };
};

const editor = BlocklyEditor();

const events = {
  eval: function (data) {
    try {
      eval(data);
    } catch (err) {
      onCallback('onError', err?.toString());
    }
  },
};

function handleEvent(params) {
  try {
    const {event, data} = typeof params === 'string' ? JSON.parse(params) : params;
    if (editor[event]) {
      editor[event](data);
    } else if (events[event]) {
      events[event](data);
    }
  } catch (err) {
    onCallback('onError', err?.toString());
  }
}

window.message = handleEvent;