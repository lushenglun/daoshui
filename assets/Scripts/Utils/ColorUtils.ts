import { Color } from 'cc';

const HEX_REGEX = /^#?[0-9A-Fa-f]{6}$/;

export function colorFromHex(hex: string, alpha = 255): Color {
    if (!hex || !HEX_REGEX.test(hex)) {
        console.warn(`[ColorUtils] invalid hex color: "${hex}", fallback to white`);
        return new Color(255, 255, 255, alpha);
    }
    const normalized = hex.replace('#', '');
    const value = Number.parseInt(normalized, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return new Color(r, g, b, alpha);
}

export function colorToHex(color: Color): string {
    const part = (value: number) => {
        const hex = value.toString(16);
        return hex.length === 1 ? `0${hex}` : hex;
    };
    return `#${part(color.r)}${part(color.g)}${part(color.b)}`.toUpperCase();
}
