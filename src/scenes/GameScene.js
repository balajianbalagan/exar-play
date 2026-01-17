import Player from '../game/Player.js';
import ObstacleManager from '../game/ObstacleManager.js';
import PoseService from '../services/PoseService.js';
import { themeManager } from '../managers/ThemeManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    create() {
        const { width, height } = this.scale;

        // Reset camera and world bounds (fixes drift on retry)
        this.cameras.main.setScroll(0, 0);
        this.cameras.main.setBounds(0, 0, width, height);
        this.physics.world.setBounds(0, 0, width, height);

        // Game state
        this.score = 0;
        this.gameSpeed = 300;
        this.isGameOver = false;
        this.isPaused = false;

        // Apply Theme Background Color
        this.cameras.main.setBackgroundColor(themeManager.theme.bgColor);

        // Create parallax backgrounds
        this.createBackgrounds(width, height);

        // Create ground
        this.createGround(width, height);

        // Create player
        this.player = new Player(this, 120, height - 140);

        // Create obstacle manager
        this.obstacleManager = new ObstacleManager(this);

        // Create UI
        this.createUI(width);

        // Setup controls
        this.setupControls();

        // Setup pose detection if enabled
        if (window.GameState.poseControlEnabled) {
            this.setupPoseDetection();
        }

        // Start background music
        this.startMusic();

        // Setup touch controls
        this.setupTouchControls();

        // Start spawning obstacles after a delay
        this.time.delayedCall(1500, () => {
            this.startObstacleSpawning();
        });

        // Score timer
        this.time.addEvent({
            delay: 100,
            callback: this.updateScore,
            callbackScope: this,
            loop: true
        });

        // Speed increase timer
        this.time.addEvent({
            delay: 5000,
            callback: this.increaseSpeed,
            callbackScope: this,
            loop: true
        });

        // Fade in
        this.cameras.main.fadeIn(300);
    }

    createBackgrounds(width, height) {
        const theme = themeManager.theme;

        // Far background (sky/mountains)
        this.bgFar = this.add.tileSprite(width / 2, 150, width, 300, theme.bgFar);
        this.bgFar.setScrollFactor(0);
        if (theme.bgFarTint) this.bgFar.setTint(theme.bgFarTint);

        // Mid background (city)
        this.bgMid = this.add.tileSprite(width / 2, height - 200, width, 250, theme.bgMid);
        this.bgMid.setScrollFactor(0);
        if (theme.bgMidTint) this.bgMid.setTint(theme.bgMidTint);
    }

    createGround(width, height) {
        const theme = themeManager.theme;

        // Ground sprite (tiled)
        this.ground = this.add.tileSprite(width / 2, height - 32, width, 64, theme.ground);
        this.ground.setScrollFactor(0);
        if (theme.groundTint) this.ground.setTint(theme.groundTint);

        // Ground physics body
        this.groundBody = this.physics.add.staticGroup();
        // Match physics body to visual ground (64px high, centered at height-32)
        const groundCollider = this.groundBody.create(width / 2, height - 32, null);
        groundCollider.setVisible(false);
        groundCollider.body.setSize(width, 64);
        groundCollider.refreshBody();
    }

    createUI(width) {
        const theme = themeManager.theme;

        // Score display
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontSize: '28px',
            fontFamily: 'Arial Black, sans-serif',
            color: theme.uiColor,
            stroke: theme.uiStroke,
            strokeThickness: 4
        });

        // High score display
        this.highScoreText = this.add.text(20, 55, `BEST: ${window.GameState.highScore}`, {
            fontSize: '18px',
            color: '#ffd700',
            stroke: '#000',
            strokeThickness: 2
        });

        // Speed indicator
        this.speedText = this.add.text(width - 20, 20, 'SPEED: x1.0', {
            fontSize: '18px',
            color: theme.uiColor
        }).setOrigin(1, 0);

        // Pause button
        this.pauseBtn = this.add.text(width - 20, 55, '| |', {
            fontSize: '24px',
            color: '#fff',
            backgroundColor: '#4a5568',
            padding: { x: 10, y: 5 }
        }).setOrigin(1, 0).setInteractive();

        this.pauseBtn.on('pointerdown', () => this.togglePause());
    }

    setupControls() {
        // Keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        // ESC to pause
        this.escKey.on('down', () => this.togglePause());
    }

    setupTouchControls() {
        const jumpBtn = document.getElementById('btn-jump');
        const duckBtn = document.getElementById('btn-duck');

        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!this.isGameOver && !this.isPaused) {
                    this.player.jump();
                }
            });
        }

        if (duckBtn) {
            duckBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!this.isGameOver && !this.isPaused) {
                    this.player.duck();
                }
            });

            duckBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (!this.isGameOver && !this.isPaused) {
                    this.player.standUp();
                }
            });
        }
    }

    setupPoseDetection() {
        // Use the singleton PoseService
        PoseService.startDetection(
            // onJump
            () => {
                if (!this.isGameOver && !this.isPaused) {
                    this.player.jump();
                }
            },
            // onDuck
            () => {
                if (!this.isGameOver && !this.isPaused) {
                    this.player.duck();
                }
            },
            // onStand
            () => {
                if (!this.isGameOver && !this.isPaused) {
                    this.player.standUp();
                }
            },
            // onDebug (optional)
            null
        );
    }

    startMusic() {
        if (window.GameState.musicEnabled) {
            try {
                this.music = this.sound.add('music', {
                    loop: true,
                    volume: 0.4
                });
                this.music.play();
            } catch (e) {
                console.log('Could not play music:', e);
            }
        }
    }

    startObstacleSpawning() {
        this.obstacleTimer = this.time.addEvent({
            delay: this.getObstacleDelay(),
            callback: () => {
                if (!this.isGameOver && !this.isPaused) {
                    this.obstacleManager.spawnObstacle();
                }
                // Update delay based on game speed
                this.obstacleTimer.delay = this.getObstacleDelay();
            },
            loop: true
        });
    }

    getObstacleDelay() {
        // Random delay between spawns, decreases as speed increases
        const baseDelay = 1800;
        const minDelay = 800;
        const speedFactor = this.gameSpeed / 300;
        return Math.max(minDelay, baseDelay / speedFactor) + Math.random() * 500;
    }

    updateScore() {
        if (!this.isGameOver && !this.isPaused) {
            this.score += 1;
            this.scoreText.setText(`SCORE: ${this.score}`);

            // Milestone sound every 100 points
            if (this.score % 100 === 0 && window.GameState.soundEnabled) {
                try {
                    this.sound.play('point', { volume: 0.5 });
                } catch (e) { }
            }
        }
    }

    increaseSpeed() {
        if (!this.isGameOver && !this.isPaused) {
            this.gameSpeed = Math.min(this.gameSpeed + 20, 700);
            const speedMultiplier = (this.gameSpeed / 300).toFixed(1);
            this.speedText.setText(`SPEED: x${speedMultiplier}`);
        }
    }

    update() {
        if (this.isGameOver || this.isPaused) return;

        // Handle keyboard input
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
            Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.player.jump();
        }

        if (this.cursors.down.isDown) {
            this.player.duck();
        } else if (!PoseService.isDucking) {
            this.player.standUp();
        }

        // Update parallax backgrounds
        this.bgFar.tilePositionX += this.gameSpeed * 0.001;
        this.bgMid.tilePositionX += this.gameSpeed * 0.003;
        this.ground.tilePositionX += this.gameSpeed * 0.016;

        // Update player
        this.player.update();

        // Update obstacles
        this.obstacleManager.update(this.gameSpeed);
    }

    hitObstacle() {
        if (this.isGameOver) return;

        this.isGameOver = true;

        // Stop obstacle timer
        if (this.obstacleTimer) {
            this.obstacleTimer.destroy();
        }

        // Play hit sound
        if (window.GameState.soundEnabled) {
            try {
                this.sound.play('hit', { volume: 0.6 });
            } catch (e) { }
        }

        // Stop music
        if (this.music) {
            this.music.stop();
        }

        // Player hurt animation
        this.player.hurt();

        // Screen shake
        this.cameras.main.shake(300, 0.02);

        // Flash effect
        this.cameras.main.flash(200, 255, 0, 0);

        // Stop pose detection
        if (window.GameState.poseControlEnabled) {
            PoseService.stopDetection();
        }

        // Transition to game over after delay
        this.time.delayedCall(1000, () => {
            this.cameras.main.fade(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                this.scene.start('GameOver', { score: this.score });
            });
        });
    }

    togglePause() {
        if (this.isGameOver) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.showPauseMenu();
            if (this.music) this.music.pause();
        } else {
            this.hidePauseMenu();
            if (this.music && window.GameState.musicEnabled) this.music.resume();
        }
    }

    showPauseMenu() {
        const { width, height } = this.scale;

        this.pauseOverlay = this.add.container(width / 2, height / 2);

        // Darken background
        const darkBg = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);

        // Pause text
        const pauseText = this.add.text(0, -80, 'PAUSED', {
            fontSize: '48px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#fff'
        }).setOrigin(0.5);

        // Resume button
        const resumeBtn = this.createPauseButton(0, 0, 'RESUME', () => this.togglePause());

        // Quit button
        const quitBtn = this.createPauseButton(0, 70, 'QUIT', () => {
            if (this.music) this.music.stop();
            if (this.poseDetector) this.poseDetector.stop();
            this.scene.start('MainMenu');
        });

        this.pauseOverlay.add([darkBg, pauseText, resumeBtn, quitBtn]);
    }

    createPauseButton(x, y, text, callback) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0x4fd1c5, 1);
        bg.fillRoundedRect(-100, -25, 200, 50, 10);

        const btnText = this.add.text(0, 0, text, {
            fontSize: '24px',
            color: '#1a202c',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([bg, btnText]);

        const hitArea = new Phaser.Geom.Rectangle(-100, -25, 200, 50);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        container.on('pointerdown', callback);

        return container;
    }

    hidePauseMenu() {
        if (this.pauseOverlay) {
            this.pauseOverlay.destroy();
            this.pauseOverlay = null;
        }
    }

    shutdown() {
        // Cleanup
        if (window.GameState.poseControlEnabled) {
            PoseService.stopDetection();
        }
        if (this.music) {
            this.music.stop();
        }
    }
}
