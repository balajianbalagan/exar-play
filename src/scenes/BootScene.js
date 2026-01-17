export default class BootScene extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Update loading screen
        this.updateLoadingText('Initializing...');
    }

    create() {
        // Generate all placeholder graphics
        this.generatePlaceholderGraphics();

        // Move to preload scene
        this.scene.start('Preload');
    }

    updateLoadingText(text) {
        const loadingText = document.getElementById('loader-text');
        if (loadingText) {
            loadingText.textContent = text;
        }
    }

    generatePlaceholderGraphics() {
        // Generate player spritesheet (3 frames: run1, run2, duck)
        this.generatePlayerSprite();

        // Generate obstacles
        this.generateObstacles();

        // Generate ground tile
        this.generateGround();

        // Generate background layers
        this.generateBackgrounds();

        // Generate UI elements
        this.generateUIElements();
    }

    generatePlayerSprite() {
        // Player dimensions
        const frameWidth = 64;
        const frameHeight = 96;
        const numFrames = 6; // run1, run2, run3, jump, duck, hurt

        const canvas = document.createElement('canvas');
        canvas.width = frameWidth * numFrames;
        canvas.height = frameHeight;
        const ctx = canvas.getContext('2d');

        // Frame 0: Run 1
        this.drawRunnerFrame(ctx, 0, frameWidth, frameHeight, 0);

        // Frame 1: Run 2
        this.drawRunnerFrame(ctx, frameWidth, frameWidth, frameHeight, 1);

        // Frame 2: Run 3
        this.drawRunnerFrame(ctx, frameWidth * 2, frameWidth, frameHeight, 2);

        // Frame 3: Jump
        this.drawJumpFrame(ctx, frameWidth * 3, frameWidth, frameHeight);

        // Frame 4: Duck
        this.drawDuckFrame(ctx, frameWidth * 4, frameWidth, frameHeight);

        // Frame 5: Hurt
        this.drawHurtFrame(ctx, frameWidth * 5, frameWidth, frameHeight);

        // Add to texture manager
        this.textures.addSpriteSheet('player', canvas, {
            frameWidth: frameWidth,
            frameHeight: frameHeight
        });
    }

    drawRunnerFrame(ctx, x, w, h, phase) {
        const centerX = x + w / 2;
        const legOffset = phase === 0 ? 10 : (phase === 1 ? 0 : -10);

        // Body
        ctx.fillStyle = '#4fd1c5';
        ctx.fillRect(centerX - 12, 20, 24, 35);

        // Head
        ctx.fillStyle = '#63b3ed';
        ctx.beginPath();
        ctx.arc(centerX, 12, 12, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(centerX - 6, 8, 4, 4);
        ctx.fillRect(centerX + 2, 8, 4, 4);

        // Arms
        ctx.fillStyle = '#4fd1c5';
        ctx.fillRect(centerX - 18, 25, 8, 20);
        ctx.fillRect(centerX + 10, 25, 8, 20);

        // Legs
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(centerX - 10 - legOffset, 55, 10, 38);
        ctx.fillRect(centerX + legOffset, 55, 10, 38);

        // Shoes
        ctx.fillStyle = '#e53e3e';
        ctx.fillRect(centerX - 12 - legOffset, 88, 14, 6);
        ctx.fillRect(centerX + legOffset - 2, 88, 14, 6);
    }

    drawJumpFrame(ctx, x, w, h) {
        const centerX = x + w / 2;

        // Body (slightly higher)
        ctx.fillStyle = '#4fd1c5';
        ctx.fillRect(centerX - 12, 15, 24, 35);

        // Head
        ctx.fillStyle = '#63b3ed';
        ctx.beginPath();
        ctx.arc(centerX, 7, 12, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (looking up)
        ctx.fillStyle = '#fff';
        ctx.fillRect(centerX - 6, 3, 4, 4);
        ctx.fillRect(centerX + 2, 3, 4, 4);

        // Arms (raised)
        ctx.fillStyle = '#4fd1c5';
        ctx.fillRect(centerX - 22, 10, 10, 18);
        ctx.fillRect(centerX + 12, 10, 10, 18);

        // Legs (tucked)
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(centerX - 14, 50, 12, 25);
        ctx.fillRect(centerX + 2, 50, 12, 25);

        // Shoes
        ctx.fillStyle = '#e53e3e';
        ctx.fillRect(centerX - 16, 72, 14, 6);
        ctx.fillRect(centerX + 2, 72, 14, 6);
    }

    drawDuckFrame(ctx, x, w, h) {
        const centerX = x + w / 2;
        const baseY = h - 40;

        // Body (crouched)
        ctx.fillStyle = '#4fd1c5';
        ctx.fillRect(centerX - 15, baseY - 20, 30, 20);

        // Head (lowered)
        ctx.fillStyle = '#63b3ed';
        ctx.beginPath();
        ctx.arc(centerX, baseY - 28, 12, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(centerX - 6, baseY - 32, 4, 4);
        ctx.fillRect(centerX + 2, baseY - 32, 4, 4);

        // Arms (forward)
        ctx.fillStyle = '#4fd1c5';
        ctx.fillRect(centerX - 25, baseY - 15, 12, 10);
        ctx.fillRect(centerX + 13, baseY - 15, 12, 10);

        // Legs (crouched)
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(centerX - 14, baseY, 12, 15);
        ctx.fillRect(centerX + 2, baseY, 12, 15);

        // Shoes
        ctx.fillStyle = '#e53e3e';
        ctx.fillRect(centerX - 18, baseY + 12, 16, 6);
        ctx.fillRect(centerX + 2, baseY + 12, 16, 6);
    }

    drawHurtFrame(ctx, x, w, h) {
        const centerX = x + w / 2;

        // Body
        ctx.fillStyle = '#e53e3e';
        ctx.fillRect(centerX - 12, 20, 24, 35);

        // Head
        ctx.fillStyle = '#fc8181';
        ctx.beginPath();
        ctx.arc(centerX, 12, 12, 0, Math.PI * 2);
        ctx.fill();

        // X eyes
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 8, 6);
        ctx.lineTo(centerX - 2, 14);
        ctx.moveTo(centerX - 2, 6);
        ctx.lineTo(centerX - 8, 14);
        ctx.moveTo(centerX + 2, 6);
        ctx.lineTo(centerX + 8, 14);
        ctx.moveTo(centerX + 8, 6);
        ctx.lineTo(centerX + 2, 14);
        ctx.stroke();

        // Arms (thrown back)
        ctx.fillStyle = '#e53e3e';
        ctx.fillRect(centerX - 24, 20, 10, 16);
        ctx.fillRect(centerX + 14, 20, 10, 16);

        // Legs
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(centerX - 10, 55, 10, 38);
        ctx.fillRect(centerX, 55, 10, 38);

        // Shoes
        ctx.fillStyle = '#e53e3e';
        ctx.fillRect(centerX - 12, 88, 14, 6);
        ctx.fillRect(centerX - 2, 88, 14, 6);
    }

    generateObstacles() {
        // Low obstacle (jump over) - crate/box
        const lowCanvas = document.createElement('canvas');
        lowCanvas.width = 50;
        lowCanvas.height = 50;
        const lowCtx = lowCanvas.getContext('2d');

        // Crate body
        lowCtx.fillStyle = '#8B4513';
        lowCtx.fillRect(0, 0, 50, 50);
        lowCtx.fillStyle = '#A0522D';
        lowCtx.fillRect(3, 3, 44, 44);

        // Crate details
        lowCtx.strokeStyle = '#654321';
        lowCtx.lineWidth = 3;
        lowCtx.beginPath();
        lowCtx.moveTo(0, 25);
        lowCtx.lineTo(50, 25);
        lowCtx.moveTo(25, 0);
        lowCtx.lineTo(25, 50);
        lowCtx.stroke();

        // Highlights
        lowCtx.fillStyle = '#CD853F';
        lowCtx.fillRect(5, 5, 8, 8);
        lowCtx.fillRect(37, 5, 8, 8);

        this.textures.addCanvas('obstacle_low', lowCanvas);

        // High obstacle (duck under) - flying drone/bird
        const highCanvas = document.createElement('canvas');
        highCanvas.width = 60;
        highCanvas.height = 40;
        const highCtx = highCanvas.getContext('2d');

        // Drone body
        highCtx.fillStyle = '#718096';
        highCtx.beginPath();
        highCtx.ellipse(30, 22, 18, 12, 0, 0, Math.PI * 2);
        highCtx.fill();

        // Rotor arms
        highCtx.fillStyle = '#4a5568';
        highCtx.fillRect(5, 18, 50, 4);

        // Rotors
        highCtx.fillStyle = '#2d3748';
        highCtx.beginPath();
        highCtx.ellipse(8, 18, 8, 3, 0, 0, Math.PI * 2);
        highCtx.ellipse(52, 18, 8, 3, 0, 0, Math.PI * 2);
        highCtx.fill();

        // Eye/camera
        highCtx.fillStyle = '#e53e3e';
        highCtx.beginPath();
        highCtx.arc(30, 22, 5, 0, Math.PI * 2);
        highCtx.fill();

        // Light glow
        highCtx.fillStyle = '#fc8181';
        highCtx.beginPath();
        highCtx.arc(30, 22, 2, 0, Math.PI * 2);
        highCtx.fill();

        this.textures.addCanvas('obstacle_high', highCanvas);

        // Spike obstacle (must jump over, taller)
        const spikeCanvas = document.createElement('canvas');
        spikeCanvas.width = 40;
        spikeCanvas.height = 60;
        const spikeCtx = spikeCanvas.getContext('2d');

        spikeCtx.fillStyle = '#9ca3af';
        spikeCtx.beginPath();
        spikeCtx.moveTo(20, 0);
        spikeCtx.lineTo(40, 60);
        spikeCtx.lineTo(0, 60);
        spikeCtx.closePath();
        spikeCtx.fill();

        spikeCtx.fillStyle = '#d1d5db';
        spikeCtx.beginPath();
        spikeCtx.moveTo(20, 0);
        spikeCtx.lineTo(28, 60);
        spikeCtx.lineTo(12, 60);
        spikeCtx.closePath();
        spikeCtx.fill();

        this.textures.addCanvas('obstacle_spike', spikeCanvas);

        // Wall obstacle (tall, must jump)
        const wallCanvas = document.createElement('canvas');
        wallCanvas.width = 40;
        wallCanvas.height = 80;
        const wallCtx = wallCanvas.getContext('2d');

        // Bricks
        wallCtx.fillStyle = '#C45508';
        wallCtx.fillRect(0, 0, 40, 80);

        // Mortar lines
        wallCtx.fillStyle = '#E2B289';
        for(let y = 10; y < 80; y += 20) {
            wallCtx.fillRect(0, y, 40, 2);
        }
        
        this.textures.addCanvas('obstacle_wall', wallCanvas);
    }

    generateGround() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Ground fill
        ctx.fillStyle = '#3d4a5c';
        ctx.fillRect(0, 0, 64, 64);

        // Top edge (grass/surface)
        ctx.fillStyle = '#4fd1c5';
        ctx.fillRect(0, 0, 64, 8);

        // Texture details
        ctx.fillStyle = '#2d3748';
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 54 + 5;
            const y = Math.random() * 40 + 15;
            ctx.fillRect(x, y, 4, 4);
        }

        // Surface grass details
        ctx.fillStyle = '#38b2ac';
        ctx.fillRect(5, 4, 3, 6);
        ctx.fillRect(20, 2, 2, 8);
        ctx.fillRect(45, 3, 4, 7);

        this.textures.addCanvas('ground', canvas);
    }

    generateBackgrounds() {
        // Far background (mountains/sky)
        const farCanvas = document.createElement('canvas');
        farCanvas.width = 800;
        farCanvas.height = 300;
        const farCtx = farCanvas.getContext('2d');

        // Sky gradient
        const skyGrad = farCtx.createLinearGradient(0, 0, 0, 300);
        skyGrad.addColorStop(0, '#1a1a2e');
        skyGrad.addColorStop(0.5, '#16213e');
        skyGrad.addColorStop(1, '#1d212d');
        farCtx.fillStyle = skyGrad;
        farCtx.fillRect(0, 0, 800, 300);

        // Stars
        farCtx.fillStyle = '#fff';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 800;
            const y = Math.random() * 200;
            const size = Math.random() * 2 + 1;
            farCtx.beginPath();
            farCtx.arc(x, y, size, 0, Math.PI * 2);
            farCtx.fill();
        }

        // Distant mountains
        farCtx.fillStyle = '#2d3748';
        farCtx.beginPath();
        farCtx.moveTo(0, 300);
        for (let x = 0; x <= 800; x += 100) {
            const height = 100 + Math.sin(x * 0.01) * 50 + Math.random() * 30;
            farCtx.lineTo(x, 300 - height);
        }
        farCtx.lineTo(800, 300);
        farCtx.closePath();
        farCtx.fill();

        this.textures.addCanvas('bg_far', farCanvas);

        // Mid background (buildings/city)
        const midCanvas = document.createElement('canvas');
        midCanvas.width = 800;
        midCanvas.height = 250;
        const midCtx = midCanvas.getContext('2d');

        // Buildings
        midCtx.fillStyle = '#1a202c';
        for (let x = 0; x < 800; x += 60 + Math.random() * 40) {
            const height = 80 + Math.random() * 120;
            const width = 40 + Math.random() * 30;
            midCtx.fillRect(x, 250 - height, width, height);

            // Windows
            midCtx.fillStyle = '#4fd1c5';
            for (let wy = 250 - height + 10; wy < 240; wy += 20) {
                for (let wx = x + 5; wx < x + width - 10; wx += 15) {
                    if (Math.random() > 0.3) {
                        midCtx.fillRect(wx, wy, 8, 12);
                    }
                }
            }
            midCtx.fillStyle = '#1a202c';
        }

        this.textures.addCanvas('bg_mid', midCanvas);

        // Near background (foreground details)
        const nearCanvas = document.createElement('canvas');
        nearCanvas.width = 400;
        nearCanvas.height = 100;
        const nearCtx = nearCanvas.getContext('2d');

        // Fence posts
        nearCtx.fillStyle = '#4a5568';
        for (let x = 0; x < 400; x += 50) {
            nearCtx.fillRect(x, 20, 8, 80);
        }

        // Fence rail
        nearCtx.fillRect(0, 40, 400, 6);
        nearCtx.fillRect(0, 70, 400, 6);

        this.textures.addCanvas('bg_near', nearCanvas);
    }

    generateUIElements() {
        // Button background
        const btnCanvas = document.createElement('canvas');
        btnCanvas.width = 200;
        btnCanvas.height = 60;
        const btnCtx = btnCanvas.getContext('2d');

        // Rounded rectangle
        btnCtx.fillStyle = '#4fd1c5';
        this.roundRect(btnCtx, 0, 0, 200, 60, 10);
        btnCtx.fill();

        // Inner shadow
        btnCtx.fillStyle = '#38b2ac';
        this.roundRect(btnCtx, 4, 4, 192, 52, 8);
        btnCtx.fill();

        this.textures.addCanvas('button', btnCanvas);

        // Panel background
        const panelCanvas = document.createElement('canvas');
        panelCanvas.width = 400;
        panelCanvas.height = 300;
        const panelCtx = panelCanvas.getContext('2d');

        // Dark panel with border
        panelCtx.fillStyle = 'rgba(26, 32, 44, 0.95)';
        this.roundRect(panelCtx, 0, 0, 400, 300, 15);
        panelCtx.fill();

        panelCtx.strokeStyle = '#4fd1c5';
        panelCtx.lineWidth = 3;
        this.roundRect(panelCtx, 0, 0, 400, 300, 15);
        panelCtx.stroke();

        this.textures.addCanvas('panel', panelCanvas);

        // Heart icon for lives
        const heartCanvas = document.createElement('canvas');
        heartCanvas.width = 32;
        heartCanvas.height = 32;
        const heartCtx = heartCanvas.getContext('2d');

        heartCtx.fillStyle = '#e53e3e';
        heartCtx.beginPath();
        heartCtx.moveTo(16, 28);
        heartCtx.bezierCurveTo(4, 18, 4, 8, 16, 8);
        heartCtx.bezierCurveTo(28, 8, 28, 18, 16, 28);
        heartCtx.fill();

        this.textures.addCanvas('heart', heartCanvas);
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
