import Game from './game.js';
import Point from './point.js';
export default class Editor {
    srcGame: Game;
    dstGame: Game;
    srcPoint: Point;
    dstPoint: Point;
    building: boolean;
    connecting: boolean;
    constructor(srcGame: Game, dstGame: Game);
    isEditMode(): boolean;
    srcMouseDown(event: MouseEvent): void;
    startBuilding(point: Point): void;
    startConnecting(): void;
    dstMouseDown(event: MouseEvent): void;
    keepBuilding(point: Point): void;
    keepConnecting(point: Point): void;
    dstMouseMove(event: MouseEvent): void;
    dstMouseUp(event: MouseEvent): void;
    toggleEditMode(): void;
    pointAt(game: Game, displayX: number, displayY: number): Point;
    disconnectAt(point: Point): void;
    grow(direction: number): void;
    shrink(direction: number): void;
    refresh(): void;
    render(): void;
    renderSelection(): void;
}
//# sourceMappingURL=editor.d.ts.map