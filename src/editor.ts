import Game from './game.js'
import Point from './point.js'
import Cell from './cell.js'
import Dir from './dir.js'
import Vec2 from './vec2.js'

export default class Editor {
    srcPoint: Point
    dstPoint: Point
    building: boolean
    connecting: boolean

    constructor(public srcGame: Game, public dstGame: Game) {
        this.srcPoint = new Point(0, 0)
        this.dstPoint = new Point(0, 0)
        this.building = false
        this.connecting = false
    }

    isEditMode() {
        return this.srcGame.canvas.style.display === 'block'
    }

    srcMouseDown(event: MouseEvent) {
        if (this.isEditMode()) {
            const point = this.pointAt(this.srcGame, event.offsetX, event.offsetY)
            if (this.srcGame.inBounds(point.x, point.y)) {
                this.srcPoint = point
                this.refresh()
            }
        }
    }

    startBuilding(point: Point) {
        if (!this.dstGame.inBounds(point.x, point.y)) return
        if (this.dstGame.player.x === point.x && this.dstGame.player.y === point.y) return

        this.building = true
        const srcCell = this.srcGame.grid[this.srcPoint.x][this.srcPoint.y]
        
        this.disconnectAt(point)
        this.dstGame.grid[point.x][point.y] = new Cell(srcCell.type, srcCell.color, 0, srcCell.axis, srcCell.direction)
        this.dstGame.render()
    }
    startConnecting() {
        this.connecting = true
    }


    dstMouseDown(event: MouseEvent) {
        if (!this.isEditMode()) return

        const point = this.pointAt(this.dstGame, event.offsetX, event.offsetY)
        if (!this.dstGame.inBounds(point.x, point.y)) return

        const srcPlayer = this.srcGame.player
        if (this.srcPoint.x === srcPlayer.x && this.srcPoint.y === srcPlayer.y) {
            const cell = this.dstGame.grid[point.x][point.y]
            if (cell.type !== Cell.Empty) return

            this.dstGame.player.x = point.x
            this.dstGame.player.y = point.y
            this.dstGame.render()
            return
        }

        this.dstPoint = point

        if (event.button === 0) {
            this.startBuilding(point)
        } else if (event.button === 2) {
            this.startConnecting()
        }
    }

    keepBuilding(point: Point) {
        if (!this.dstGame.inBounds(point.x, point.y)) return
        if (this.dstGame.player.x === point.x && this.dstGame.player.y === point.y) return

        const srcCell = this.srcGame.grid[this.srcPoint.x][this.srcPoint.y]

        if (this.dstPoint.x === point.x && this.dstPoint.y === point.y) return
        
        this.disconnectAt(point)
        this.dstGame.grid[point.x][point.y] = new Cell(srcCell.type, srcCell.color, 0, srcCell.axis, srcCell.direction)
        this.dstGame.render()
    }
    keepConnecting(point: Point) {
        const dx = point.x - this.dstPoint.x
        const dy = point.y - this.dstPoint.y

        if (Math.abs(dx) + Math.abs(dy) !== 1) return

        const prevType = this.dstGame.grid[this.dstPoint.x][this.dstPoint.y].type
        const currType = this.dstGame.grid[point.x][point.y].type

        if (prevType !== currType) return
        if (!Cell.Continuous[prevType]) return

        const dir = Dir.FromVec2(new Vec2(dx, dy))
        this.dstGame.grid[this.dstPoint.x][this.dstPoint.y].connections |= Dir.ToBit[dir]
        this.dstGame.grid[point.x][point.y].connections |= Dir.ToOppositeBit[dir]
        this.dstGame.render()
    }
    dstMouseMove(event: MouseEvent) {
        if (!this.isEditMode()) return

        const point = this.pointAt(this.dstGame, event.offsetX, event.offsetY)
        if (!this.dstGame.inBounds(point.x, point.y)) return
        if (this.dstPoint.x === point.x && this.dstPoint.y === point.y) return

        if (this.building) {
            this.keepBuilding(point)
        }

        if (this.connecting) {
            this.keepConnecting(point)
        }

        this.dstPoint = point
    }

    dstMouseUp(event: MouseEvent) {
        if (event.button === 0) {
            this.building = false
        } else if (event.button === 2) {
            this.connecting = false
        }
    }

