const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: {
    preload,
    create,
    update
  }
};

const game = new Phaser.Game(config);

let player1, player2, cursors, camera;

function preload() {
  // Load your own assets here
  this.load.image('bg', 'assets/images/background.png'); // your museum bg
  this.load.image('stand', 'assets/images/photo_stand.png'); // frame or stand
  this.load.image('photo', 'assets/images/your_photo.jpg'); // your photo
  this.load.image('you', 'assets/images/you.png');
  this.load.image('her', 'assets/images/her.png');
}

function create() {
  // Background that tiles horizontally
  const bg = this.add.tileSprite(0, 0, 1600, 600, 'bg').setOrigin(0, 0);

  // Add picture stand
  this.add.image(600, 400, 'stand').setScale(0.5);
  this.add.image(600, 360, 'photo').setScale(0.3);

  // Add characters
  player1 = this.physics.add.sprite(100, 500, 'you').setScale(0.5);
  player2 = this.physics.add.sprite(150, 500, 'her').setScale(0.5);

  // Let them move to the right slowly
  player1.setVelocityX(50);
  player2.setVelocityX(50);

  // Camera follows the characters
  this.cameras.main.startFollow(player1, true, 0.05, 0.05);
  this.cameras.main.setBounds(0, 0, 1600, 600);
}

function update() {
  // You can add logic for interaction later
}
