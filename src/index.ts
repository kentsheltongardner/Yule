import Dir              from './dir.js'
import Game             from './game.js'
import Color            from './color.js'
import { basicLevelsData, paletteLevelData }  from './levels.js'
import Editor           from './editor.js'

function main() {
    Color.LoadPNGColors()

    const cellsCanvas   = document.getElementById('cells-canvas') as HTMLCanvasElement
    const gameCanvas    = document.getElementById('game-canvas') as HTMLCanvasElement
    const game          = new Game(basicLevelsData, gameCanvas)
    const cells         = new Game(paletteLevelData, cellsCanvas)
    const editor        = new Editor(cells, game)

    function levelAction(action: () => void) {
        action()
        game.refresh()
    }

    function resize() {
        game.refresh()
        editor.refresh()
    }
    
    window.addEventListener('resize', () => {
        resize()
    })

    window.addEventListener('keydown', async (event) => {
        // Move
        if (Dir.FromKey.has(event.key)) {
            const dir = Dir.FromKey.get(event.key)!
            if (editor.isEditMode()) {
                if (event.altKey) {
                    editor.shrink(dir)
                    return
                }
                editor.grow(dir)
                return
            }
            game.act(dir)
            game.render()
            return
        }

        // Grab
        if (event.code === 'Space') {
            if (game.grab()) {
                game.render()
                if (game.levelComplete()) {
                    setTimeout(() => {
                        levelAction(() => game.nextLevel())
                    }, 1000)
                }
            }
            return
        }

        // Level actions
        switch (event.code) {
            case 'KeyF':
                levelAction(() => game.firstLevel())
                return
            case 'KeyP':
                levelAction(() => game.previousLevel())
                return
            case 'KeyR':
                levelAction(() => game.resetLevel())
                return
            case 'KeyN':
                levelAction(() => game.nextLevel())
                return
            case 'KeyL':
                levelAction(() => game.lastLevel())
                return
        }

        // Save level data
        if (event.code === 'KeyS') {
            const levelData = game.levelData()
            await navigator.clipboard.writeText("'" + levelData + "',\n\t")
            return
        }

        // Edit mode
        if (event.code === 'KeyE') {
            editor.toggleEditMode()
        }
    })

    cellsCanvas.addEventListener('mousedown', (event) => editor.srcMouseDown(event))
    gameCanvas.addEventListener('mousedown',  (event) => editor.dstMouseDown(event))
    gameCanvas.addEventListener('mousemove',  (event) => editor.dstMouseMove(event))
    gameCanvas.addEventListener('mouseup',    (event) => editor.dstMouseUp(event))
    gameCanvas.addEventListener('mouseleave', (event) => editor.dstMouseUp(event))

    window.addEventListener('contextmenu',    (event) => event.preventDefault())

    // Release the grab
    window.addEventListener('keyup', (event) => {
        if (event.code === 'Space') {
            game.release()
        }
    })

    // Initial resize and render
    game.refresh()
    editor.refresh()
}

window.addEventListener('load', main)

function printLevel(path: string) {
    const connect = new Set<string>([
        '#',
        'X',
        'W',
    ])

    const colorToChar = new Map<string, string>([
        ['#ffffff', 'W'],
        ['#000000', ' '],
        ['#ff0000', 'R'],
        ['#ff8000', 'O'],
        ['#ffff00', 'Y'],
        ['#00ff00', 'G'],
        ['#00ffff', 'C'],
        ['#0000ff', 'B'],
        ['#8000ff', 'P'],
        ['#ff00ff', 'M'],

        ['#804000', 'X'],
        ['#404040', '#'],

        ['#80c0ff', '|'],
        ['#ff80c0', '-'],
        ['#808080', '@'],
    ])

    function replaceChar(str: string, pos: number, char: string) {
        return str.slice(0, pos) + char + str.slice(pos + 1)
    }

    const img   = new Image()
    img.src     = path
    img.onload = () => {
        const canvas        = document.createElement('canvas')
        const ctx           = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const pixels        = ctx.getImageData(0, 0, img.width, img.height).data
        const augmentedW    = img.width * 2 - 1
        const augmentedH    = img.height * 2 - 1
        const level         = new Array(augmentedH).fill(0).map(() => ' '.repeat(augmentedW))
        const count         = pixels.length / 4
        for (let i = 0; i < count; i++) { 
            const r         = pixels[i * 4].toString(16).padStart(2, '0')
            const g         = pixels[i * 4 + 1].toString(16).padStart(2, '0')
            const b         = pixels[i * 4 + 2].toString(16).padStart(2, '0')
            const color     = `#${r}${g}${b}`
            const x         = i % img.width * 2
            const y         = Math.floor(i / img.width) * 2
            const char      = colorToChar.get(color)!
            const str       = level[y]
            level[y]        = replaceChar(str, x, char)
        }

        for (let y = 0; y < augmentedH - 2; y++) {
            for (let x = 0; x < augmentedW; x++) {
                const cell      = level[y][x]
                if (!connect.has(cell)) continue
                const cellSouth = level[y + 2][x]
                if (cell === cellSouth) {
                    level[y + 1] = replaceChar(level[y + 1], x, '+')
                }
            }
        }

        for (let y = 0; y < augmentedH; y++) {
            for (let x = 0; x < augmentedW - 2; x++) {
                const cell      = level[y][x]
                if (!connect.has(cell)) continue
                const cellEast  = level[y][x + 2]
                if (cell === cellEast) {
                    level[y] = replaceChar(level[y], x + 1, '+')
                }
            }
        }

        let levelString = ''
        levelString += '    [\n'
        for (let y = 0; y < augmentedH; y++) {
            levelString += '        "' + level[y] + '",\n'
        }
        levelString += '    ],\n'

        console.log(levelString)
    }
}

// Expose printImageLevel to the global scope for browser console access
(window as any).printLevel = printLevel