import Cell from './cell.js';
import Dir from './dir.js';
import Game from './game.js';
import Rect from './rect.js';
import Color from './color.js';
const TAU = 2 * Math.PI;
const TUNNEL_THICKNESS_RATIO = 1 / 8;
const PLAYER_RADIUS_RATIO = 3 / 8;
const PLAYER_LINE_WIDTH_RATIO = 1 / 4;
const CONNECTION_LINE_WIDTH_RATIO = 1 / 16;
const PRESENT_LINE_WIDTH_RATIO = 1 / 6;
const PRESENT_SIDE_THICKNESS_RATIO = 1 / 8;
const SCREW_RADIUS_RATIO = 1 / 16;
const SCREW_OFFSET_RATIO = 1 / 6;
const BOX_BORDER_THICKNESS_RATIO = 1 / 8;
export default class Renderer {
    game;
    canvas;
    ctx;
    cellSize;
    displayRect;
    constructor(game, canvas) {
        this.game = game;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = 0;
        this.displayRect = new Rect(0, 0, 0, 0);
        this.updateDisplayInfo();
    }
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderFloor();
        this.renderTunnels();
        this.renderPlayer();
        this.renderCells();
        this.renderPresents();
        this.renderScrews();
        this.renderBoxes();
        this.renderConnections();
    }
    renderFloor() {
        this.ctx.fillStyle = Color.ToHex[this.game.floorColor];
        this.ctx.fillRect(this.displayRect.x, this.displayRect.y, this.displayRect.w, this.displayRect.h);
    }
    renderTunnels() {
        const w = this.game.size.w;
        const h = this.game.size.h;
        const size = this.cellSize;
        const rect = this.displayRect;
        const grid = this.game.grid;
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
        const w = this.game.size.w;
        const h = this.game.size.h;
        const size = this.cellSize;
        const rect = this.displayRect;
        const grid = this.game.grid;
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
        const w = this.game.size.w;
        const h = this.game.size.h;
        const size = this.cellSize;
        const halfSize = size / 2;
        const rect = this.displayRect;
        const grid = this.game.grid;
        const ctx = this.ctx;
        const edgeWidth = size * PRESENT_SIDE_THICKNESS_RATIO;
        const innerWidth = size - edgeWidth * 2;
        ctx.fillStyle = '#0008';
        ctx.strokeStyle = '#fff';
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
    renderPlayer() {
        const size = this.cellSize;
        const x = this.displayRect.x + (this.game.player.x + 0.5) * size;
        const y = this.displayRect.y + (this.game.player.y + 0.5) * size;
        const radius = size * PLAYER_RADIUS_RATIO;
        const ctx = this.ctx;
        const color = this.game.floorColor === Color.Black ? Color.White : Color.Black;
        const colorHex = Color.ToHex[color];
        const halfSize = size * 0.5;
        const vec2 = Dir.ToVec2[this.game.player.dir];
        ctx.fillStyle = colorHex;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = size * PLAYER_LINE_WIDTH_RATIO;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + vec2.dx * halfSize, y + vec2.dy * halfSize);
        ctx.stroke();
    }
    renderConnections() {
        const w = this.game.size.w;
        const h = this.game.size.h;
        const size = this.cellSize;
        const rect = this.displayRect;
        const grid = this.game.grid;
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
    renderScrews() {
        const w = this.game.size.w;
        const h = this.game.size.h;
        const size = this.cellSize;
        const rect = this.displayRect;
        const grid = this.game.grid;
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
                if (connectionEast === connectionSouth) {
                    ctx.moveTo(x1, y1);
                    ctx.arc(x1, y1, screwRadius, 0, TAU);
                }
                if (connectionSouth === connectionWest) {
                    ctx.moveTo(x0, y1);
                    ctx.arc(x0, y1, screwRadius, 0, TAU);
                }
                if (connectionWest === connectionNorth) {
                    ctx.moveTo(x0, y0);
                    ctx.arc(x0, y0, screwRadius, 0, TAU);
                }
                if (connectionNorth === connectionEast) {
                    ctx.moveTo(x1, y0);
                    ctx.arc(x1, y0, screwRadius, 0, TAU);
                }
            }
        }
        this.ctx.fill();
    }
    renderBoxes() {
        const w = this.game.size.w;
        const h = this.game.size.h;
        const size = this.cellSize;
        const rect = this.displayRect;
        const grid = this.game.grid;
        const ctx = this.ctx;
        const borderThickness = size * BOX_BORDER_THICKNESS_RATIO;
        const innerSize = size - borderThickness * 2;
        const connectionSize = size * 2 - borderThickness * 2;
        this.ctx.fillStyle = '#0008';
        this.ctx.beginPath();
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                const cell = grid[i][j];
                const type = cell.type;
                if (type !== Cell.Box)
                    continue;
                const x0 = rect.x + i * size + borderThickness;
                const y0 = rect.y + j * size + borderThickness;
                const w0 = (cell.connections & Dir.BitEast) !== 0 ? connectionSize : innerSize;
                const h0 = (cell.connections & Dir.BitSouth) !== 0 ? connectionSize : innerSize;
                ctx.rect(x0, y0, w0, h0);
            }
        }
        this.ctx.fill();
    }
    updateDisplayInfo() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        this.canvas.width = w;
        this.canvas.height = h;
        const gameW = this.game.size.w;
        const gameH = this.game.size.h;
        const horizontalDisplay = w * gameH > h * gameW;
        this.cellSize = Math.floor(horizontalDisplay ? h / gameH : w / gameW);
        this.displayRect.w = gameW * this.cellSize;
        this.displayRect.h = gameH * this.cellSize;
        this.displayRect.x = Math.floor((w - this.displayRect.w) / 2);
        this.displayRect.y = Math.floor((h - this.displayRect.h) / 2);
    }
}
//# sourceMappingURL=renderer.js.map