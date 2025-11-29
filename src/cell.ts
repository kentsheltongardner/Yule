import Color    from './color.js'
import Dir      from './dir.js'

export default class Cell {
    static Empty            = 0
    static Wall             = 1
    static Tunnel           = 2
    static Box              = 3
    static Present          = 4
    static Magic            = 5
    static Laser            = 6

    static Continuous = [
        false, 
        true,
        false,
        true,
        false, 
        true,
        false,
    ]

    public open = false
    public flag = false
    
    constructor(
        public type: number = Cell.Empty, 
        public color: number = Color.Black, 
        public connections: number = 0, 
        public axis: number = Dir.Horizontal,
        public direction: number = Dir.East,
    ) {}
}