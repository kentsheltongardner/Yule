import Color from './color.js';
import Dir from './dir.js';
export default class Cell {
    type;
    color;
    connections;
    axis;
    direction;
    static Empty = 0;
    static Wall = 1;
    static Tunnel = 2;
    static Box = 3;
    static Present = 4;
    static Magic = 5;
    static Laser = 6;
    static Continuous = [
        false,
        true,
        false,
        true,
        false,
        true,
        false,
    ];
    open = false;
    flag = false;
    constructor(type = Cell.Empty, color = Color.Black, connections = 0, axis = Dir.Horizontal, direction = Dir.East) {
        this.type = type;
        this.color = color;
        this.connections = connections;
        this.axis = axis;
        this.direction = direction;
    }
}
//# sourceMappingURL=cell.js.map