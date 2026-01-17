import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import CalibrationScene from './scenes/CalibrationScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import TutorialScene from './scenes/TutorialScene.js';
import GameScene from './scenes/GameScene.js';
import DebugScene from './scenes/DebugScene.js';
import GameOverScene from './scenes/GameOverScene.js';

// Game configuration
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#1d212d',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1800 },
            debug: false
        }
    },
    audio: {
        disableWebAudio: false
    },
    scene: [
        BootScene,
        PreloadScene,
        CalibrationScene,
        MainMenuScene,
        SettingsScene,
        TutorialScene,
        GameScene,
        DebugScene,
        GameOverScene
    ]
};

// Game state management
window.GameState = {
    highScore: parseInt(localStorage.getItem('exarplay_highscore')) || 0,
    soundEnabled: localStorage.getItem('exarplay_sound') !== 'false',
    musicEnabled: localStorage.getItem('exarplay_music') !== 'false',
    poseControlEnabled: localStorage.getItem('exarplay_pose') !== 'false',
    debugMode: localStorage.getItem('exarplay_debug') === 'true',

    saveHighScore(score) {
        if (score > this.highScore) {
            this.highScore = score;
            localStorage.setItem('exarplay_highscore', score);
            return true;
        }
        return false;
    },

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('exarplay_sound', this.soundEnabled);
    },

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('exarplay_music', this.musicEnabled);
    },

    togglePoseControl() {
        this.poseControlEnabled = !this.poseControlEnabled;
        localStorage.setItem('exarplay_pose', this.poseControlEnabled);
    },

    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        localStorage.setItem('exarplay_debug', this.debugMode);
    }
};

// Create the game instance
const game = new Phaser.Game(config);

// Handle visibility change (pause/resume)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        game.scene.scenes.forEach(scene => {
            if (scene.scene.isActive() && scene.scene.key === 'Game') {
                scene.scene.pause();
            }
        });
    }
});

// Export for debugging
window.game = game;
