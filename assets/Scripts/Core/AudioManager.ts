import { AudioClip, AudioSource, director, game, Node, resources } from 'cc';
import { GAME_CONFIG } from '../Data/GameConfig';

export type BgmId = 'bgm_main_menu' | 'bgm_gameplay' | 'bgm_level_complete';

export type SfxId =
    | 'sfx_button_click'
    | 'sfx_panel_open'
    | 'sfx_panel_close'
    | 'sfx_toggle_switch'
    | 'sfx_back_cancel'
    | 'sfx_locked'
    | 'sfx_bottle_select'
    | 'sfx_bottle_deselect'
    | 'sfx_pour_success'
    | 'sfx_pour_error'
    | 'sfx_bottle_shake'
    | 'sfx_undo'
    | 'sfx_reset'
    | 'sfx_hint'
    | 'sfx_auto_pour'
    | 'sfx_level_win'
    | 'sfx_star_appear_01'
    | 'sfx_star_appear_02'
    | 'sfx_star_appear_03'
    | 'sfx_coins_get'
    | 'sfx_diamonds_get'
    | 'sfx_checkin_success'
    | 'sfx_streak_bonus'
    | 'sfx_achievement_unlock'
    | 'sfx_achievement_claim'
    | 'sfx_theme_unlock'
    | 'sfx_theme_switch'
    | 'sfx_daily_challenge_complete';

export class AudioManager {
    static musicEnabled = true;
    static soundEnabled = true;
    static bgmVolume = GAME_CONFIG.AUDIO.BGM_VOLUME;
    static sfxVolume = GAME_CONFIG.AUDIO.SFX_VOLUME;

    private static root: Node | null = null;
    private static bgmSource: AudioSource | null = null;
    private static sfxSource: AudioSource | null = null;
    private static sfxSources: AudioSource[] = [];
    private static nextSfxSourceIndex = 0;
    private static bgmClips: Partial<Record<BgmId, AudioClip>> = {};
    private static sfxClips: Partial<Record<SfxId, AudioClip>> = {};
    private static currentBgm: BgmId | null = null;
    private static loadingBgm: Partial<Record<BgmId, Promise<AudioClip | null>>> = {};
    private static loadingSfx: Partial<Record<SfxId, Promise<AudioClip | null>>> = {};

    static initialize(musicEnabled: boolean, soundEnabled: boolean): void {
        this.musicEnabled = musicEnabled;
        this.soundEnabled = soundEnabled;
        this.ensureSources();
        this.refreshVolumes();
        this.preloadAllSfx();
    }

    static setMusicEnabled(enabled: boolean): void {
        this.musicEnabled = enabled;
        this.refreshVolumes();
        if (enabled && this.currentBgm && this.bgmSource && !this.bgmSource.playing) {
            this.bgmSource.play();
        }
    }

    static setSoundEnabled(enabled: boolean): void {
        this.soundEnabled = enabled;
        this.refreshVolumes();
    }

    static async playBgm(id: BgmId, forceRestart = false, loop = true): Promise<void> {
        this.ensureSources();
        if (!this.bgmSource) {
            return;
        }
        if (this.currentBgm === id && this.bgmSource.playing && !forceRestart) {
            return;
        }

        const clip = await this.loadBgm(id);
        if (!clip || !this.bgmSource) {
            return;
        }

        this.currentBgm = id;
        this.bgmSource.stop();
        this.bgmSource.clip = clip;
        this.bgmSource.loop = loop;
        this.refreshVolumes();
        if (this.musicEnabled) {
            this.bgmSource.play();
        }
    }

    static stopBgm(): void {
        this.bgmSource?.stop();
        this.currentBgm = null;
    }

    static resumeCurrentBgm(): void {
        if (!this.musicEnabled || !this.currentBgm || !this.bgmSource || this.bgmSource.playing) {
            return;
        }
        this.bgmSource.play();
    }

    static async playSfx(id: SfxId, volumeScale = 1): Promise<void> {
        if (!this.soundEnabled) {
            return;
        }
        this.ensureSources();
        if (!this.sfxSource && this.sfxSources.length === 0) {
            return;
        }
        const clip = await this.loadSfx(id);
        if (!clip || !this.soundEnabled) {
            return;
        }
        const source = this.getNextSfxSource();
        if (!source) {
            return;
        }
        source.playOneShot(clip, volumeScale);
    }

    static playButton(): void {
        void this.playSfx('sfx_button_click');
    }

    static playPanelOpen(): void {
        void this.playSfx('sfx_panel_open');
    }

