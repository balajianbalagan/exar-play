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
        this.instructions.setText('Stand still in a comfortable position...');
        this.subtext.setText('Calibrating...');

        // Visual countdown or effect could go here

        const success = await PoseService.calibrate(2000); // 2 seconds

        if (success) {
            this.instructions.setText('Great! Calibration Complete.');
            this.subtext.setText('Raise hand to PLAY or wait to redo.');

            // Allow start game via gesture
            PoseService.callbacks.onGesture = (gesture) => {
                if (gesture === 'hand-raised') {
                    PoseService.stopDetection();
                    this.scene.start('Game');
                }
            };

            // Or timeout to return to menu
            this.time.delayedCall(10000, () => {
                // If they don't gesture, maybe just stay here or reset
                this.startCalibrationFlow(); // Reset so they can try again
            });

        } else {
            this.instructions.setText('Calibration Failed.');
            this.subtext.setText('Could not see full body. Try again.');
            this.time.delayedCall(2000, () => this.startCalibrationFlow());
        }
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
