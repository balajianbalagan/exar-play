// Singleton Pose Detection Service
// Handles pose detection, calibration, and visualization

class PoseService {
    constructor() {
        if (PoseService.instance) {
            return PoseService.instance;
        }
        PoseService.instance = this;

        this.detector = null;
        this.video = null;
        this.canvas = null;
        this.ctx = null;

        this.isModelLoaded = false;
        this.isDetecting = false;
        this.isCalibrated = false;

        // Calibration data
        this.calibration = {
            baselineNoseY: null,     // Keep for debug/backup
            baselineShoulderY: null, // Main reference
            shoulderWidth: null,     // Reference width
            duckRatio: null,         // (DuckY - StandY) / Width
            jumpRatio: null          // (StandY - JumpY) / Width
        };

        this.jumpThresholdRatio = 0.5;
        this.duckThresholdRatio = 0.25;

        // State
        this.lastPoseState = 'stand';
        this.isDucking = false;
        this.jumpCooldown = false;
        this.gestureCooldown = false;

        // Callbacks
        this.callbacks = {
            onJump: null,
            onDuck: null,
            onStand: null,
            onDebug: null,
            onGesture: null
        };

        this.createElements();
    }

    createElements() {
        // Video element (hidden)
        this.video = document.createElement('video');
        Object.assign(this.video.style, {
            display: 'none'
        });
        this.video.setAttribute('playsinline', '');
        this.video.setAttribute('autoplay', '');
        this.video.setAttribute('muted', '');
        this.video.muted = true;
        document.body.appendChild(this.video);

        // Canvas element (visible overlay)
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.id = 'pose-overlay';

        Object.assign(this.canvas.style, {
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            width: '240px',
            height: '180px',
            borderRadius: '12px',
            border: '3px solid #4fd1c5',
            background: 'rgba(0,0,0,0.5)',
            zIndex: '10000',
            transform: 'scaleX(-1)', // Mirror
            display: 'none',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        });

        document.body.appendChild(this.canvas);
    }

    async initialize(onProgress) {
        if (this.isModelLoaded) return true;

        try {
            onProgress?.('Requesting camera...');

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
            });

            this.video.srcObject = stream;
            await new Promise((resolve, reject) => {
                this.video.onloadedmetadata = () => this.video.play().then(resolve).catch(reject);
                setTimeout(() => reject(new Error('Video timeout')), 10000);
            });

            // Set internal canvas size to match video
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            onProgress?.('Loading Model...');
            await tf.setBackend('webgl');
            await tf.ready();

            const model = poseDetection.SupportedModels.MoveNet;
            const config = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
            this.detector = await poseDetection.createDetector(model, config);

            this.isModelLoaded = true;
            onProgress?.('Ready!');

            this.loadCalibration();

            // If we have full calibration, mark as calibrated
            if (this.calibration.baselineShoulderY && this.calibration.duckRatio && this.calibration.jumpRatio) {
                this.isCalibrated = true;
            }

