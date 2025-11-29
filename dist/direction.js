import Vec2 from './vec2.js';
export var Dir;
(function (Dir) {
    Dir[Dir["East"] = 0] = "East";
    Dir[Dir["South"] = 1] = "South";
    Dir[Dir["West"] = 2] = "West";
    Dir[Dir["North"] = 3] = "North";
})(Dir || (Dir = {}));
export const DirToVec2 = new Map([
    [Dir.East, new Vec2(1, 0)],
    [Dir.South, new Vec2(0, 1)],
    [Dir.West, new Vec2(-1, 0)],
    [Dir.North, new Vec2(0, -1)],
]);
export const KeyToDir = new Map([
    ['ArrowUp', Dir.North],
    ['ArrowDown', Dir.South],
    ['ArrowLeft', Dir.West],
    ['ArrowRight', Dir.East],
]);
//# sourceMappingURL=direction.js.map