export default class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = scene.physics.add.group();

        // Obstacle types with their configurations
        this.obstacleTypes = [
            {
                key: 'obstacle_low',
                type: 'ground',
                yOffset: 20, // Distance from ground center
                width: 50,
                height: 50
            },
            {
                key: 'obstacle_spike',
                type: 'ground',
                yOffset: 30,
                width: 40,
                height: 60
            },
            {
                key: 'obstacle_wall',
                type: 'ground',
                yOffset: 40,
                width: 40,
                height: 80
            },
            {
                key: 'obstacle_high',
                type: 'air',
                yOffset: 120, // Height above ground
                width: 60,
                height: 40
            }
        ];

        // Track last obstacle type to add variety
        this.lastObstacleType = null;

        // Setup collision with player
        scene.physics.add.overlap(
            scene.player,
            this.obstacles,
            this.handleCollision,
            null,
            this
        );
    }

    spawnObstacle() {
        const { height } = this.scene.scale;

        // Choose obstacle type (avoid same type twice in a row)
        let obstacleConfig;
        do {
            obstacleConfig = Phaser.Utils.Array.GetRandom(this.obstacleTypes);
        } while (obstacleConfig === this.lastObstacleType && Math.random() > 0.3);

        this.lastObstacleType = obstacleConfig;

        console.log('Spawning obstacle:', obstacleConfig.key, obstacleConfig.type);

        // Calculate Y position
        // Ground level is at (height - 64)
        // Obstacles are positioned by their center
        // So y = (height - 64) - (height/2) + adjust?
        // No, in Phaser y is center.
        // If we want bottom of obstacle to touch top of ground (height-64).
        // CenterY = (height - 64) - (ObstacleHeight / 2).

        let y;
        if (obstacleConfig.type === 'ground') {
            // Sit exactly on the ground
            y = (height - 64) - (obstacleConfig.height / 2);
        } else {
            // Air obstacle - position above where ducking player can pass
            // Player duck height is ~50.
            // Ground is height - 64.
            // Safe zone is height - 64 - 50 = height - 114.
            // Obstacle should be around there or slightly higher?
            // Existing logic was: height - 64 - yOffset (120) = height - 184.
            y = height - 64 - obstacleConfig.yOffset;
        }

        // Create obstacle
        const obstacle = this.obstacles.create(850, y, obstacleConfig.key);

        // Physics setup
        obstacle.body.allowGravity = false;
        obstacle.body.setImmovable(true);

        // Set hitbox (slightly smaller for forgiving collisions)
        obstacle.body.setSize(
            obstacleConfig.width * 0.8,
            obstacleConfig.height * 0.8
        );

        // Store type for collision handling
        obstacle.obstacleType = obstacleConfig.type;

        // Add slight vertical movement to air obstacles
        if (obstacleConfig.type === 'air') {
            this.scene.tweens.add({
                targets: obstacle,
                y: y - 10,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        return obstacle;
    }

    update(gameSpeed) {
        // Move all obstacles and clean up off-screen ones
        this.obstacles.getChildren().forEach(obstacle => {
            // Move obstacle
            obstacle.x -= gameSpeed * 0.016;

            // Remove if off screen
            if (obstacle.x < -100) {
                obstacle.destroy();
            }
        });
    }

    handleCollision(player, obstacle) {
        // Check if we should actually collide
        // Ground obstacles: player needs to jump over
        // Air obstacles: player needs to duck under

        if (obstacle.obstacleType === 'air' && player.isDucking) {
            // Player ducked under air obstacle - no collision
            return;
        }

        // Collision detected - game over
        this.scene.hitObstacle();
    }

    clear() {
        this.obstacles.clear(true, true);
    }
}
