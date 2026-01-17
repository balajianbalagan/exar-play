import { scoreManager } from '../managers/ScoreManager.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    create(data) {
        const { width, height } = this.scale;
        const score = data.score || 0;

        // Reset camera and world bounds
        this.cameras.main.setScroll(0, 0);
        this.cameras.main.setBounds(0, 0, width, height);

        // Check for new high score
        const isNewHighScore = window.GameState.saveHighScore(score);

        // Add to session history
        scoreManager.addScore(score);

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x1d212d);

        // Game Over title
        const title = this.add.text(width / 2, 100, 'GAME OVER', {
            fontSize: '56px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#e53e3e',
            stroke: '#1a202c',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Title shake animation
        this.tweens.add({
            targets: title,
            x: width / 2 + 5,
            duration: 50,
            yoyo: true,
            repeat: 5
        });

        // Score display
        this.add.text(width / 2, 200, 'YOUR SCORE', {
            fontSize: '24px',
            color: '#a0aec0'
        }).setOrigin(0.5);

        const scoreText = this.add.text(width / 2, 250, score.toString(), {
            fontSize: '72px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#fff'
        }).setOrigin(0.5);

        // Score count-up animation
        let displayScore = 0;
        const scoreTimer = this.time.addEvent({
            delay: 20,
            callback: () => {
                displayScore = Math.min(displayScore + Math.ceil(score / 50), score);
                scoreText.setText(displayScore.toString());
                if (displayScore >= score) {
                    scoreTimer.destroy();
                }
            },
            loop: true
        });

        // New high score celebration
        if (isNewHighScore) {
            const newHighScoreText = this.add.text(width / 2, 310, 'NEW HIGH SCORE!', {
                fontSize: '28px',
                fontFamily: 'Arial Black, sans-serif',
                color: '#ffd700'
            }).setOrigin(0.5);

            // Pulsing animation
            this.tweens.add({
                targets: newHighScoreText,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // Particle celebration
            this.createConfetti(width, height);
        } else {
            // Show high score
            this.add.text(width / 2, 310, `Session Best: ${scoreManager.getLeaderboard()[0].score}`, {
                fontSize: '24px',
                color: '#ffd700'
            }).setOrigin(0.5);
        }

        // Buttons
        const buttonY = 420;

        // Retry button
        this.createButton(width / 2 - 130, buttonY, 'RETRY', () => {
            this.playSelectSound();
            this.cameras.main.fade(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('Game');
            });
        });

        // Menu button
        this.createButton(width / 2 + 130, buttonY, 'MENU', () => {
            this.playSelectSound();
            this.cameras.main.fade(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('MainMenu');
            });
        }, 0x4a5568);

        // Tips section
        const tips = [
            'Jump over ground obstacles',
            'Duck under flying obstacles',
            'The game speeds up over time!'
        ];

        this.add.text(width / 2, 500, 'TIP: ' + tips[Math.floor(Math.random() * tips.length)], {
            fontSize: '16px',
            color: '#718096'
        }).setOrigin(0.5);

        // Keyboard shortcuts
        this.input.keyboard.on('keydown-SPACE', () => {
            this.playSelectSound();
            this.cameras.main.fade(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('Game');
            });
        });

        this.input.keyboard.on('keydown-ENTER', () => {
            this.playSelectSound();
            this.cameras.main.fade(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('Game');
            });
        });

        this.input.keyboard.on('keydown-ESC', () => {
            this.playSelectSound();
            this.cameras.main.fade(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('MainMenu');
            });
        });

        // Fade in
        this.cameras.main.fadeIn(500);
    }

    createButton(x, y, text, callback, color = 0x4fd1c5) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-100, -25, 200, 50, 10);

        const bgHover = this.add.graphics();
        bgHover.fillStyle(color === 0x4fd1c5 ? 0x38b2ac : 0x718096, 1);
        bgHover.fillRoundedRect(-100, -25, 200, 50, 10);
        bgHover.setVisible(false);

        const btnText = this.add.text(0, 0, text, {
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            color: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([bg, bgHover, btnText]);

        const hitArea = new Phaser.Geom.Rectangle(-100, -25, 200, 50);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        container.on('pointerover', () => {
            bg.setVisible(false);
            bgHover.setVisible(true);
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });

        container.on('pointerout', () => {
            bg.setVisible(true);
            bgHover.setVisible(false);
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
                onComplete: callback
            });
        });

        return container;
    }

    createConfetti(width, height) {
        const colors = [0xffd700, 0x4fd1c5, 0xe53e3e, 0x63b3ed, 0x48bb78];

        for (let i = 0; i < 50; i++) {
            const x = Math.random() * width;
            const confetti = this.add.rectangle(
                x, -20,
                8 + Math.random() * 8,
                8 + Math.random() * 8,
                colors[Math.floor(Math.random() * colors.length)]
            );

            this.tweens.add({
                targets: confetti,
                y: height + 50,
                x: x + (Math.random() - 0.5) * 200,
                rotation: Math.random() * 10,
                duration: 2000 + Math.random() * 2000,
                delay: Math.random() * 500,
                ease: 'Sine.easeIn',
                onComplete: () => confetti.destroy()
            });
        }
    }

    playSelectSound() {
        if (window.GameState.soundEnabled) {
            try {
                this.sound.play('select', { volume: 0.5 });
            } catch (e) { }
        }
    }
}
