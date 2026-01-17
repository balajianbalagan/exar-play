export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');

        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Physics setup
        this.setCollideWorldBounds(true);
        this.setBounce(0);
        this.setGravityY(200);

        // Hitbox - slightly smaller than sprite for forgiving collisions
        this.body.setSize(40, 80);
        this.body.setOffset(12, 16);

        // State
        this.isDucking = false;
        this.isJumping = false;
        this.isHurt = false;

        // Store original dimensions
        this.standingHeight = 80;
        this.duckingHeight = 40;

        // Ground Y position
        this.groundY = y;

        // Jump parameters
        this.jumpVelocity = -700;
        this.jumpCooldown = false;

        // Start running animation
        this.play('run');

        // Collide with ground
        scene.physics.add.collider(this, scene.groundBody, () => {
            if (this.isJumping && this.body.onFloor()) {
                this.isJumping = false;
                if (!this.isDucking && !this.isHurt) {
                    this.play('run');
                }
            }
        });
    }

    update() {
        // Update animation based on state
        if (this.isHurt) return;

        if (!this.body.onFloor() && !this.isDucking) {
            if (this.anims.currentAnim?.key !== 'jump') {
                this.play('jump');
            }
        }
    }

    jump() {
        if (this.isHurt || this.jumpCooldown) return;

        if (this.body.onFloor()) {
            this.setVelocityY(this.jumpVelocity);
            this.isJumping = true;
            this.play('jump');

            // Play sound
            if (window.GameState.soundEnabled) {
                try {
                    this.scene.sound.play('jump', { volume: 0.5 });
                } catch (e) { }
            }

            // Small cooldown to prevent double jumps from pose detection
            this.jumpCooldown = true;
            this.scene.time.delayedCall(300, () => {
                this.jumpCooldown = false;
            });
        }
    }

    duck() {
        if (this.isHurt || this.isDucking) return;

        this.isDucking = true;

        // Change hitbox for ducking
        this.body.setSize(50, this.duckingHeight);
        this.body.setOffset(7, 56);

        // Play duck animation
        this.play('duck');

        // Play sound
        if (window.GameState.soundEnabled) {
            try {
                this.scene.sound.play('duck', { volume: 0.4 });
            } catch (e) { }
        }
    }

    standUp() {
        if (this.isHurt || !this.isDucking) return;

        this.isDucking = false;

        // Restore hitbox
        this.body.setSize(40, this.standingHeight);
        this.body.setOffset(12, 16);

        // Resume appropriate animation
        if (this.body.onFloor()) {
            this.play('run');
        } else {
            this.play('jump');
        }
    }

    hurt() {
        if (this.isHurt) return;

        this.isHurt = true;
        this.play('hurt');

        // Stop all movement
        this.setVelocity(0, 0);

        // Knockback effect
        this.setVelocityX(-200);
        this.setVelocityY(-300);

        // Flash red
        this.setTint(0xff0000);

        // Remove tint after a moment
        this.scene.time.delayedCall(200, () => {
            this.clearTint();
        });
    }

    reset() {
        this.isHurt = false;
        this.isDucking = false;
        this.isJumping = false;
        this.clearTint();
        this.body.setSize(40, this.standingHeight);
        this.body.setOffset(12, 16);
        this.play('run');
    }
}
