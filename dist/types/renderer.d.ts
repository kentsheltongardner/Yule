import Game from './game.js';
import Rect from './rect.js';
export default class Renderer {
    game: Game;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    cellSize: number;
    displayRect: Rect;
    constructor(game: Game, canvas: HTMLCanvasElement);
    render(): void;
    renderFloor(): void;
    renderTunnels(): void;
    renderCells(): void;
    renderPresents(): void;
    renderPlayer(): void;
    renderConnections(): void;
    renderScrews(): void;
    renderBoxes(): void;
    updateDisplayInfo(): void;
}
//# sourceMappingURL=renderer.d.ts.map