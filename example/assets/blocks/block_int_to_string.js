"use strict";
const type = 'int_to_string';
Blockly.defineBlocksWithJsonArray([
    {
        "type": type,
        "message0": "Text from number %1",
        "args0": [
            {
                "type": "input_value",
                "name": "number",
                "check": "Number"
            }
        ],
        "output": "String",
        "colour": 230,
        "tooltip": "Convert a number to text",
        "helpUrl": ""
    }
]);
javascript.javascriptGenerator.forBlock[type] = function (block) {
    var value_number = Blockly.JavaScript.valueToCode(block, 'number', Blockly.JavaScript.ORDER_ATOMIC);
    return ['String(' + value_number + ')', Blockly.JavaScript.ORDER_FUNCTION_CALL];
};
dart.dartGenerator.forBlock[type] = function (block) {
    var value_number = Blockly.Dart.valueToCode(block, 'number', Blockly.Dart.ORDER_ATOMIC);
    return [`"${value_number}"`, Blockly.Dart.ORDER_ATOMIC];
};
lua.luaGenerator.forBlock[type] = function (block) {
    var value_number = Blockly.Lua.valueToCode(block, 'number', Blockly.Lua.ORDER_ATOMIC);
    return ['tostring(' + value_number + ')', Blockly.Lua.ORDER_FUNCTION_CALL];
};
php.phpGenerator.forBlock[type] = function (block) {
    var value_number = Blockly.PHP.valueToCode(block, 'number', Blockly.PHP.ORDER_ATOMIC);
    return ['strval(' + value_number + ')', Blockly.PHP.ORDER_FUNCTION_CALL];
};
python.pythonGenerator.forBlock[type] = function (block) {
    var value_number = Blockly.Python.valueToCode(block, 'number', Blockly.Python.ORDER_ATOMIC);
    return ['str(' + value_number + ')', Blockly.Python.ORDER_FUNCTION_CALL];
};
