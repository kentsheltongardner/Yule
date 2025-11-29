import Vec2 from './vec2.js'

export default class Dir {
    static East         = 0
    static South        = 1
    static West         = 2
    static North        = 3
    static None         = -1

    static First        = Dir.East
    static Last         = Dir.North

    static Parallel     = 0
    static Orthogonal   = 1
    static AntiParallel = 2

    static Horizontal   = 0
    static Vertical     = 1

    static Axis(dir: number) {
        return dir & 1
    }

    static Relationship(dir1: number, dir2: number) {
        const diff = (dir2 - dir1) & 3
        if ((diff & 1) === 0) return diff
        return Dir.Orthogonal
    }

    static Dirs = [
        Dir.East,
        Dir.South,
        Dir.West,
        Dir.North,
    ]

    static BitEast    = 1 << Dir.East
    static BitSouth   = 1 << Dir.South
    static BitWest    = 1 << Dir.West
    static BitNorth   = 1 << Dir.North

    static ToBit = [
        Dir.BitEast, 
        Dir.BitSouth, 
        Dir.BitWest, 
        Dir.BitNorth
    ]

    static ToOppositeBit = [
        Dir.BitWest, 
        Dir.BitNorth, 
        Dir.BitEast, 
        Dir.BitSouth
    ]

    static Vec2East     = new Vec2(1, 0)
    static Vec2South    = new Vec2(0, 1)
    static Vec2West     = new Vec2(-1, 0)
    static Vec2North    = new Vec2(0, -1)

    static ToClockwiseVec2 = [
        Dir.Vec2South,
        Dir.Vec2West,
        Dir.Vec2North,
        Dir.Vec2East,
    ]
    static ToCounterClockwiseVec2 = [
        Dir.Vec2North,
        Dir.Vec2East,
        Dir.Vec2South,
        Dir.Vec2West,
    ]

    static ToVec2 = [
        Dir.Vec2East,
        Dir.Vec2South,
        Dir.Vec2West,
        Dir.Vec2North,
    ]
 
    static FromVec2(vec2: Vec2) {
        if (vec2.dx === 0) {
            if (vec2.dy === 1)  return Dir.South
            if (vec2.dy === -1) return Dir.North
        }
        if (vec2.dy === 0) {
            if (vec2.dx === 1)  return Dir.East
            if (vec2.dx === -1) return Dir.West
        }
        return Dir.None
    }

    static FromKey = new Map<string, number>([
        ['ArrowUp',     Dir.North],
        ['ArrowDown',   Dir.South],
        ['ArrowLeft',   Dir.West],
        ['ArrowRight',  Dir.East],
    ])

    static AxisFromChar = new Map<string, number>([
        ['|', Dir.Vertical],
        ['-', Dir.Horizontal],
    ])
}