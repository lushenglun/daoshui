import { GAME_CONFIG } from '../Data/GameConfig';

export class AudioManager {
    static musicEnabled = true;
    static soundEnabled = true;
    static bgmVolume = GAME_CONFIG.AUDIO.BGM_VOLUME;
    static sfxVolume = GAME_CONFIG.AUDIO.SFX_VOLUME;

    static playButton(): void {
        // Asset-backed audio will be wired after SFX files are imported.
    }

    static playPour(): void {
        // Placeholder for water pouring SFX.
    }

    static playWin(): void {
        // Placeholder for level complete SFX.
    }
}

