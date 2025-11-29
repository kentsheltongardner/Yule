export default class Player {
    x;
    y;
    dir;
    grabbing = false;
    dead = false;
    constructor(x, y, dir) {
        this.x = x;
        this.y = y;
        this.dir = dir;
    }
    grab() {
        this.grabbing = true;
    }
    release() {
        this.grabbing = false;
    }
}
//# sourceMappingURL=player.js.map