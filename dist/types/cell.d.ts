export default class Cell {
    type: number;
    color: number;
    connections: number;
    axis: number;
    direction: number;
    static Empty: number;
    static Wall: number;
    static Tunnel: number;
    static Box: number;
    static Present: number;
    static Magic: number;
    static Laser: number;
    static Continuous: boolean[];
    open: boolean;
    flag: boolean;
    constructor(type?: number, color?: number, connections?: number, axis?: number, direction?: number);
}
//# sourceMappingURL=cell.d.ts.map