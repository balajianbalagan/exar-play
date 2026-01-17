import PoseService from '../services/PoseService.js';

export default class CalibrationScene extends Phaser.Scene {
    constructor() {
        super('Calibration');
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(0, 0, width, height, 0x1a202c).setOrigin(0);

        // Title
        this.add.text(width / 2, 50, 'CALIBRATION', {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            color: '#4fd1c5'
        }).setOrigin(0.5);

        // Instructions Text
        this.instructions = this.add.text(width / 2, 120, 'Initializing Camera...', {
            fontSize: '24px',
            color: '#fff',
            align: 'center',
            wordWrap: { width: width - 100 }
        }).setOrigin(0.5);

        // Status / Subtext
        this.subtext = this.add.text(width / 2, height - 80, '', {
            fontSize: '18px',
            color: '#a0aec0'
        }).setOrigin(0.5);

        // Back Button
        this.createButton(width - 40, 40, 'X', () => this.scene.start('MainMenu'));

        // Start Pose Service if not ready
        this.initPose();
    }

    async initPose() {
        this.instructions.setText('Starting Camera...');

        const success = await PoseService.initialize((status) => {
            this.subtext.setText(status);
        });

        if (success) {
            this.startCalibrationFlow();
        } else {
            this.instructions.setText('Camera Failed. Check permissions.');
        }
    }

    startCalibrationFlow() {
        // Step 1: Visibility Check
        this.instructions.setText('Step back until you see your skeleton.\nRaise your hand to start.');
        this.subtext.setText('Waiting for gesture...');

        PoseService.startDetection({
            onGesture: (gesture) => {
                if (gesture === 'hand-raised') {
                    this.runCalibration();
                }
            },
            onDebug: (data) => {
                // Could update a confidence meter here
            }
        });
    }

    async runCalibration() {
        // Step 1: Stand
        this.instructions.setText('Step 1: Stand Still');
        this.subtext.setText('Calibrating center...');
        await this.wait(2000); // Give them time to read

        const standSuccess = await PoseService.calibrateStand(2000);
        if (!standSuccess) {
            this.handleFailure('Could not detect standing pose.');
            return;
        }

        // Step 2: Duck
        this.instructions.setText('Step 2: DUCK DOWN\nand hold it');
        this.subtext.setText('Get ready...');
        await this.wait(2000);

        this.subtext.setText('Calibrating duck...');
        const duckSuccess = await PoseService.calibrateDuck(2000);
        if (!duckSuccess) {
            this.handleFailure('Could not detect ducking pose.');
            return;
        }

        // Step 3: Jump
        this.instructions.setText('Step 3: JUMP UP HIGH!\n(Do it when you see "Calibrating")');
        this.subtext.setText('Get ready...');
        await this.wait(2000);

        this.subtext.setText('Calibrating jump... JUMP NOW!');
        const jumpSuccess = await PoseService.calibrateJump(1500); // Shorter window for jump
        if (!jumpSuccess) {
            this.handleFailure('Could not detect jump.');
            return;
        }

        // Success
        this.instructions.setText('Calibration Complete!');
        this.subtext.setText('Raise hand to PLAY.');

        // Allow start game via gesture
        PoseService.callbacks.onGesture = (gesture) => {
            if (gesture === 'hand-raised') {
                PoseService.stopDetection();
                this.scene.start('Game');
            }
        };
    }

    handleFailure(msg) {
        this.instructions.setText('Calibration Failed');
        this.subtext.setText(msg + ' Retrying...');
        this.time.delayedCall(3000, () => this.startCalibrationFlow());
    }

    wait(ms) {
        return new Promise(resolve => this.time.delayedCall(ms, resolve));
    }

    createButton(x, y, text, callback) {
        const btn = this.add.text(x, y, text, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#fff',
            backgroundColor: '#e53e3e',
            padding: { x: 15, y: 10 }
        }).setOrigin(0.5).setInteractive();

        btn.on('pointerdown', callback);
        return btn;
    }

    shutdown() {
        PoseService.stopDetection();
    }
}
