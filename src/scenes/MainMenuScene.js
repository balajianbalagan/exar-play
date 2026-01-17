import PoseService from '../services/PoseService.js';
import { scoreManager } from '../managers/ScoreManager.js';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;

        // Reset camera and world bounds
        this.cameras.main.setScroll(0, 0);
        this.cameras.main.setBounds(0, 0, width, height);

        // Background
        this.add.image(width / 2, 150, 'bg_far').setScale(1.2);

        // Title with glow effect
        const title = this.add.text(width / 2, 80, 'EXAR PLAY', {
            fontSize: '56px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#4fd1c5',
            stroke: '#1a202c',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Title animation
        this.tweens.add({
            targets: title,
            y: 90,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Subtitle
        this.add.text(width / 2, 140, 'Pose-Controlled Endless Runner', {
            fontSize: '16px',
            color: '#a0aec0'
        }).setOrigin(0.5);

        // Show Leaderboard (Session)
        this.createLeaderboard(width, height);

        // Name Input overlay
        this.createNameInput(width, height);

        // High score display
        this.add.text(width / 2, 175, `All Time Best: ${window.GameState.highScore}`, {
            fontSize: '18px',
            color: '#ffd700'
        }).setOrigin(0.5);

        // Calibration status
        const calibStatus = PoseService.isCalibrated ? 'Calibrated' : 'Not Calibrated';
        const calibColor = PoseService.isCalibrated ? '#48bb78' : '#ed8936';
        this.add.text(width / 2, 200, `Pose: ${calibStatus}`, {
            fontSize: '14px',
            color: calibColor
        }).setOrigin(0.5);

        // Menu buttons - adjusted Y positions
        let buttonY = 240;
        const buttonSpacing = 55;

        // Play button
        this.createButton(width / 2, buttonY, 'PLAY', () => {
            this.goToScene('Game');
        });
        buttonY += buttonSpacing;

        // How to Play
        this.createButton(width / 2, buttonY, 'HOW TO PLAY', () => {
            this.goToScene('Tutorial');
        });
        buttonY += buttonSpacing;

        // Calibrate / Recalibrate button (only if pose enabled)
        if (window.GameState.poseControlEnabled && PoseService.isModelLoaded) {
            const calibText = PoseService.isCalibrated ? 'RECALIBRATE' : 'CALIBRATE';
            this.createButton(width / 2, buttonY, calibText, () => {
                PoseService.clearCalibration();
                this.goToScene('Calibration');
            }, 0x805ad5);
            buttonY += buttonSpacing;
        }

        // Settings
        this.createButton(width / 2, buttonY, 'SETTINGS', () => {
            this.goToScene('Settings');
        });
        buttonY += buttonSpacing;

        // Debug button (smaller, at bottom)
        this.createSmallButton(width - 80, height - 30, 'DEBUG', () => {
            this.goToScene('Debug');
        });

        // Version info
        this.add.text(10, height - 10, 'v1.2.0', {
            fontSize: '12px',
            color: '#4a5568'
        }).setOrigin(0, 1);

        // Controls hint
        this.add.text(width / 2, height - 30,
            'SPACE = Start | D = Debug', {
            fontSize: '12px',
            color: '#718096'
        }).setOrigin(0.5);

        // Keyboard shortcuts
        this.input.keyboard.on('keydown-SPACE', () => this.goToScene('Game'));
        this.input.keyboard.on('keydown-ENTER', () => this.goToScene('Game'));
        this.input.keyboard.on('keydown-D', () => this.goToScene('Debug'));
        this.input.keyboard.on('keydown-C', () => {
            if (window.GameState.poseControlEnabled && PoseService.isModelLoaded) {
                PoseService.clearCalibration();
                this.goToScene('Calibration');
            }
        });

        // Fade in
        this.cameras.main.fadeIn(500);
    }

    goToScene(sceneName) {
        this.playSelectSound();
        this.cameras.main.fade(300, 0, 0, 0);
        this.time.delayedCall(300, () => {
            this.scene.start(sceneName);
        });
    }

    createButton(x, y, text, callback, color = 0x4fd1c5) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-110, -22, 220, 44, 10);

        const hoverColor = color === 0x4fd1c5 ? 0x38b2ac : 0x6b46c1;
        const bgHover = this.add.graphics();
        bgHover.fillStyle(hoverColor, 1);
        bgHover.fillRoundedRect(-110, -22, 220, 44, 10);
        bgHover.setVisible(false);

        const textColor = color === 0x805ad5 ? '#fff' : '#1a202c';
        const btnText = this.add.text(0, 0, text, {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: textColor,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([bg, bgHover, btnText]);

        const hitArea = new Phaser.Geom.Rectangle(-110, -22, 220, 44);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        container.on('pointerover', () => {
            bg.setVisible(false);
            bgHover.setVisible(true);
            container.setScale(1.05);
        });

        container.on('pointerout', () => {
            bg.setVisible(true);
            bgHover.setVisible(false);
            container.setScale(1);
        });

        container.on('pointerdown', () => {
            container.setScale(0.95);
            this.time.delayedCall(100, callback);
        });

        return container;
    }

    createSmallButton(x, y, text, callback) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0x4a5568, 1);
        bg.fillRoundedRect(-40, -12, 80, 24, 5);

        const btnText = this.add.text(0, 0, text, {
            fontSize: '12px',
            color: '#a0aec0'
        }).setOrigin(0.5);

        container.add([bg, btnText]);
        container.setInteractive(new Phaser.Geom.Rectangle(-40, -12, 80, 24), Phaser.Geom.Rectangle.Contains);

        container.on('pointerover', () => container.setScale(1.1));
        container.on('pointerout', () => container.setScale(1));
        container.on('pointerdown', callback);

        return container;
    }

    playSelectSound() {
        if (window.GameState.soundEnabled) {
            try {
                this.sound.play('select', { volume: 0.5 });
            } catch (e) { }
        }
    }

    createNameInput(width, height) {
        // We need a DOM element for input
        const div = document.createElement('div');
        div.style = `
            position: absolute;
            top: 110px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
            display: flex;
            gap: 10px;
            align-items: center;
        `;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = scoreManager.userName;
        input.placeholder = 'Enter Name';
        input.maxLength = 10;
        input.style = `
            padding: 8px;
            border-radius: 4px;
            border: 2px solid #4fd1c5;
            background: #1a202c;
            color: white;
            font-family: Arial;
            font-size: 16px;
            width: 120px;
            text-align: center;
        `;

        input.onblur = () => {
            if (input.value.trim()) {
                scoreManager.setUserName(input.value.trim());
            }
        };

        div.appendChild(input);
        document.body.appendChild(div);

        // Cleanup when leaving scene
        this.events.once('shutdown', () => {
            if (document.body.contains(div)) {
                document.body.removeChild(div);
            }
        });
    }

    createLeaderboard(width, height) {
        const scores = scoreManager.getLeaderboard();
        if (scores.length === 0) return;

        const x = 30;
        const y = 100;

        this.add.text(x, y, 'RECENT RUNS', {
            fontSize: '16px',
            color: '#718096',
            fontStyle: 'bold'
        });

        scores.forEach((entry, i) => {
            this.add.text(x, y + 25 + (i * 20), `${i + 1}. ${entry.name}: ${entry.score}`, {
                fontSize: '14px',
                color: '#e2e8f0'
            });
        });
    }
}