            return true;
        } catch (error) {
            console.error('PoseService init error:', error);
            onProgress?.(`Error: ${error.message}`);
            return false;
        }
    }

    showOverlay() {
        if (this.canvas) this.canvas.style.display = 'block';
    }

    hideOverlay() {
        if (this.canvas) this.canvas.style.display = 'none';
    }

    // Main Detection Loop
    startDetection(callbacks = {}) {
        if (!this.isModelLoaded) return;

        // Reset callbacks to ensure no lingering events (like 'onGesture' from previous scene)
        this.callbacks = {
            onJump: null,
            onDuck: null,
            onStand: null,
            onDebug: null,
            onGesture: null,
            ...callbacks
        };

        this.isDetecting = true;
        this.showOverlay();

        const loop = async () => {
            if (!this.isDetecting) return;

            try {
                const poses = await this.detector.estimatePoses(this.video, { flipHorizontal: false });

                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

                if (poses.length > 0 && poses[0].score > 0.3) {
                    const pose = poses[0];
                    const kp = this.extractKeypoints(pose);

                    if (kp) {
                        this.drawSkeleton(pose);
                        this.processPose(kp);
                    }
                }
            } catch (e) {
                console.warn(e);
            }

            requestAnimationFrame(loop);
        };
        loop();
    }

    stopDetection() {
        this.isDetecting = false;
        this.hideOverlay();
        this.lastPoseState = 'stand';
        this.isDucking = false;
    }

    extractKeypoints(pose) {
        const get = n => pose.keypoints.find(k => k.name === n);
        const nose = get('nose');
        const leftShoulder = get('left_shoulder');
        const rightShoulder = get('right_shoulder');
        const leftWrist = get('left_wrist');
        const rightWrist = get('right_wrist');

        if (!nose || !leftShoulder || !rightShoulder) return null;
        if (nose.score < 0.3 || leftShoulder.score < 0.3 || rightShoulder.score < 0.3) return null;

        return {
            nose, leftShoulder, rightShoulder,
            leftWrist, rightWrist,
            score: pose.score
        };
    }

    drawSkeleton(pose) {
        const ctx = this.ctx;

        const connections = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);

        ctx.save();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        connections.forEach(([i, j]) => {
            const kp1 = pose.keypoints[i];
            const kp2 = pose.keypoints[j];
            if (kp1.score > 0.3 && kp2.score > 0.3) {
                ctx.beginPath();
                ctx.moveTo(kp1.x, kp1.y);
                ctx.lineTo(kp2.x, kp2.y);
                ctx.stroke();
            }
        });

        pose.keypoints.forEach(kp => {
            if (kp.score > 0.3) {
                ctx.fillStyle = '#4fd1c5';
                ctx.beginPath();
                ctx.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
        ctx.restore();
    }

    processPose(kp) {
        // 1. Check Gestures
        this.checkGestures(kp);

        // 2. Gameplay
        if (this.isCalibrated) {
            this.evaluateGameplayPose(kp);
        } else {
            // Emit debug info during calibration
            this.callbacks.onDebug?.({
                noseY: kp.nose.y,
                confidence: kp.score
            });
        }
    }

    checkGestures(kp) {
        if (this.gestureCooldown) return;

        // Raise Hand: Wrist significantly above nose
        const isRightRaised = kp.rightWrist && kp.rightWrist.score > 0.4 && kp.rightWrist.y < kp.nose.y - 50;
        const isLeftRaised = kp.leftWrist && kp.leftWrist.score > 0.4 && kp.leftWrist.y < kp.nose.y - 50;

        if (isRightRaised || isLeftRaised) {
            console.log('Gesture: Hand Raised');
            this.callbacks.onGesture?.('hand-raised');
            this.gestureCooldown = true;
            setTimeout(() => this.gestureCooldown = false, 1500);
        }
    }

    evaluateGameplayPose(kp) {
        // 1. Get current shoulder stats
        const currentShoulderY = (kp.leftShoulder.y + kp.rightShoulder.y) / 2;
        const currentWidth = Math.abs(kp.leftShoulder.x - kp.rightShoulder.x);

        // 2. Calculate displacements normalized by CURRENT width
        // This makes it robust to moving closer/further
        const diffY = currentShoulderY - this.calibration.baselineShoulderY;
        const displacementRatio = diffY / currentWidth;

        // Note: Y increases downwards.
        // Jump: Moving UP -> Y decreases -> diffY is negative.
        // Duck: Moving DOWN -> Y increases -> diffY is positive.

        // 3. Compare with calibrated ratios (with 20% tolerance)
        // jumpRatio is positive (StandY - JumpY), so we check if -displacementRatio > jumpRatio * 0.8
        // duckRatio is positive (DuckY - StandY), so we check if displacementRatio > duckRatio * 0.8

        let newState = 'stand';

        if (displacementRatio > this.calibration.duckRatio * 0.8) {
            newState = 'duck';
        } else if (-displacementRatio > this.calibration.jumpRatio * 0.8) {
            newState = 'jump';
        }

        this.callbacks.onDebug?.({
            state: newState,
            ratio: displacementRatio.toFixed(3),
            width: currentWidth.toFixed(0),
            jumpThresh: -(this.calibration.jumpRatio * 0.8).toFixed(3),
            duckThresh: (this.calibration.duckRatio * 0.8).toFixed(3)
        });

        if (newState !== this.lastPoseState) {
            this.triggerState(newState);
            this.lastPoseState = newState;
        }
    }

    triggerState(state) {
        switch (state) {
            case 'jump':
                if (!this.jumpCooldown) {
                    this.callbacks.onJump?.();
                    this.jumpCooldown = true;
                    setTimeout(() => this.jumpCooldown = false, 400);
                }
                break;
            case 'duck':
                this.isDucking = true;
                this.callbacks.onDuck?.();
                break;
            case 'stand':
                if (this.isDucking) {
                    this.isDucking = false;
                    this.callbacks.onStand?.();
                }
                break;
        }
    }

    // Calibration
    // Calibration Steps

    // Step 1: Stand
    async calibrateStand(duration = 2000) {
        console.log('Calibrating Stand...');
        const samples = await this.collectSamples(duration);
        if (samples.length < 10) return false;

        this.calibration.baselineNoseY = samples.reduce((a, b) => a + b.nose.y, 0) / samples.length;

        // Calculate Baseline Shoulder Y
        const avgShoulderY = samples.reduce((a, b) =>
            a + (b.leftShoulder.y + b.rightShoulder.y) / 2, 0) / samples.length;
        this.calibration.baselineShoulderY = avgShoulderY;

        this.calibration.shoulderWidth = samples.reduce((a, b) =>
            a + Math.abs(b.leftShoulder.x - b.rightShoulder.x), 0) / samples.length;

        this.saveCalibration();
        return true;
    }

    // Step 2: Duck
    async calibrateDuck(duration = 2000) {
        console.log('Calibrating Duck...');
        const samples = await this.collectSamples(duration);
        if (samples.length < 10) return false;

        // Average shoulder Y during hold
        const avgShoulderY = samples.reduce((a, b) =>
            a + (b.leftShoulder.y + b.rightShoulder.y) / 2, 0) / samples.length;

        // Calculate Ratio: How much did we drop relative to width?
        // (DuckY - StandY) / Width
        const diff = avgShoulderY - this.calibration.baselineShoulderY;
        this.calibration.duckRatio = diff / this.calibration.shoulderWidth;

        console.log(`Calibrated Duck Ratio: ${this.calibration.duckRatio}`);
        this.saveCalibration();
        return true;
    }

    // Step 3: Jump
    async calibrateJump(duration = 2000) {
        console.log('Calibrating Jump...');
        const samples = await this.collectSamples(duration);
        if (samples.length < 5) return false;

        // Find PEAK (lowest Y) of Shoulders
        const peakY = Math.min(...samples.map(s => (s.leftShoulder.y + s.rightShoulder.y) / 2));

        // Calculate Ratio: (StandY - JumpY) / Width
        // Expect Check: StandY > JumpY (since Y decreases up)
        const diff = this.calibration.baselineShoulderY - peakY;
        this.calibration.jumpRatio = diff / this.calibration.shoulderWidth;

        console.log(`Calibrated Jump Ratio: ${this.calibration.jumpRatio}`);

        // Finalize
        this.isCalibrated = true;
        this.saveCalibration();
        return true;
    }

    async collectSamples(duration) {
        const samples = [];
        const startTime = Date.now();
        this.showOverlay();

        return new Promise(resolve => {
            const collector = setInterval(async () => {
                if (Date.now() - startTime > duration) {
                    clearInterval(collector);
                    resolve(samples);
                    return;
                }

                try {
                    const poses = await this.detector.estimatePoses(this.video);
                    if (poses.length > 0) {
                        const kp = this.extractKeypoints(poses[0]);
                        if (kp) {
                            samples.push(kp);
                            // Visual feedback
                            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                            this.drawSkeleton(poses[0]);
                        }
                    }
                } catch (e) { }
            }, 30);
        });
    }

    saveCalibration() {
        localStorage.setItem('exarplay_calib_v4', JSON.stringify(this.calibration));
    }

    loadCalibration() {
        const data = localStorage.getItem('exarplay_calib_v4');
        if (data) {
            this.calibration = JSON.parse(data);
        }
    }

    clearCalibration() {
        this.isCalibrated = false;
        this.calibration = {};
        localStorage.removeItem('exarplay_calib_v4');
    }
}

export default new PoseService();
