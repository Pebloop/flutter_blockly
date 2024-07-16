class BlocklyToolboxBlocksData {
  final int x;
  final int y;
  final int width;
  final int height;
  final String type;
  final String id;

  BlocklyToolboxBlocksData({
    this.x = 0,
    this.y = 0,
    this.width = 0,
    this.height = 0,
    this.type = '',
    this.id = '',
  });

  Map<String, dynamic> toJson() {
    return {
      'x': x,
      'y': y,
      'width': width,
      'height': height,
      'type': type,
      'id': id,
    };
  }

  factory BlocklyToolboxBlocksData.fromJson(Map<String, dynamic> data) {
    return BlocklyToolboxBlocksData(
      x: data['x'] ?? 0,
      y: data['y'] ?? 0,
      width: data['width'] ?? 0,
      height: data['height'] ?? 0,
      type: data['type'] ?? '',
      id: data['id'] ?? '',
    );
  }
}

class BlocklyToolboxData {
  final List<BlocklyToolboxBlocksData>? blocks;
  final int width;
  final int height;

  BlocklyToolboxData({
    this.blocks,
    this.width = 0,
    this.height = 0,
  });

  Map<String, dynamic> toJson() {
    return {
      'blocks': blocks,
      'width': width,
      'height': height,
    };
  }

  factory BlocklyToolboxData.fromJson(Map<String, dynamic> data) {
    print(data);
    return BlocklyToolboxData(
      blocks: data['toolbox']['blocks'] != null ? (data['toolbox']['blocks'] as List).map((e) => BlocklyToolboxBlocksData.fromJson(e)).toList() : null,
      width: data['toolbox']['width'] ?? 0,
      height: data['toolbox']['height'] ?? 0,
    );
  }
}