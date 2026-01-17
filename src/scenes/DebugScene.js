import Player from '../game/Player.js';
import PoseService from '../services/PoseService.js';

export default class DebugScene extends Phaser.Scene {
    constructor() {
        super('Debug');
    }

    create() {
        const { width, height } = this.scale;

        // Reset camera and world bounds
        this.cameras.main.setScroll(0, 0);
        this.cameras.main.setBounds(0, 0, width, height);

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x1d212d);

        // Create ground
        this.ground = this.add.tileSprite(width / 2, height - 32, width, 64, 'ground');
        this.groundBody = this.physics.add.staticGroup();
        const groundCollider = this.groundBody.create(width / 2, height - 10, null);
        groundCollider.setVisible(false);
        groundCollider.body.setSize(width, 40);
        groundCollider.refreshBody();

        // Create player
        this.player = new Player(this, 400, height - 140);

        // Title
        this.add.text(width / 2, 30, 'POSE DETECTION DEBUG', {
            fontSize: '32px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#4fd1c5'
        }).setOrigin(0.5);

        // Calibration status
        const calibStatus = PoseService.isCalibrated ? 'Calibrated' : 'Not Calibrated';
        const calibColor = PoseService.isCalibrated ? '#48bb78' : '#ed8936';
        this.add.text(width / 2, 60, `Pose: ${calibStatus}`, {
            fontSize: '14px',
            color: calibColor
        }).setOrigin(0.5);

