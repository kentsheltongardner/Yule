export default class Player {
    grabbing = false
    dead = false
    constructor(public x: number, public y: number, public dir: number) {}

    grab() {
        this.grabbing = true
    }

    release() {
        this.grabbing = false
    }
}