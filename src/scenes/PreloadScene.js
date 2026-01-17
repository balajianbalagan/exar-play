import PoseService from '../services/PoseService.js';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('Preload');
    }

    preload() {
        // Create progress bar
        const progressBar = document.getElementById('loader-progress');
        const loadingText = document.getElementById('loader-text');

        this.load.on('progress', (value) => {
            if (progressBar) {
                progressBar.style.width = `${value * 100}%`;
            }
        });

        this.load.on('fileprogress', (file) => {
            if (loadingText) {
                loadingText.textContent = `Loading: ${file.key}`;
            }
        });

        // Generate audio programmatically
        this.generateAudio();
    }

    async create() {
        // Create player animations
        this.createAnimations();

        const loadingText = document.getElementById('loader-text');

        // Initialize PoseService if pose controls are enabled
        if (window.GameState.poseControlEnabled) {
            if (loadingText) loadingText.textContent = 'Initializing camera...';

            const success = await PoseService.initialize((status) => {
                if (loadingText) loadingText.textContent = status;
            });

            if (!success) {
                // Failed to initialize - disable pose controls
                window.GameState.poseControlEnabled = false;
                localStorage.setItem('exarplay_pose', 'false');
            }
        }

        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => loadingScreen.remove(), 500);
        }

        // Decide where to go next
        if (window.GameState.poseControlEnabled && PoseService.isModelLoaded) {
            if (!PoseService.isCalibrated) {
                // Need calibration
                this.scene.start('Calibration');
            } else {
                // Already calibrated
                this.scene.start('MainMenu');
            }
        } else {
            // Pose controls disabled or failed
            this.scene.start('MainMenu');
        }
    }

    generateAudio() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();

        this.cache.audio.add('jump', this.createJumpSound(audioCtx));
        this.cache.audio.add('duck', this.createDuckSound(audioCtx));
        this.cache.audio.add('hit', this.createHitSound(audioCtx));
        this.cache.audio.add('point', this.createPointSound(audioCtx));
        this.cache.audio.add('music', this.createBackgroundMusic(audioCtx));
        this.cache.audio.add('select', this.createSelectSound(audioCtx));
    }

    createJumpSound(audioCtx) {
        const sampleRate = audioCtx.sampleRate;
        const duration = 0.15;
        const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const freq = 200 + (t / duration) * 600;
            data[i] = Math.sin(2 * Math.PI * freq * t) * (1 - t / duration) * 0.5;
        }

        return buffer;
    }

    createDuckSound(audioCtx) {
        const sampleRate = audioCtx.sampleRate;
        const duration = 0.1;
        const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const freq = 400 - (t / duration) * 300;
            data[i] = Math.sin(2 * Math.PI * freq * t) * (1 - t / duration) * 0.4;
        }

        return buffer;
    }

    createHitSound(audioCtx) {
        const sampleRate = audioCtx.sampleRate;
        const duration = 0.3;
        const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1);
            const lowFreq = Math.sin(2 * Math.PI * 80 * t);
            data[i] = (noise * 0.5 + lowFreq * 0.5) * Math.exp(-t * 10) * 0.6;
        }

        return buffer;
    }

    createPointSound(audioCtx) {
        const sampleRate = audioCtx.sampleRate;
        const duration = 0.08;
        const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const freq = 880;
            data[i] = Math.sin(2 * Math.PI * freq * t) * (1 - t / duration) * 0.3;
        }

        return buffer;
    }

    createSelectSound(audioCtx) {
        const sampleRate = audioCtx.sampleRate;
        const duration = 0.1;
        const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const freq = 440 + (t / duration) * 220;
            data[i] = Math.sin(2 * Math.PI * freq * t) * (1 - t / duration) * 0.3;
        }

        return buffer;
    }

    createBackgroundMusic(audioCtx) {
        const sampleRate = audioCtx.sampleRate;
        const duration = 8;
        const buffer = audioCtx.createBuffer(2, sampleRate * duration, sampleRate);

        const leftChannel = buffer.getChannelData(0);
        const rightChannel = buffer.getChannelData(1);

        const bpm = 120;
        const beatDuration = 60 / bpm;

        const bassNotes = [110, 87.31, 130.81, 98];
        const melodyNotes = [
            [440, 523.25, 659.26],
            [349.23, 440, 523.25],
            [523.25, 659.26, 783.99],
            [392, 493.88, 587.33]
        ];

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const beatIndex = Math.floor(t / (beatDuration * 2)) % 4;
            const localT = t % (beatDuration * 2);

            const bassFreq = bassNotes[beatIndex];
            const bassEnv = Math.exp(-localT * 3);
            const bass = Math.sin(2 * Math.PI * bassFreq * t) * bassEnv * 0.15;

            const kickPhase = (t % beatDuration) / beatDuration;
            const kick = kickPhase < 0.1 ?
                Math.sin(2 * Math.PI * (150 - kickPhase * 1000) * kickPhase) * (1 - kickPhase * 10) * 0.2 : 0;

            const hihatPhase = ((t + beatDuration / 2) % beatDuration) / beatDuration;
            const hihat = hihatPhase < 0.05 ?
                (Math.random() * 2 - 1) * (1 - hihatPhase * 20) * 0.1 : 0;

            const arpIndex = Math.floor((t * 4) % 3);
            const melodyFreq = melodyNotes[beatIndex][arpIndex];
            const melodyEnv = Math.exp(-(localT % 0.25) * 8);
            const melody = Math.sin(2 * Math.PI * melodyFreq * t) * melodyEnv * 0.08;

            let pad = 0;
            for (const noteFreq of melodyNotes[beatIndex]) {
                pad += Math.sin(2 * Math.PI * (noteFreq / 2) * t) * 0.02;
            }

            const sample = bass + kick + hihat + melody + pad;
            leftChannel[i] = sample;
            rightChannel[i] = sample;
        }

        return buffer;
    }

    createAnimations() {
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: [{ key: 'player', frame: 3 }],
            frameRate: 1
        });

        this.anims.create({
            key: 'duck',
            frames: [{ key: 'player', frame: 4 }],
            frameRate: 1
        });

        this.anims.create({
            key: 'hurt',
            frames: [{ key: 'player', frame: 5 }],
            frameRate: 1
        });
    }
}