        // Debug info panel
        this.debugPanel = this.add.container(width - 20, 100);

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x000000, 0.7);
        panelBg.fillRoundedRect(-220, -10, 220, 320, 10);
        this.debugPanel.add(panelBg);

        // Debug text elements
        this.debugTexts = {
            status: this.createDebugText(0, 'Status: Initializing...', '#ffd700'),
            calibrated: this.createDebugText(1, `Calibrated: ${PoseService.isCalibrated}`, '#fff'),
            noseY: this.createDebugText(2, 'Nose Y: ---', '#fff'),
            shoulderY: this.createDebugText(3, 'Shoulder Y: ---', '#fff'),
            standingY: this.createDebugText(4, `Standing Y: ${PoseService.calibrationData?.standingY?.toFixed(1) || '---'}`, '#888'),
            jumpingY: this.createDebugText(5, `Jumping Y: ${PoseService.calibrationData?.jumpingY?.toFixed(1) || '---'}`, '#888'),
            duckingY: this.createDebugText(6, `Ducking Y: ${PoseService.calibrationData?.duckingY?.toFixed(1) || '---'}`, '#888'),
            jumpThreshold: this.createDebugText(7, `Jump Threshold: ${PoseService.jumpThreshold?.toFixed(1) || '---'}`, '#888'),
            duckThreshold: this.createDebugText(8, `Duck Threshold: ${PoseService.duckThreshold?.toFixed(1) || '---'}`, '#888'),
            diffFromStanding: this.createDebugText(9, 'Diff from Standing: ---', '#fff'),
            state: this.createDebugText(10, 'State: ---', '#4fd1c5'),
            confidence: this.createDebugText(11, 'Confidence: ---', '#888')
        };

        // Instructions
        this.add.text(20, height - 80, 'Controls:', {
            fontSize: '18px', color: '#4fd1c5', fontStyle: 'bold'
        });
        this.add.text(20, height - 55, 'SPACE/UP = Jump | DOWN = Duck | R = Recalibrate | ESC = Back', {
            fontSize: '14px', color: '#a0aec0'
        });

        // State indicator (big text in center)
        this.stateIndicator = this.add.text(width / 2, 220, 'STAND', {
            fontSize: '72px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#4fd1c5',
            stroke: '#1a202c',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0.3);

        // Show video feed
        PoseService.showVideo();

        // Setup pose detection
        this.setupPoseDetection();

        // Setup controls
        this.setupControls();

        // Back button
        this.createButton(100, 30, 'BACK', () => {
            PoseService.stopDetection();
            this.scene.start('MainMenu');
        });

        // Recalibrate button
        this.createButton(100, 70, 'RECALIBRATE', () => {
            PoseService.clearCalibration();
            PoseService.stopDetection();
            this.scene.start('Calibration');
        });
    }

    createDebugText(index, text, color) {
        const t = this.add.text(-210, index * 25, text, {
            fontSize: '14px',
            color: color,
            fontFamily: 'monospace'
        });
        this.debugPanel.add(t);
        return t;
    }

    setupPoseDetection() {
        if (!PoseService.isModelLoaded) {
            this.debugTexts.status.setText('Status: Model not loaded');
            this.debugTexts.status.setColor('#e53e3e');
            return;
        }

        PoseService.startDetection(
            // onJump
            () => {
                this.player.jump();
                this.flashState('JUMP', '#48bb78');
            },
            // onDuck
            () => {
                this.player.duck();
                this.flashState('DUCK', '#ed8936');
            },
            // onStand
            () => {
                this.player.standUp();
                this.flashState('STAND', '#4fd1c5');
            },
            // onDebug - update display with live data
            (data) => {
                this.updateDebugDisplay(data);
            }
        );

        this.debugTexts.status.setText('Status: Running');
        this.debugTexts.status.setColor('#48bb78');
    }

    updateDebugDisplay(data) {
        if (data.noseY !== undefined) {
            this.debugTexts.noseY.setText(`Nose Y: ${data.noseY.toFixed(1)}`);
        }
        if (data.shoulderY !== undefined) {
            this.debugTexts.shoulderY.setText(`Shoulder Y: ${data.shoulderY.toFixed(1)}`);
        }

        if (data.diffFromStanding !== undefined) {
            const diff = data.diffFromStanding;
            let color = '#fff';
            if (diff < -PoseService.jumpThreshold) {
                color = '#48bb78'; // Green for jump
            } else if (diff > PoseService.duckThreshold) {
                color = '#ed8936'; // Orange for duck
            }
            this.debugTexts.diffFromStanding.setText(`Diff from Standing: ${diff.toFixed(1)}`);
            this.debugTexts.diffFromStanding.setColor(color);
        }

        if (data.state) {
            this.debugTexts.state.setText(`State: ${data.state.toUpperCase()}`);
        }

        if (data.confidence !== undefined) {
            this.debugTexts.confidence.setText(`Confidence: ${(data.confidence * 100).toFixed(0)}%`);
        }
    }

    flashState(state, color) {
        this.stateIndicator.setText(state);
        this.stateIndicator.setColor(color);
        this.stateIndicator.setAlpha(1);

        this.tweens.add({
            targets: this.stateIndicator,
            alpha: 0.3,
            duration: 500,
            ease: 'Cubic.easeOut'
        });
    }

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        this.escKey.on('down', () => {
            PoseService.stopDetection();
            this.scene.start('MainMenu');
        });

        this.rKey.on('down', () => {
            PoseService.clearCalibration();
            PoseService.stopDetection();
            this.scene.start('Calibration');
        });
    }

    update() {
        // Keyboard controls for testing
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
            Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.player.jump();
            this.flashState('JUMP (KEY)', '#48bb78');
        }

        if (this.cursors.down.isDown) {
            this.player.duck();
        } else if (!PoseService.isDucking) {
            this.player.standUp();
        }

        this.player.update();
    }

    createButton(x, y, text, callback) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0x4a5568, 1);
        bg.fillRoundedRect(-50, -15, 100, 30, 5);

        const btnText = this.add.text(0, 0, text, {
            fontSize: '14px', color: '#fff', fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([bg, btnText]);
        container.setInteractive(new Phaser.Geom.Rectangle(-50, -15, 100, 30), Phaser.Geom.Rectangle.Contains);
        container.on('pointerdown', callback);

        return container;
    }
}