    toggleEditMode() {
        this.srcGame.canvas.style.display = this.srcGame.canvas.style.display !== 'block' ? 'block' : 'none'
        this.refresh()
        this.dstGame.refresh()
    }

    pointAt(game: Game, displayX: number, displayY: number) {
        const cellSize      = game.cellSize
        const displayRect   = game.displayRect
        const x             = Math.floor((displayX - displayRect.x) / cellSize)
        const y             = Math.floor((displayY - displayRect.y) / cellSize)
        return new Point(x, y)
    }

    disconnectAt(point: Point) {
        const x = point.x
        const y = point.y

        for (let i = Dir.First; i <= Dir.Last; i++) {
            const bit   = Dir.ToOppositeBit[i]
            const vec2  = Dir.ToVec2[i]
            const x0    = x + vec2.dx
            const y0    = y + vec2.dy
            if (this.dstGame.inBounds(x0, y0)) {
                this.dstGame.grid[x0][y0].connections &= ~bit
            }
        }
    }

    grow(direction: number) {
        if (direction === Dir.East || direction === Dir.West) {
            this.dstGame.size.w++
        }
        if (direction === Dir.South || direction === Dir.North) {
            this.dstGame.size.h++
        }

        switch (direction) {
            case Dir.East:
                const columnEast = new Array(this.dstGame.size.h).fill(0).map(() => new Cell())
                this.dstGame.grid.push(columnEast)
                break
            case Dir.South:
                for (let i = 0; i < this.dstGame.size.w; i++) {
                    this.dstGame.grid[i].push(new Cell())
                }
                break
            case Dir.West:
                const columnWest = new Array(this.dstGame.size.h).fill(0).map(() => new Cell())
                this.dstGame.grid.unshift(columnWest)
                this.dstGame.player.x++
                break
            case Dir.North:
                for (let i = 0; i < this.dstGame.size.w; i++) {
                    this.dstGame.grid[i].unshift(new Cell())
                }
                this.dstGame.player.y++
                break
        }
        this.dstGame.refresh()
    }
    shrink(direction: number) {

        switch (direction) {
            case Dir.East:
                if (this.dstGame.player.x === this.dstGame.size.w - 1) return
                break
            case Dir.South:
                if (this.dstGame.player.y === this.dstGame.size.h - 1) return
                break
            case Dir.West:
                if (this.dstGame.player.x === 0) return
                break
            case Dir.North:
                if (this.dstGame.player.y === 0) return
                break
        }

        if (direction === Dir.East || direction === Dir.West) {
            if (this.dstGame.size.w === 1) return
            this.dstGame.size.w--
        }
        if (direction === Dir.South || direction === Dir.North) {
            if (this.dstGame.size.h === 1) return
            this.dstGame.size.h--
        }

        switch (direction) {
            case Dir.East:
                this.dstGame.grid.pop()
                for (let i = 0; i < this.dstGame.size.h; i++) {
                    this.dstGame.grid[this.dstGame.size.w - 1][i].connections &= ~Dir.BitEast
                }
                break
            case Dir.South:
                for (let i = 0; i < this.dstGame.size.w; i++) {
                    this.dstGame.grid[i].pop()
                    this.dstGame.grid[i][this.dstGame.size.h - 1].connections &= ~Dir.BitSouth
                }
                break
            case Dir.West:
                this.dstGame.player.x--
                this.dstGame.grid.shift()
                for (let i = 0; i < this.dstGame.size.h; i++) {
                    this.dstGame.grid[0][i].connections &= ~Dir.BitWest
                }
                break
            case Dir.North:
                this.dstGame.player.y--
                for (let i = 0; i < this.dstGame.size.w; i++) {
                    this.dstGame.grid[i].shift()
                    this.dstGame.grid[i][0].connections &= ~Dir.BitNorth
                }
                break
        }
        this.dstGame.refresh()
    }





    refresh() {
        this.srcGame.refresh()
        this.render()
    }

    render() {
        this.renderSelection()
    }

    renderSelection() {
        const cellSize                  = this.srcGame.cellSize
        const displayRect               = this.srcGame.displayRect
        const x                         = displayRect.x + this.srcPoint.x * cellSize
        const y                         = displayRect.y + this.srcPoint.y * cellSize
        this.srcGame.ctx.lineWidth      = 4
        this.srcGame.ctx.strokeStyle    = '#92baf6'
        this.srcGame.ctx.strokeRect(x, y, cellSize, cellSize)
    }
}