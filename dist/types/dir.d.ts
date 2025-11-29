import Vec2 from './vec2.js';
export default class Dir {
    static East: number;
    static South: number;
    static West: number;
    static North: number;
    static None: number;
    static First: number;
    static Last: number;
    static Parallel: number;
    static Orthogonal: number;
    static AntiParallel: number;
    static Horizontal: number;
    static Vertical: number;
    static Axis(dir: number): number;
    static Relationship(dir1: number, dir2: number): number;
    static Dirs: number[];
    static BitEast: number;
    static BitSouth: number;
    static BitWest: number;
    static BitNorth: number;
    static ToBit: number[];
    static ToOppositeBit: number[];
    static Vec2East: Vec2;
    static Vec2South: Vec2;
    static Vec2West: Vec2;
    static Vec2North: Vec2;
    static ToClockwiseVec2: Vec2[];
    static ToCounterClockwiseVec2: Vec2[];
    static ToVec2: Vec2[];
    static FromVec2(vec2: Vec2): number;
    static FromKey: Map<string, number>;
    static AxisFromChar: Map<string, number>;
}
//# sourceMappingURL=dir.d.ts.map