export default class ThemeManager {
    constructor() {
        if (ThemeManager.instance) return ThemeManager.instance;
        ThemeManager.instance = this;

        this.themes = {
            neon: {
                name: 'Neon City',
                bgFar: 'bg_far',
                bgMid: 'bg_mid',
                ground: 'ground',
                bgColor: 0x1d212d,
                groundTint: 0xffffff, // Normal
                uiColor: '#4fd1c5',
                uiStroke: '#1a202c',
                accent: 0xe53e3e
            },
            nature: {
                name: 'Nature Run',
                bgFar: 'bg_far', // Reuse fallback or expect new assets
                bgMid: 'bg_mid',
                ground: 'ground',
                bgColor: 0x87CEEB, // Sky Blue
                bgFarTint: 0xaaddff,
                bgMidTint: 0x88cc88,
                groundTint: 0x228B22, // Forest Green
                uiColor: '#ffffff',
                uiStroke: '#225522',
                accent: 0xffa500 // Orange
            }
        };

        this.currentTheme = localStorage.getItem('exarplay_theme') || 'neon';
    }

    get theme() {
        return this.themes[this.currentTheme];
    }

    setTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
            localStorage.setItem('exarplay_theme', themeName);
            return true;
        }
        return false;
    }

    toggleTheme() {
        const nextTheme = this.currentTheme === 'neon' ? 'nature' : 'neon';
        this.setTheme(nextTheme);
        return nextTheme;
    }
}

export const themeManager = new ThemeManager();
