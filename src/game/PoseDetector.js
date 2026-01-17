export default class PoseDetector extends Phaser.Events.EventEmitter {
    constructor(scene, debugMode = false) {
        super();

        this.scene = scene;
        this.debugMode = debugMode || window.GameState?.debugMode;
        this.isRunning = false;
        this.isDucking = false;
        this.isInitialized = false;

        // Dynamic thresholds (calculated based on shoulder width)
        this.shoulderWidth = 0;
        this.jumpThresholdRatio = 0.5; // nose rises > 50% of shoulder width
        this.duckThresholdRatio = 0.2; // nose drops > 20% of shoulder width relative to shoulders

        // Baseline values
        this.baselineNoseY = null;
        this.baselineShoulderY = null;
        this.calibrationFrames = 0;
        this.calibrationSamples = [];
        this.maxCalibrationFrames = 60; // 2 seconds at 30fps

        // Cooldowns
        this.jumpCooldown = false;
        this.lastPoseState = 'stand';
        this.gestureCooldown = false;

        // Create DOM elements
        this.createElements();

        this.detector = null;
        this.init();
    }

    createElements() {
        // Video element (hidden, source for AI)
        this.video = document.createElement('video');
        this.video.setAttribute('playsinline', '');
        this.video.setAttribute('autoplay', '');
        this.video.setAttribute('muted', '');
        this.video.muted = true;
        this.video.style.display = 'none';
        document.body.appendChild(this.video);

        // Canvas element (visible overlay)
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.id = 'pose-debug-canvas';

        // Style: Bottom-left corner, mirrored
        this.canvas.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 240px;
            height: 180px;
            border-radius: 12px;
            border: 3px solid #4fd1c5;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            transform: scaleX(-1); /* Mirror effect */
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        `;

        if (window.GameState?.poseControlEnabled || this.debugMode) {
            document.body.appendChild(this.canvas);
        }
    }

    async init() {
        try {
            this.emitDebug({ status: 'Requesting camera...' });

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            });

            this.video.srcObject = stream;

            await new Promise((resolve, reject) => {
                this.video.onloadedmetadata = () => {
                    this.video.play().then(resolve).catch(reject);
                };
                setTimeout(() => reject(new Error('Video timeout')), 5000);
            });

            // Resize canvas to match video aspect ratio
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            this.emitDebug({ status: 'Loading Model...' });

            await tf.setBackend('webgl');
            await tf.ready();

            const model = poseDetection.SupportedModels.MoveNet;
            const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
            this.detector = await poseDetection.createDetector(model, detectorConfig);

            this.isInitialized = true;
            this.isRunning = true;

            this.emitDebug({ status: 'Ready' });
            console.log('Pose detection initialized');

            this.detectLoop();

        } catch (error) {
            console.error('Pose init error:', error);
            this.emit('error', error);
        }
    }

    async detectLoop() {
        if (!this.isRunning || !this.detector) return;

        try {
            const poses = await this.detector.estimatePoses(this.video, {
                flipHorizontal: false // We flip via CSS
            });

            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if (poses.length > 0) {
                const pose = poses[0];
                this.processPose(pose);
                this.drawSkeleton(pose);
            }
        } catch (e) {
            console.warn('Detection error:', e);
        }

        requestAnimationFrame(() => this.detectLoop());
    }

    processPose(pose) {
        if (pose.score < 0.25) return;

        const kp = this.getKeypoints(pose);
        if (!kp) return;

        // 1. Check for Gestures (Hands-free control)
        this.checkGestures(kp);

        // 2. Gameplay Logic (Jump/Duck)
        if (this.baselineNoseY !== null) {
            this.processGameplayMovement(kp);
        } else if (this.scene.scene.key === 'Calibration') {
            // Let calibration scene handle its own logic using events
            this.emit('pose-data', { keypoints: kp });
        }
    }

    getKeypoints(pose) {
        const get = (name) => pose.keypoints.find(k => k.name === name);

        const nose = get('nose');
        const leftShoulder = get('left_shoulder');
        const rightShoulder = get('right_shoulder');
        const leftWrist = get('left_wrist');
        const rightWrist = get('right_wrist');

        if (!nose || !leftShoulder || !rightShoulder) return null;
        if (nose.score < 0.3 || leftShoulder.score < 0.3 || rightShoulder.score < 0.3) return null;

        return { nose, leftShoulder, rightShoulder, leftWrist, rightWrist };
    }

    checkGestures(kp) {
        if (this.gestureCooldown) return;

        // "Raise Hand" Detection: Wrist is significantly above nose
        const isRightHandRaised = kp.rightWrist && kp.rightWrist.score > 0.4 && kp.rightWrist.y < kp.nose.y - 50;
        const isLeftHandRaised = kp.leftWrist && kp.leftWrist.score > 0.4 && kp.leftWrist.y < kp.nose.y - 50;

        if (isRightHandRaised || isLeftHandRaised) {
            console.log('Gesture: Hand Raised');
            this.emit('hand-raised');
            this.triggerGestureCooldown();
        }
    }

    triggerGestureCooldown() {
        this.gestureCooldown = true;
        setTimeout(() => this.gestureCooldown = false, 1500);
    }

    processGameplayMovement(kp) {
        // Calculate current metrics
        const shoulderY = (kp.leftShoulder.y + kp.rightShoulder.y) / 2;
        const currentShoulderWidth = Math.abs(kp.leftShoulder.x - kp.rightShoulder.x);

        // Update stored shoulder width (smoothly)
        this.shoulderWidth = this.shoulderWidth * 0.9 + currentShoulderWidth * 0.1;

        // Calculate deltas relative to baseline
        const noseDeltaY = kp.nose.y - this.baselineNoseY;

        // Normalized thresholds
        const jumpThresh = this.shoulderWidth * this.jumpThresholdRatio;
        const duckThresh = this.shoulderWidth * this.duckThresholdRatio;

        let newState = 'stand';

        // Duck: Nose drops (gets closer to or below baseline shoulder height)
        // Actually, let's use relative head position.
        // If nose.y increases (goes down screen) significantly.
        // Or better: Distance between Nose and Shoulder Center decreases?
        // Let's stick to simple relative Y for now.
        // If nose moves DOWN (positive Y) -> Duck
        // If nose moves UP (negative Y) -> Jump

        if (noseDeltaY > duckThresh) {
            newState = 'duck';
        } else if (noseDeltaY < -jumpThresh) {
            newState = 'jump';
        }

        if (newState !== this.lastPoseState) {
            this.handleStateChange(newState);
            this.lastPoseState = newState;
        }
    }

    handleStateChange(newState) {
        switch (newState) {
            case 'jump':
                if (!this.jumpCooldown) {
                    this.emit('jump');
                    this.jumpCooldown = true;
                    setTimeout(() => this.jumpCooldown = false, 500);
                }
                break;
            case 'duck':
                this.isDucking = true;
                this.emit('duck');
                break;
            case 'stand':
                if (this.isDucking) {
                    this.isDucking = false;
                    this.emit('stand');
                }
                break;
        }
    }

    calibrate() {
        console.log('Starting calibration...');
        this.calibrationSamples = [];
        let frames = 0;

        return new Promise((resolve) => {
            const sampler = setInterval(async () => {
                if (!this.detector || !this.video) return;

                try {
                    const poses = await this.detector.estimatePoses(this.video, { flipHorizontal: false });
                    if (poses.length > 0 && poses[0].score > 0.4) {
                        const kp = this.getKeypoints(poses[0]);
                        if (kp) {
                            this.calibrationSamples.push(kp);
                        }
                    }
                } catch (e) { }

                frames++;
                if (frames >= 30) { // ~1 second
                    clearInterval(sampler);
                    this.finishCalibration();
                    resolve();
                }
            }, 33);
        });
    }

    finishCalibration() {
        if (this.calibrationSamples.length < 10) {
            console.warn('Calibration failed: Not enough samples');
            return false;
        }

        // Average values
        const avgNoseY = this.calibrationSamples.reduce((sum, kp) => sum + kp.nose.y, 0) / this.calibrationSamples.length;
        const avgShoulderWidth = this.calibrationSamples.reduce((sum, kp) =>
            sum + Math.abs(kp.leftShoulder.x - kp.rightShoulder.x), 0) / this.calibrationSamples.length;

        this.baselineNoseY = avgNoseY;
        this.shoulderWidth = avgShoulderWidth;

        console.log(`Calibrated! Baseline NoseY: ${avgNoseY.toFixed(1)}, ShoulderWidth: ${avgShoulderWidth.toFixed(1)}`);
        this.emit('calibrated', { noseY: avgNoseY, width: avgShoulderWidth });
        return true;
    }

    drawSkeleton(pose) {
        const ctx = this.ctx;

        // Draw Keypoints
        pose.keypoints.forEach(kp => {
            if (kp.score > 0.3) {
                ctx.beginPath();
                ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = '#4fd1c5';
                ctx.fill();
            }
        });

        // Draw Skeleton Lines
        const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        adjacentPairs.forEach(([i, j]) => {
            const kp1 = pose.keypoints[i];
            const kp2 = pose.keypoints[j];

            if (kp1.score > 0.3 && kp2.score > 0.3) {
                ctx.beginPath();
                ctx.moveTo(kp1.x, kp1.y);
                ctx.lineTo(kp2.x, kp2.y);
                ctx.stroke();
            }
        });
    }

    stop() {
        this.isRunning = false;
        if (this.video && this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(t => t.stop());
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        if (this.video && this.video.parentNode) {
            this.video.parentNode.removeChild(this.video);
        }
    }
}