    static playPanelClose(): void {
        void this.playSfx('sfx_panel_close');
    }

    static playToggle(): void {
        void this.playSfx('sfx_toggle_switch');
    }

    static playPour(): void {
        void this.playSfx('sfx_pour_success');
    }

    static playWin(): void {
        void this.playSfx('sfx_level_win');
    }

    static playStar(index: number): void {
        const ids: SfxId[] = ['sfx_star_appear_01', 'sfx_star_appear_02', 'sfx_star_appear_03'];
        void this.playSfx(ids[Math.max(0, Math.min(ids.length - 1, index))]);
    }

    private static ensureSources(): void {
        if (this.root?.isValid && this.bgmSource && this.sfxSource && this.sfxSources.length > 0) {
            return;
        }

        this.root = new Node('AudioManager');
        this.bgmSource = this.root.addComponent(AudioSource);
        this.sfxSource = this.root.addComponent(AudioSource);
        this.sfxSources = [this.sfxSource];
        for (let i = 1; i < 6; i += 1) {
            this.sfxSources.push(this.root.addComponent(AudioSource));
        }
        this.bgmSource.loop = true;
        this.refreshVolumes();

        const scene = director.getScene();
        if (scene) {
            scene.addChild(this.root);
            game.addPersistRootNode(this.root);
        }
    }

    private static refreshVolumes(): void {
        if (this.bgmSource) {
            this.bgmSource.volume = this.musicEnabled ? this.bgmVolume : 0;
        }
        if (this.sfxSource) {
            this.sfxSource.volume = this.soundEnabled ? this.sfxVolume : 0;
        }
        this.sfxSources.forEach((source) => {
            source.volume = this.soundEnabled ? this.sfxVolume : 0;
        });
    }

    private static preloadAllSfx(): void {
        const ids: SfxId[] = [
            'sfx_button_click',
            'sfx_panel_open',
            'sfx_panel_close',
            'sfx_toggle_switch',
            'sfx_back_cancel',
            'sfx_locked',
            'sfx_bottle_select',
            'sfx_bottle_deselect',
            'sfx_pour_success',
            'sfx_pour_error',
            'sfx_bottle_shake',
            'sfx_undo',
            'sfx_reset',
            'sfx_hint',
            'sfx_auto_pour',
            'sfx_level_win',
            'sfx_star_appear_01',
            'sfx_star_appear_02',
            'sfx_star_appear_03',
            'sfx_coins_get',
            'sfx_diamonds_get',
            'sfx_checkin_success',
            'sfx_streak_bonus',
            'sfx_achievement_unlock',
            'sfx_achievement_claim',
            'sfx_theme_unlock',
            'sfx_theme_switch',
            'sfx_daily_challenge_complete',
        ];
        ids.forEach((id) => void this.loadSfx(id));
    }

    private static getNextSfxSource(): AudioSource | null {
        if (this.sfxSources.length === 0) {
            return this.sfxSource;
        }
        const source = this.sfxSources[this.nextSfxSourceIndex % this.sfxSources.length];
        this.nextSfxSourceIndex = (this.nextSfxSourceIndex + 1) % this.sfxSources.length;
        return source ?? this.sfxSource;
    }

    private static loadBgm(id: BgmId): Promise<AudioClip | null> {
        if (this.bgmClips[id]) {
            return Promise.resolve(this.bgmClips[id] ?? null);
        }
        if (!this.loadingBgm[id]) {
            this.loadingBgm[id] = this.loadClip(`Audio/BGM/${id}`).then((clip) => {
                if (clip) {
                    this.bgmClips[id] = clip;
                }
                return clip;
            });
        }
        return this.loadingBgm[id] ?? Promise.resolve(null);
    }

    private static loadSfx(id: SfxId): Promise<AudioClip | null> {
        if (this.sfxClips[id]) {
            return Promise.resolve(this.sfxClips[id] ?? null);
        }
        if (!this.loadingSfx[id]) {
            this.loadingSfx[id] = this.loadClip(`Audio/SFX/${id}`).then((clip) => {
                if (clip) {
                    this.sfxClips[id] = clip;
                }
                return clip;
            });
        }
        return this.loadingSfx[id] ?? Promise.resolve(null);
    }

    private static loadClip(path: string): Promise<AudioClip | null> {
        return new Promise((resolve) => {
            resources.load(path, AudioClip, (error, clip) => {
                if (error) {
                    console.warn('[AudioManager] load clip failed:', path, error);
                    resolve(null);
                    return;
                }
                resolve(clip);
            });
        });
    }
}
