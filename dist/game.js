import Size from './size.js';
import Cell from './cell.js';
import Dir from './dir.js';
import Player from './player.js';
import Color from './color.js';
import Point from './point.js';
import Rect from './rect.js';
import Vec2 from './vec2.js';
const TAU = 2 * Math.PI;
const TUNNEL_THICKNESS_RATIO = 1 / 8;
const PLAYER_RADIUS_RATIO = 3 / 8;
const PLAYER_LINE_WIDTH_RATIO = 1 / 6;
const CONNECTION_LINE_WIDTH_RATIO = 1 / 16;
const PRESENT_LINE_WIDTH_RATIO = 1 / 6;
const PRESENT_SIDE_THICKNESS_RATIO = 1 / 8;
const SCREW_RADIUS_RATIO = 1 / 16;
const SCREW_OFFSET_RATIO = 1 / 6;
const BOX_OUTER_BORDER_THICKNESS_RATIO = 1 / 8;
const BOX_INNER_BORDER_THICKNESS_RATIO = 1 / 8;
export default class Game {
    grid;
    size;
    player;
    floorColor;
    currentLevel;
    levels;
    canvas;
    ctx;
    cellSize;
    displayRect;
    constructor(levels, canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = 0;
        this.displayRect = new Rect(0, 0, 0, 0);
        this.size = new Size(0, 0);
        this.currentLevel = 0;
        this.levels = levels;
        this.player = new Player(0, 0, Dir.East);
        this.floorColor = Color.Black;
        this.grid = [];
        this.resetLevel();
        this.updateDisplayInfo();
    }
    loadLevelData(json) {
        const levelData = JSON.parse(json);
        this.player = new Player(levelData.player.x, levelData.player.y, levelData.player.dir);
        this.floorColor = levelData.floorColor;
        const w = levelData.grid.length;
        const h = levelData.grid[0].length;
        this.size = new Size(w, h);
        this.grid = new Array(w).fill(0).map(() => new Array(h).fill(0).map(() => new Cell()));
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                const cellData = levelData.grid[i][j];
                const type = cellData.type;
                const color = cellData.color;
                const connections = cellData.connections;
                const axis = cellData.axis;
                const direction = cellData.direction;
                this.grid[i][j] = new Cell(type, color, connections, axis, direction);
            }
        }
    }
    levelData() {
        const levelData = {
            player: this.player,
            floorColor: this.floorColor,
            grid: this.grid,
        };
        return JSON.stringify(levelData);
    }
    grab() {
        this.player.grab();
        const grabVec2 = Dir.ToVec2[this.player.dir];
        const grabX = this.player.x + grabVec2.dx;
        const grabY = this.player.y + grabVec2.dy;
        const cell = this.grid[grabX][grabY];
        if (cell.type === Cell.Present) {
            cell.open = true;
            return true;
        }
        return false;
    }
    release() {
        this.player.release();
    }
    act(moveDir) {
        if (this.player.dead)
            return;
        const moveVec2 = Dir.ToVec2[moveDir];
        const movePoint = new Point(this.player.x + moveVec2.dx, this.player.y + moveVec2.dy);
        if (!this.inBounds(movePoint.x, movePoint.y))
            return;
        if (!this.player.grabbing && this.player.dir !== moveDir) {
            this.player.dir = moveDir;
            return;
        }
        const playerDir = this.player.dir;
        const relationship = Dir.Relationship(moveDir, playerDir);
        const grabVec2 = Dir.ToVec2[playerDir];
        const grabPoint = new Point(this.player.x + grabVec2.dx, this.player.y + grabVec2.dy);
        const playerCell = this.grid[this.player.x][this.player.y];
        const moveCell = this.grid[movePoint.x][movePoint.y];
        const grabCell = this.grid[grabPoint.x][grabPoint.y];
        const grabAxis = Dir.Axis(playerDir);
        const moveAxis = Dir.Axis(moveDir);
        const grabbing = this.player.grabbing
            && grabCell.type !== Cell.Empty
            && !(grabCell.type === Cell.Tunnel && grabAxis === grabCell.axis);
        const inTunnel = playerCell.type === Cell.Tunnel;
        const enteringTunnel = moveCell.type === Cell.Tunnel && moveAxis === moveCell.axis;
        const movePoints = [];
        let move = true;
        let shift = false;
        if (inTunnel) {
            const moveAxis = Dir.Axis(moveDir);
            if (moveAxis !== playerCell.axis) {
                move = false;
            }
            else if (this.player.grabbing && relationship === Dir.Orthogonal) {
                move = false;
            }
            else if (grabbing) {
                if (relationship === Dir.Parallel) {
                    movePoints.push(movePoint);
                }
                else {
                    move = false;
                }
            }
            else if (moveCell.type === Cell.Magic) {
                shift = true;
            }
            else {
                movePoints.push(movePoint);
            }
        }
        else if (enteringTunnel) {
            if (grabbing) {
                movePoints.push(grabPoint);
                if (relationship === Dir.Orthogonal) {
                    movePoints.push(movePoint);
                }
            }
        }
        else {
            movePoints.push(movePoint);
            if (grabbing) {
                movePoints.push(grabPoint);
            }
        }
        if (move) {
            this.attemptMove(movePoints, moveDir);
        }
        if (shift) {
            this.shift();
        }
        this.fireLasers();
    }
    shift() {
        for (let i = 0; i < this.size.w; i++) {
            for (let j = 0; j < this.size.h; j++) {
                const cell = this.grid[i][j];
                const type = cell.type;
                if (type === Cell.Magic || type === Cell.Empty) {
                    cell.connections = 0;
                }
            }
        }
        for (let i = 0; i < this.size.w; i++) {
            for (let j = 0; j < this.size.h; j++) {
                const cell = this.grid[i][j];
                const type = cell.type;
                if (type === Cell.Magic) {
                    cell.type = Cell.Empty;
                }
                else if (type === Cell.Empty) {
                    cell.type = Cell.Magic;
                    if (this.inBounds(i + 1, j)) {
                        const cellEast = this.grid[i + 1][j];
                        if (cellEast.type === Cell.Empty) {
                            cell.connections |= Dir.BitEast;
                            cellEast.connections |= Dir.BitWest;
                        }
                    }
                    if (this.inBounds(i, j + 1)) {
                        const cellSouth = this.grid[i][j + 1];
                        if (cellSouth.type === Cell.Empty) {
                            cell.connections |= Dir.BitSouth;
                            cellSouth.connections |= Dir.BitNorth;
                        }
                    }
                }
            }
        }
        this.floorColor = this.floorColor === Color.White ? Color.Black : Color.White;
    }
    attemptMove(movePoints, moveDir) {
        const moveVec2 = Dir.ToVec2[moveDir];
        const dx = moveVec2.dx;
        const dy = moveVec2.dy;
        let success = true;
        for (const point of movePoints) {
            const x = point.x;
            const y = point.y;
            if (!this.canMove(x, y, dx, dy)) {
                success = false;
            }
        }
        if (success) {
            this.player.x += dx;
            this.player.y += dy;
            for (const point of movePoints) {
                this.move(point.x, point.y, dx, dy);
            }
        }
        else {
            for (const point of movePoints) {
                this.cancelMove(point.x, point.y);
            }
        }
    }
    canMove(x, y, dx, dy) {
        if (!this.inBounds(x, y))
            return false;
        const cell = this.grid[x][y];
        if (cell.flag)
            return true;
        if (cell.type === Cell.Wall)
            return false;
        if (cell.type === Cell.Empty)
            return true;
        cell.flag = true;
        if (!this.canMove(x + dx, y + dy, dx, dy))
            return false;
        for (const dir of Dir.Dirs) {
            const bit = Dir.ToBit[dir];
            const conn = (cell.connections & bit) === bit;
            if (conn) {
                const vec2 = Dir.ToVec2[dir];
                const connX = x + vec2.dx;
                const connY = y + vec2.dy;
                if (!this.canMove(connX, connY, dx, dy))
                    return false;
            }
        }
        return true;
    }
    move(x, y, dx, dy) {
        if (!this.inBounds(x, y))
            return;
        const cell = this.grid[x][y];
        if (!cell.flag)
            return;
        const moveX = x + dx;
        const moveY = y + dy;
        if (this.grid[moveX][moveY].type !== Cell.Empty) {
            this.move(moveX, moveY, dx, dy);
        }
        else {
            this.grid[moveX][moveY] = this.grid[x][y];
            this.grid[x][y] = new Cell(Cell.Empty, this.floorColor, 0, Dir.Horizontal);
            cell.flag = false;
            for (const dir of Dir.Dirs) {
                const vec2 = Dir.ToVec2[dir];
                const connX = x + vec2.dx;
                const connY = y + vec2.dy;
                this.move(connX, connY, dx, dy);
            }
        }
    }
    cancelMove(x, y) {
        if (!this.inBounds(x, y))
            return;
        const cell = this.grid[x][y];
        if (!cell.flag)
            return;
        cell.flag = false;
        this.cancelMove(x + 1, y);
        this.cancelMove(x - 1, y);
        this.cancelMove(x, y + 1);
        this.cancelMove(x, y - 1);
    }
    fireLasers() {
        for (let i = 0; i < this.size.w; i++) {
            for (let j = 0; j < this.size.h; j++) {
                const cell = this.grid[i][j];
                if (cell.type === Cell.Laser) {
                    this.fireLaser(i, j);
                }
            }
        }
    }
    fireLaser(x, y) {
        let laserCell = this.grid[x][y];
        const direction = laserCell.direction;
        const directionVec2 = Dir.ToVec2[direction];
        const dx = directionVec2.dx;
        const dy = directionVec2.dy;
        const laserAxis = Dir.Axis(direction);
        while (true) {
            x += dx;
            y += dy;
            if (!this.inBounds(x, y))
                return;
            let cell = this.grid[x][y];
            const type = cell.type;
            if (type !== Cell.Empty && type !== Cell.Tunnel) {
                return;
            }
            if (type === Cell.Tunnel) {
                if (cell.axis !== laserAxis) {
                    return;
                }
            }
            if (x === this.player.x && y === this.player.y) {
                this.player.dead = true;
                return;
            }
        }
    }
    levelComplete() {
        for (let i = 0; i < this.size.w; i++) {
            for (let j = 0; j < this.size.h; j++) {
                const cell = this.grid[i][j];
                const type = cell.type;
                const open = cell.open;
                if (type === Cell.Present && !open) {
                    return false;
                }
            }
        }
        return true;
    }
    firstLevel() {
        this.goToLevel(0);
    }
    previousLevel() {
        if (this.currentLevel === 0)
            return;
        this.goToLevel(this.currentLevel - 1);
    }
    resetLevel() {
        this.goToLevel(this.currentLevel);
    }
    nextLevel() {
        if (this.currentLevel === this.levels.length - 1)
            return;
        this.goToLevel(this.currentLevel + 1);
    }
    lastLevel() {
        this.goToLevel(this.levels.length - 1);
    }
    goToLevel(level) {
        this.currentLevel = level;
        this.loadLevelData(this.levels[level]);
    }
    inBounds(x, y) {
        return x >= 0 && x < this.size.w && y >= 0 && y < this.size.h;
    }
    laserLength(x, y) {
        let laserCell = this.grid[x][y];
        const direction = laserCell.direction;
        const directionVec2 = Dir.ToVec2[direction];
        const dx = directionVec2.dx;
        const dy = directionVec2.dy;
        const laserAxis = Dir.Axis(direction);
        let length = 0;
        while (true) {
            x += dx;
            y += dy;
            if (!this.inBounds(x, y))
                break;
            let cell = this.grid[x][y];
            const type = cell.type;
            if (type !== Cell.Empty && type !== Cell.Tunnel) {
                break;
            }
            if (type === Cell.Tunnel) {
                if (cell.axis !== laserAxis) {
                    break;
                }
            }
            length++;
        }
        return length;
    }
    refresh() {
        this.updateDisplayInfo();
        this.render();
    }
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderFloor();
        this.renderTunnels();
        this.renderPlayer();
        this.renderCells();
        this.renderLasers();
        this.renderPresents();
        this.renderStars();
        this.renderScrews();
        this.renderBoxes();
        this.renderConnections();
        this.renderBeams();
    }
    renderFloor() {
        this.ctx.fillStyle = Color.ToHex[this.floorColor];
        this.ctx.fillRect(this.displayRect.x, this.displayRect.y, this.displayRect.w, this.displayRect.h);
    }
    renderTunnels() {
        const w = this.size.w;
        const h = this.size.h;
        const size = this.cellSize;
        const rect = this.displayRect;
        const grid = this.grid;
        const ctx = this.ctx;
        const tunnelThickness = size * TUNNEL_THICKNESS_RATIO;
        const darkGray = Color.ToHex[Color.DarkGray];
        const gray = Color.ToHex[Color.Gray];
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                const cell = grid[i][j];
                const type = cell.type;
                const x0 = rect.x + i * size;
                const y0 = rect.y + j * size;
                if (type === Cell.Tunnel && cell.axis === Dir.Vertical) {
                    const x1 = x0 + size - tunnelThickness;
                    ctx.fillStyle = darkGray;
                    ctx.fillRect(x0, y0, size, size);
                    ctx.fillStyle = gray;
                    ctx.fillRect(x0, y0, tunnelThickness, size);
                    ctx.fillRect(x1, y0, tunnelThickness, size);
                }
                else if (type === Cell.Tunnel && cell.axis === Dir.Horizontal) {
                    const y1 = y0 + size - tunnelThickness;
                    ctx.fillStyle = darkGray;
                    ctx.fillRect(x0, y0, size, size);
                    ctx.fillStyle = gray;
                    ctx.fillRect(x0, y0, size, tunnelThickness);
                    ctx.fillRect(x0, y1, size, tunnelThickness);
                }
            }
        }
    }
    renderCells() {
        const w = this.size.w;
        const h = this.size.h;
        const size = this.cellSize;
        const rect = this.displayRect;
        const grid = this.grid;
        const ctx = this.ctx;
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                const cell = grid[i][j];
                if (cell.type === Cell.Empty)
                    continue;
                if (cell.type === Cell.Tunnel)
                    continue;
                const x = rect.x + i * size;
                const y = rect.y + j * size;
                ctx.fillStyle = Color.ToHex[cell.color];
                ctx.fillRect(x, y, size, size);
            }
        }
    }
    renderPresents() {
        const w = this.size.w;
        const h = this.size.h;
        const size = this.cellSize;
        const halfSize = size / 2;
        const rect = this.displayRect;
        const grid = this.grid;
        const ctx = this.ctx;
        const edgeWidth = size * PRESENT_SIDE_THICKNESS_RATIO;
        const innerWidth = size - edgeWidth * 2;
        ctx.fillStyle = '#0008';
        ctx.strokeStyle = '#fff';
        ctx.lineCap = 'butt';
        ctx.lineWidth = size * PRESENT_LINE_WIDTH_RATIO;
        ctx.beginPath();
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                const cell = grid[i][j];
                if (cell.type !== Cell.Present)
                    continue;
                if (cell.open) {
                    const x0 = rect.x + i * size + edgeWidth;
                    const y0 = rect.y + j * size + edgeWidth;
                    ctx.fillRect(x0, y0, innerWidth, innerWidth);
                }
                else {
                    const x0 = rect.x + i * size;
                    const y0 = rect.y + j * size;
                    const x1 = x0 + halfSize;
                    const y1 = y0 + halfSize;
                    const x2 = x0 + size;
                    const y2 = y0 + size;
                    ctx.moveTo(x0, y1);
                    ctx.lineTo(x2, y1);
                    ctx.moveTo(x1, y0);
                    ctx.lineTo(x1, y2);
                }
            }
        }
        ctx.stroke();
    }
    renderStars() {
        const w = this.size.w;
        const h = this.size.h;
        const size = this.cellSize;
        const halfSize = size / 2;
        const rect = this.displayRect;
        const grid = this.grid;
        const ctx = this.ctx;
        const radius = size * 0.25;
        const twoFifths = TAU * 2 / 5;
        ctx.fillStyle = '#ff0';
        ctx.strokeStyle = '#ff0';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = size * 1 / 24;
        ctx.beginPath();
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                const cell = grid[i][j];
                if (cell.type !== Cell.Present)
                    continue;
                if (!cell.open)
                    continue;
                const cx = rect.x + i * size + halfSize;
                const cy = rect.y + j * size + halfSize;
                let theta = TAU * 0.75;
                let x = cx;
                let y = cy - radius;
                ctx.moveTo(x, y);
                for (let k = 0; k < 5; k++) {
                    theta += twoFifths;
                    x = cx + Math.cos(theta) * radius;
                    y = cy + Math.sin(theta) * radius;
                    ctx.lineTo(x, y);
                }
            }
        }
        ctx.fill();
        ctx.stroke();
    }
    renderPlayer() {
        const size = this.cellSize;
        const x = this.displayRect.x + (this.player.x + 0.5) * size;
        const y = this.displayRect.y + (this.player.y + 0.5) * size;
        const radius = size * PLAYER_RADIUS_RATIO;
        const ctx = this.ctx;
        const color = this.floorColor === Color.Black ? Color.White : Color.Black;
        const colorHex = this.player.dead ? 'red' : Color.ToHex[color];
        const armRadius = radius - size * PLAYER_LINE_WIDTH_RATIO / 2;
        ctx.fillStyle = colorHex;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = size * PLAYER_LINE_WIDTH_RATIO;
        ctx.lineCap = 'round';
        ctx.beginPath();
        switch (this.player.dir) {
            case Dir.East:
                ctx.moveTo(x, y - armRadius);
                ctx.lineTo(x + radius, y - armRadius);
                ctx.moveTo(x, y + armRadius);
                ctx.lineTo(x + radius, y + armRadius);
                break;
            case Dir.South:
                ctx.moveTo(x - armRadius, y);
                ctx.lineTo(x - armRadius, y + radius);
                ctx.moveTo(x + armRadius, y);
                ctx.lineTo(x + armRadius, y + radius);
                break;
            case Dir.West:
                ctx.moveTo(x, y - armRadius);
                ctx.lineTo(x - radius, y - armRadius);
                ctx.moveTo(x, y + armRadius);
                ctx.lineTo(x - radius, y + armRadius);
                break;
            case Dir.North:
                ctx.moveTo(x - armRadius, y);
                ctx.lineTo(x - armRadius, y - radius);
                ctx.moveTo(x + armRadius, y);
                ctx.lineTo(x + armRadius, y - radius);
                break;
        }
        ctx.stroke();
    }
    renderConnections() {
        const w = this.size.w;
        const h = this.size.h;
        const size = this.cellSize;
        const rect = this.displayRect;
        const grid = this.grid;
        const ctx = this.ctx;
        this.ctx.strokeStyle = '#8888';
        this.ctx.lineWidth = size * CONNECTION_LINE_WIDTH_RATIO;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                const cell = grid[i][j];
                const type = cell.type;
                if (type === Cell.Empty)
                    continue;
                const x0 = rect.x + i * size;
                const y0 = rect.y + j * size;
                const x1 = x0 + size;
                const y1 = y0 + size;
                if ((cell.connections & Dir.BitEast) === 0) {
                    ctx.moveTo(x1, y0);
                    ctx.lineTo(x1, y1);
                }
                if ((cell.connections & Dir.BitSouth) === 0) {
                    ctx.moveTo(x0, y1);
                    ctx.lineTo(x1, y1);
                }
                if ((cell.connections & Dir.BitWest) === 0) {
                    ctx.moveTo(x0, y0);
                    ctx.lineTo(x0, y1);
                }
                if ((cell.connections & Dir.BitNorth) === 0) {
                    ctx.moveTo(x0, y0);
                    ctx.lineTo(x1, y0);
                }
            }
        }
        this.ctx.stroke();
    }
    renderLasers() {
        const w = this.size.w;
        const h = this.size.h;
        const size = this.cellSize;
        const halfSize = size / 2;
        const rect = this.displayRect;
        const grid = this.grid;
        const ctx = this.ctx;
        const darkGray = Color.ToHex[Color.DarkGray];
        const innerThickness = size * 0.125;
        const outerThickness = size * 0.25;
        const innerRadius = innerThickness / 2 + 0.1 * size;
        const outerRadius = outerThickness / 2 + 0.1 * size;
        const lasers = (color, thickness, radius) => {
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = thickness;
            ctx.lineCap = 'butt';
            ctx.beginPath();
            for (let i = 0; i < w; i++) {
                for (let j = 0; j < h; j++) {
                    const cell = grid[i][j];
                    const type = cell.type;
                    if (type !== Cell.Laser)
                        continue;
                    const cx = rect.x + i * size + halfSize;
                    const cy = rect.y + j * size + halfSize;
                    const direction = cell.direction;
                    const directionVec2 = Dir.ToVec2[direction];
                    const x = cx + directionVec2.dx * halfSize;
                    const y = cy + directionVec2.dy * halfSize;
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            ctx.beginPath();
            for (let i = 0; i < w; i++) {
                for (let j = 0; j < h; j++) {
                    const cell = grid[i][j];
                    const type = cell.type;
                    if (type !== Cell.Laser)
                        continue;
                    const cx = rect.x + i * size + halfSize;
                    const cy = rect.y + j * size + halfSize;
                    ctx.moveTo(cx, cy);
                    ctx.arc(cx, cy, radius, 0, TAU);
                }
            }
            ctx.fill();
        };
        lasers(darkGray, outerThickness, outerRadius);
        lasers('red', innerThickness, innerRadius);
    }
    renderBeams() {
        const w = this.size.w;
        const h = this.size.h;
        const size = this.cellSize;
        const halfSize = size / 2;
        const rect = this.displayRect;
        const grid = this.grid;
        const ctx = this.ctx;
        ctx.strokeStyle = 'red';
        ctx.lineWidth = size * 1 / 8;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                const cell = grid[i][j];
                const type = cell.type;
                if (type !== Cell.Laser)
                    continue;
                const cx = rect.x + i * size + halfSize;
                const cy = rect.y + j * size + halfSize;
                const direction = cell.direction;
                const directionVec2 = Dir.ToVec2[direction];
                const dx = directionVec2.dx;
                const dy = directionVec2.dy;
                const x0 = cx + dx * halfSize;
                const y0 = cy + dy * halfSize;
                const length = this.laserLength(i, j);
                const x1 = x0 + dx * size * length;
                const y1 = y0 + dy * size * length;
                ctx.moveTo(x0, y0);
                ctx.lineTo(x1, y1);
            }
        }
        ctx.stroke();
    }
    renderScrews() {
        const w = this.size.w;
        const h = this.size.h;
        const size = this.cellSize;
        const rect = this.displayRect;
        const grid = this.grid;
        const ctx = this.ctx;
        const darkGray = Color.ToHex[Color.DarkGray];
        const screwRadius = size * SCREW_RADIUS_RATIO;
        const screwOffset = size * SCREW_OFFSET_RATIO;
        const separation = size - screwOffset * 2;
        this.ctx.fillStyle = darkGray;
        this.ctx.beginPath();
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                const cell = grid[i][j];
                const type = cell.type;
                if (type !== Cell.Wall)
                    continue;
                const x0 = rect.x + (i + SCREW_OFFSET_RATIO) * size;
                const y0 = rect.y + (j + SCREW_OFFSET_RATIO) * size;
                const x1 = x0 + separation;
                const y1 = y0 + separation;
                const connectionEast = (cell.connections & Dir.BitEast) !== 0;
                const connectionSouth = (cell.connections & Dir.BitSouth) !== 0;
                const connectionWest = (cell.connections & Dir.BitWest) !== 0;
                const connectionNorth = (cell.connections & Dir.BitNorth) !== 0;
                let connectionSoutheast = connectionEast && connectionSouth;
                let connectionSouthwest = connectionWest && connectionSouth;
                let connectionNorthwest = connectionWest && connectionNorth;
                let connectionNortheast = connectionEast && connectionNorth;
                if (connectionSoutheast) {
                    const cellEast = grid[i + 1][j];
                    const cellSouth = grid[i][j + 1];
                    connectionSoutheast = (cellEast.connections & Dir.BitSouth) !== 0 && (cellSouth.connections & Dir.BitEast) !== 0;
                }
                if (connectionSouthwest) {
                    const cellWest = grid[i - 1][j];
                    const cellSouth = grid[i][j + 1];
                    connectionSouthwest = (cellWest.connections & Dir.BitSouth) !== 0 && (cellSouth.connections & Dir.BitWest) !== 0;
                }
                if (connectionNorthwest) {
                    const cellWest = grid[i - 1][j];
                    const cellNorth = grid[i][j - 1];
                    connectionNorthwest = (cellWest.connections & Dir.BitNorth) !== 0 && (cellNorth.connections & Dir.BitWest) !== 0;
                }
                if (connectionNortheast) {
                    const cellEast = grid[i + 1][j];
                    const cellNorth = grid[i][j - 1];
                    connectionNortheast = (cellEast.connections & Dir.BitNorth) !== 0 && (cellNorth.connections & Dir.BitEast) !== 0;
                }
                if (connectionEast === connectionSouth && !connectionSoutheast) {
                    ctx.moveTo(x1, y1);
                    ctx.arc(x1, y1, screwRadius, 0, TAU);
                }
                if (connectionSouth === connectionWest && !connectionSouthwest) {
                    ctx.moveTo(x0, y1);
                    ctx.arc(x0, y1, screwRadius, 0, TAU);
                }
                if (connectionWest === connectionNorth && !connectionNorthwest) {
                    ctx.moveTo(x0, y0);
                    ctx.arc(x0, y0, screwRadius, 0, TAU);
                }
                if (connectionNorth === connectionEast && !connectionNortheast) {
                    ctx.moveTo(x1, y0);
                    ctx.arc(x1, y0, screwRadius, 0, TAU);
                }
            }
        }
        this.ctx.fill();
    }
    renderBoxes() {
        const w = this.size.w;
        const h = this.size.h;
        const size = this.cellSize;
        const rect = this.displayRect;
        const grid = this.grid;
        const ctx = this.ctx;
        const outerBorderThickness = size * BOX_OUTER_BORDER_THICKNESS_RATIO;
        const innerBorderThickness = size * BOX_INNER_BORDER_THICKNESS_RATIO;
        const outerOffset = outerBorderThickness;
        const innerOffset = outerOffset + innerBorderThickness;
        const interiorRender = (fillStyle, offset) => {
            this.ctx.fillStyle = fillStyle;
            this.ctx.beginPath();
            const interiorSize = size - offset * 2;
            const interiorConnectionSize = size * 2 - offset * 2;
            for (let i = 0; i < w; i++) {
                for (let j = 0; j < h; j++) {
                    const cell = grid[i][j];
                    const type = cell.type;
                    if (type !== Cell.Box)
                        continue;
                    const x0 = rect.x + i * size + offset;
                    const y0 = rect.y + j * size + offset;
                    const connectionEast = (cell.connections & Dir.BitEast) !== 0;
                    const connectionSouth = (cell.connections & Dir.BitSouth) !== 0;
                    if (connectionEast && connectionSouth) {
                        const cellEast = grid[i + 1][j];
                        const cellSouth = grid[i][j + 1];
                        const eastToSouth = (cellEast.connections & Dir.BitSouth) === Dir.BitSouth;
                        const southToEast = (cellSouth.connections & Dir.BitEast) === Dir.BitEast;
                        if (eastToSouth && southToEast) {
                            ctx.rect(x0, y0, interiorConnectionSize, interiorConnectionSize);
                        }
                        else {
                            ctx.rect(x0, y0, interiorConnectionSize, interiorSize);
                            ctx.rect(x0, y0, interiorSize, interiorConnectionSize);
                        }
                    }
                    else if (connectionEast) {
                        ctx.rect(x0, y0, interiorConnectionSize, interiorSize);
                    }
                    else if (connectionSouth) {
                        ctx.rect(x0, y0, interiorSize, interiorConnectionSize);
                    }
                    else {
                        ctx.rect(x0, y0, interiorSize, interiorSize);
                    }
                }
            }
            this.ctx.fill();
        };
        interiorRender('#0004', outerOffset);
        interiorRender(Color.ToHex[Color.Brown], innerOffset);
    }
    updateDisplayInfo() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        this.canvas.width = w;
        this.canvas.height = h;
        const gameW = this.size.w;
        const gameH = this.size.h;
        const horizontalDisplay = w * gameH > h * gameW;
        this.cellSize = Math.floor(horizontalDisplay ? h / gameH : w / gameW);
        this.displayRect.w = gameW * this.cellSize;
        this.displayRect.h = gameH * this.cellSize;
        this.displayRect.x = Math.floor((w - this.displayRect.w) / 2);
        this.displayRect.y = Math.floor((h - this.displayRect.h) / 2);
    }
}
//# sourceMappingURL=game.js.map