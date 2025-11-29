export default class Color {
    static Red = 0;
    static Orange = 1;
    static Yellow = 2;
    static Green = 3;
    static Cyan = 4;
    static Blue = 5;
    static Purple = 6;
    static Magenta = 7;
    static Brown = 8;
    static White = 9;
    static Gray = 10;
    static DarkGray = 11;
    static Black = 12;
    static Tan = 13;
    static DarkTan = 14;
    static HexRed = '#f00';
    static HexOrange = '#f80';
    static HexYellow = '#ff0';
    static HexGreen = '#0f0';
    static HexCyan = '#0ff';
    static HexBlue = '#00f';
    static HexPurple = '#f0f';
    static HexMagenta = '#f0f';
    static HexBrown = '#840';
    static HexGray = '#888';
    static HexBlack = '#111';
    static HexWhite = '#eee';
    static HexDarkGray = '#444';
    static HexTan = '#884';
    static HexDarkTan = '#442';
    static ToHex = [
        Color.HexRed,
        Color.HexOrange,
        Color.HexYellow,
        Color.HexGreen,
        Color.HexCyan,
        Color.HexBlue,
        Color.HexPurple,
        Color.HexMagenta,
        Color.HexBrown,
        Color.HexWhite,
        Color.HexGray,
        Color.HexDarkGray,
        Color.HexBlack,
        Color.HexTan,
        Color.HexDarkTan,
    ];
    static LoadPNGColors() {
        const img = document.getElementById('colors');
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = data.data;
        const count = pixels.length / 4;
        for (let i = 0; i < count; i++) {
            const r = pixels[i * 4].toString(16).padStart(2, '0');
            const g = pixels[i * 4 + 1].toString(16).padStart(2, '0');
            const b = pixels[i * 4 + 2].toString(16).padStart(2, '0');
            const color = `#${r}${g}${b}`;
            Color.ToHex[i] = color;
        }
    }
}
//# sourceMappingURL=color.js.map