export default class TutorialScene extends Phaser.Scene {
    constructor() {
        super('Tutorial');
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x1d212d);

        // Title
        this.add.text(width / 2, 50, 'HOW TO PLAY', {
            fontSize: '42px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#4fd1c5',
            stroke: '#1a202c',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Instructions panels
        const panelY = 180;
        const panelSpacing = 200;

        // Jump instruction
        this.createInstructionPanel(width / 4, panelY, 'JUMP', [
            'Press SPACE or UP arrow',
            'Or raise your hands up',
            'Jump over low obstacles'
        ], 'obstacle_low');

        // Duck instruction
        this.createInstructionPanel(width * 3 / 4, panelY, 'DUCK', [
            'Press DOWN arrow',
            'Or crouch down',
            'Duck under high obstacles'
        ], 'obstacle_high');

        // Camera controls section
        const cameraSection = this.add.container(width / 2, panelY + 180);

        this.add.text(0, 0, 'CAMERA CONTROLS', {
            fontSize: '24px',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(0, 40, 'The game uses your camera to detect poses:', {
            fontSize: '16px',
            color: '#a0aec0'
        }).setOrigin(0.5);

        this.add.text(0, 70, 'Stand in front of your camera and move your body!', {
            fontSize: '16px',
            color: '#a0aec0'
        }).setOrigin(0.5);

        // Tips section
        const tipsY = panelY + 280;
        this.add.text(width / 2, tipsY, 'TIPS', {
            fontSize: '24px',
            color: '#4fd1c5',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const tips = [
            'The game gets faster over time - stay alert!',
            'You can disable camera controls in Settings',
            'Try to beat your high score!'
        ];

        tips.forEach((tip, i) => {
            this.add.text(width / 2, tipsY + 35 + i * 28, `• ${tip}`, {
                fontSize: '16px',
                color: '#e2e8f0'
            }).setOrigin(0.5);
        });

        // Play button
        this.createButton(width / 2 - 120, height - 70, 'PLAY NOW', () => {
            this.cameras.main.fade(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('Game');
            });
        });

        // Back button
        this.createButton(width / 2 + 120, height - 70, 'BACK', () => {
            this.cameras.main.fade(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('MainMenu');
            });
        }, 0x4a5568);

        // Keyboard shortcuts
        this.input.keyboard.on('keydown-ESC', () => {
            this.cameras.main.fade(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('MainMenu');
            });
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.cameras.main.fade(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('Game');
            });
        });

        // Fade in
        this.cameras.main.fadeIn(300);
    }

    createInstructionPanel(x, y, title, instructions, obstacleKey) {
        const container = this.add.container(x, y);

        // Panel background
        const bg = this.add.graphics();
        bg.fillStyle(0x2d3748, 0.8);
        bg.fillRoundedRect(-130, -80, 260, 160, 15);
        bg.lineStyle(2, 0x4fd1c5, 0.5);
        bg.strokeRoundedRect(-130, -80, 260, 160, 15);

        // Title
        const titleText = this.add.text(0, -55, title, {
            fontSize: '28px',
            color: '#4fd1c5',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([bg, titleText]);

        // Obstacle preview
        if (obstacleKey) {
            const obstacle = this.add.image(-90, 15, obstacleKey).setScale(0.8);
            container.add(obstacle);

            // Animate obstacle
            this.tweens.add({
                targets: obstacle,
                y: 10,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Instructions text
        instructions.forEach((text, i) => {
            const instText = this.add.text(20, -20 + i * 24, text, {
                fontSize: '14px',
                color: '#e2e8f0'
            }).setOrigin(0, 0.5);
            container.add(instText);
        });

        return container;
    }

    createButton(x, y, text, callback, color = 0x4fd1c5) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-90, -22, 180, 44, 8);

        const btnText = this.add.text(0, 0, text, {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([bg, btnText]);

        const hitArea = new Phaser.Geom.Rectangle(-90, -22, 180, 44);
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
            if (window.GameState.soundEnabled) {
                try {
                    this.sound.play('select', { volume: 0.3 });
                } catch (e) { }
            }
            this.tweens.add({
                targets: container,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 50,
                yoyo: true,
                onComplete: callback
            });
        });

        return container;
    }
}
