import { themeManager } from '../managers/ThemeManager.js';

export default class SettingsScene extends Phaser.Scene {
    constructor() {
        super('Settings');
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x1d212d);

        // Title
        this.add.text(width / 2, 60, 'SETTINGS', {
            fontSize: '48px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#4fd1c5',
            stroke: '#1a202c',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Settings options
        const startY = 150;
        const spacing = 80;

        // Sound Effects toggle
        this.createToggle(width / 2, startY, 'Sound Effects',
            window.GameState.soundEnabled,
            (value) => {
                window.GameState.toggleSound();
            }
        );

        // Music toggle
        this.createToggle(width / 2, startY + spacing, 'Music',
            window.GameState.musicEnabled,
            (value) => {
                window.GameState.toggleMusic();
                // Stop/start music in game if it's running
                if (this.scene.isActive('Game')) {
                    const gameScene = this.scene.get('Game');
                    if (gameScene.music) {
                        value ? gameScene.music.resume() : gameScene.music.pause();
                    }
                }
            }
        );

        // Pose Control toggle
        this.createToggle(width / 2, startY + spacing * 2, 'Camera Controls',
            window.GameState.poseControlEnabled,
            (value) => {
                window.GameState.togglePoseControl();
            }
        );

        // Theme Toggle
        this.createToggle(width / 2, startY + spacing * 3, 'Theme: ' + (themeManager.currentTheme === 'neon' ? 'Neon' : 'Nature'),
            themeManager.currentTheme === 'nature',
            (value) => {
                const newTheme = themeManager.toggleTheme();
                // We need to refresh the scene to update the label properly or just handle it here
                // For simplicity, just update the label text is tricky with the current toggle implementation 
                // as it hardcodes ON/OFF text.
                // Let's create a specific Button for Theme instead of a Toggle since it's A/B choice.
            },
            true // isCustom
        );

        // Custom Theme Button (Better than toggle)
        this.createButton(width / 2, startY + spacing * 3, `Theme: ${themeManager.theme.name}`, (btnText) => {
            themeManager.toggleTheme();
            btnText.setText(`Theme: ${themeManager.theme.name}`);
        }, 0x805ad5);

        // Reset High Score button
        this.createButton(width / 2, startY + spacing * 4 + 10, 'Reset High Score', () => {
            window.GameState.highScore = 0;
            localStorage.setItem('exarplay_highscore', 0);
            this.showNotification('High score reset!');
        }, 0xe53e3e);

        // Back button
        this.createButton(width / 2, height - 80, 'BACK', () => {
            this.cameras.main.fade(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('MainMenu');
            });
        });

        // Keyboard shortcut to go back
        this.input.keyboard.on('keydown-ESC', () => {
            this.cameras.main.fade(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('MainMenu');
            });
        });

        // Fade in
        this.cameras.main.fadeIn(300);
    }

    createToggle(x, y, label, initialValue, onChange) {
        const container = this.add.container(x, y);

        // Label
        const labelText = this.add.text(-150, 0, label, {
            fontSize: '24px',
            color: '#fff'
        }).setOrigin(0, 0.5);

        // Toggle background
        const toggleBg = this.add.graphics();
        toggleBg.fillStyle(0x4a5568, 1);
        toggleBg.fillRoundedRect(100, -15, 60, 30, 15);

        // Toggle knob
        const knob = this.add.circle(initialValue ? 145 : 115, 0, 12, initialValue ? 0x4fd1c5 : 0x718096);

        // Status text
        const statusText = this.add.text(180, 0, initialValue ? 'ON' : 'OFF', {
            fontSize: '18px',
            color: initialValue ? '#4fd1c5' : '#718096'
        }).setOrigin(0, 0.5);

        container.add([labelText, toggleBg, knob, statusText]);

        // Make interactive
        const hitArea = new Phaser.Geom.Rectangle(-150, -20, 400, 40);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        let isOn = initialValue;

        container.on('pointerdown', () => {
            isOn = !isOn;

            // Animate knob
            this.tweens.add({
                targets: knob,
                x: isOn ? 145 : 115,
                duration: 150,
                ease: 'Cubic.easeOut'
            });

            // Update colors
            knob.setFillStyle(isOn ? 0x4fd1c5 : 0x718096);
            statusText.setText(isOn ? 'ON' : 'OFF');
            statusText.setColor(isOn ? '#4fd1c5' : '#718096');

            // Play sound
            if (window.GameState.soundEnabled) {
                try {
                    this.sound.play('select', { volume: 0.3 });
                } catch (e) { }
            }

            onChange(isOn);
        });

        container.on('pointerover', () => {
            labelText.setColor('#4fd1c5');
        });

        container.on('pointerout', () => {
            labelText.setColor('#fff');
        });

        return container;
    }



    createButton(x, y, text, callback, color = 0x4fd1c5) {
        const container = this.add.container(x, y);

        // Button background
        const bg = this.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-120, -25, 240, 50, 10);

        // Button text
        const btnText = this.add.text(0, 0, text, {
            fontSize: '22px',
            fontFamily: 'Arial, sans-serif',
            color: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([bg, btnText]);

        // Make interactive
        const hitArea = new Phaser.Geom.Rectangle(-120, -25, 240, 50);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        container.on('pointerover', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });

        container.on('pointerout', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        container.on('pointerdown', () => {
            this.tweens.add({
                targets: container,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 50,
                yoyo: true,
                onComplete: () => callback(btnText) // Pass text object to callback so we can update it
            });
        });

        return container;
    }

    showNotification(message) {
        const { width, height } = this.scale;

        const notification = this.add.container(width / 2, height / 2);

        const bg = this.add.graphics();
        bg.fillStyle(0x1a202c, 0.95);
        bg.fillRoundedRect(-150, -30, 300, 60, 10);
        bg.lineStyle(2, 0x4fd1c5);
        bg.strokeRoundedRect(-150, -30, 300, 60, 10);

        const text = this.add.text(0, 0, message, {
            fontSize: '20px',
            color: '#fff'
        }).setOrigin(0.5);

        notification.add([bg, text]);
        notification.setAlpha(0);
        notification.setScale(0.8);

        this.tweens.add({
            targets: notification,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    this.tweens.add({
                        targets: notification,
                        alpha: 0,
                        y: height / 2 - 50,
                        duration: 300,
                        onComplete: () => notification.destroy()
                    });
                });
            }
        });
    }
}
