const config = {
  type: Phaser.AUTO,
  width: 1600,
  height: 800,
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

let player1, player2, cat, cursors;
let viewText, viewKey, photoViewerGroup, photos = [];
let photoViewerShown = false;
let heartCount = 0;
let heartIcon, heartCountText;

function preload() {
  this.load.image('bg', 'assets/images/background.png');
  this.load.image('stand', 'assets/images/stand.png');
  this.load.image('heart', 'assets/images/heart.png');

  // Debug asset loading
  this.load.on('filecomplete-image-heart', () => {
    console.log('Heart icon loaded successfully');
  });
  this.load.on('loaderror', (file) => {
    if (file.key === 'heart') {
      console.error('Failed to load heart icon:', file.src);
    }
  });

  // Load 20 photos with debug
  for (let i = 1; i < 20; i++) {
    this.load.image(`photo${i}`, `assets/images/photos/${i}.jpg`);
    this.load.on('filecomplete-image-photo' + i, () => {
      console.log(`Photo ${i} loaded successfully`);
    });
    this.load.on('loaderror', (file) => {
      if (file.key === `photo${i}`) {
        console.error(`Failed to load photo ${i}:`, file.src);
      }
    });
  }

  this.load.spritesheet('player1-walk', 'assets/images/player1-walk.png', {
    frameWidth: 24,
    frameHeight: 24
  });
  this.load.spritesheet('player2-walk', 'assets/images/player2-walk.png', {
    frameWidth: 24,
    frameHeight: 24
  });
  this.load.spritesheet('cat-walk', 'assets/images/cat-walk.png', {
    frameWidth: 32,
    frameHeight: 32
  });
}

function create() {
  const NUM_PHOTOS = 20;
  const PHOTO_SPACING = 1200;
  const totalWidth = 600 + NUM_PHOTOS * PHOTO_SPACING + 400;
  this.photoPositions = [];

  // Background
  this.bg = this.add.tileSprite(0, 0, totalWidth, 800, 'bg').setOrigin(0, 0);

  // Photo stands and photos with unique images
  for (let i = 0; i < NUM_PHOTOS; i++) {
    const x = 600 + i * PHOTO_SPACING;
    const photoKey = `photo${i + 1}`; // photo1, photo2, ..., photo20

    this.add.image(x, 200, 'stand').setScale(0.8);
    this.add.image(x, 200, photoKey).setScale(0.2);

    this.photoPositions.push({ x, y: 200, photoKey }); // Store position and photo key
  }

  // Animations
  this.anims.create({
    key: 'player1-walk',
    frames: this.anims.generateFrameNumbers('player1-walk', { start: 0, end: 3 }),
    frameRate: 8,
    repeat: -1
  });

  this.anims.create({
    key: 'player2-walk',
    frames: this.anims.generateFrameNumbers('player2-walk', { start: 0, end: 3 }),
    frameRate: 8,
    repeat: -1
  });

  this.anims.create({
    key: 'cat-walk',
    frames: this.anims.generateFrameNumbers('cat-walk', { start: 32, end: 39 }),
    frameRate: 8,
    repeat: -1
  });

  // Sprites
  player1 = this.physics.add.sprite(230, 600, 'player1-walk').setScale(3);
  player2 = this.physics.add.sprite(150, 600, 'player2-walk').setScale(3);
  cat = this.physics.add.sprite(80, 600, 'cat-walk').setScale(3);

  player1.play('player1-walk');
  player2.play('player2-walk');
  cat.play('cat-walk');

  cursors = this.input.keyboard.createCursorKeys();
  viewKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

  // Camera follow
  this.cameras.main.startFollow(player1, false);
  this.cameras.main.setBounds(0, 0, totalWidth, 800);

  // "Press E to view" text
  viewText = this.add.text(0, 0, 'Press E to view', {
    fontSize: '32px',
    fill: '#ffffff',
    backgroundColor: '#000000aa',
    padding: { x: 10, y: 5 }
  }).setVisible(false).setDepth(5).setScrollFactor(0);

  // Heart icon and count
  heartIcon = this.add.image(1300, 100, 'heart')
    .setScale(0.1)
    .setScrollFactor(0)
    .setDepth(20);
  heartCountText = this.add.text(1360, 100, heartCount.toString(), {
    fontSize: '24px',
    fill: '#ff66b2',
    padding: { x: 5, y: 2 }
  }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(20);

  // Group for photo viewer overlay
  photoViewerGroup = this.add.group();
}

function update() {
  if (photoViewerShown) return;

  player1.setVelocityX(0);
  player2.setVelocityX(0);
  cat.setVelocityX(0);

  if (cursors.left.isDown) {
    player1.setVelocityX(-350);
    player2.setVelocityX(-350);
    cat.setVelocityX(-350);

    player1.anims.play('player1-walk', true);
    player2.anims.play('player2-walk', true);
    cat.anims.play('cat-walk', true);

    player1.flipX = true;
    player2.flipX = true;
    cat.flipX = true;
  } else if (cursors.right.isDown) {
    player1.setVelocityX(350);
    player2.setVelocityX(350);
    cat.setVelocityX(350);

    player1.anims.play('player1-walk', true);
    player2.anims.play('player2-walk', true);
    cat.anims.play('cat-walk', true);

    player1.flipX = false;
    player2.flipX = false;
    cat.flipX = false;
  } else {
    player1.anims.stop();
    player2.anims.stop();
    cat.anims.stop();

    player1.setFrame(0);
    player2.setFrame(0);
    cat.setFrame(0);
  }

  // Check proximity to any photo
  let nearPhoto = false;
  let photoIndex = -1;
  let minDistance = Infinity;
  this.photoPositions.forEach((photo, index) => {
    const distance = Math.abs(player1.x - photo.x);
    if (distance < 150 && distance < minDistance) {
      console.log(`Distance to photo at x=${photo.x}: ${distance.toFixed(2)}`);
      nearPhoto = true;
      photoIndex = index; // Store the index of the nearest photo
      minDistance = distance; // Update minimum distance
    }
  });

  // Update viewText visibility and position
  if (nearPhoto) {
    viewText.setVisible(true);
    const camera = this.cameras.main;
    const screenX = player1.x - camera.scrollX - 60;
    const screenY = player1.y - camera.scrollY - 100;
    viewText.setPosition(screenX, screenY);
  } else {
    viewText.setVisible(false);
  }

  // Show viewer on E
  if (nearPhoto && Phaser.Input.Keyboard.JustDown(viewKey)) {
    console.log(`Showing photo viewer for photo index: ${photoIndex}`);
    showPhotoViewer(this, this.photoPositions, photoIndex);
  }
}

function showPhotoViewer(scene, photoPositions, photoIndex) {
  photoViewerShown = true;
  let typeWriterEvent = null; 

  const overlay = scene.add.rectangle(0, 0, 1600, 800, 0x000000, 0.7)
    .setOrigin(0).setScrollFactor(0).setDepth(10);

  // Debug photo key
  const photoKey = photoPositions[photoIndex].photoKey;
  console.log(`Loading photo with key: ${photoKey}`);
  const fullPhoto = scene.add.image(400, 400, photoKey)
    .setOrigin(0.5, 0.5).setScale(0.4).setScrollFactor(0).setDepth(11);

  // Unique captions for each photo
  const captions = [
    "«Наша первая поездка — Бурабай, лето, друзья. Солнце в лицах, ветер в волосах, а в сердце — первые страницы нашей истории.»",
    "Моё любимое фото тебя — такая красивая, искренняя, настоящая, я не мог отвести взгляд.",
    "Ты здесь просто потрясающая — красота, от которой захватывает дух.",
    "Наш поцелуй в гей-клубе — момент, полный страсти и искренних чувств.",
    "Наши обычные дни вместе — уютные вечера с фильмами и вкусной едой, наполненные теплом и радостью.",
    "Просто забавное фото, которое всегда заставляет меня улыбаться и напоминает о наших весёлых моментах вместе.",
    "Неудачное фото на фоне фейерверков, но именно оно для меня особенное и забавное.",
    "Лучшая фотка для меня",
    "Ты — тепло моего сердца на холодном снегу.",
    "100500 попыток заснять хорошую фотку",
    "Наш 100-дневный стрик в TikTok — пусть он никогда не заканчивается!",
    "Лучше поесть шашлыки в кафе",
    "Сладкий сон втроём — мы, ты и наша Айла охранница спокойствия.",
    "Айла пит",
    "Мама и дочь",
    "Желаю нам больше прогулок вместе, хоть я их и не люблю",
    "Желаю нам такой же острой любви как бульон в Хого",
    "Тууууййй жааааан",
    "Желаю тебе больше хороших воспоминаний со всеми близкими тебе людьми"
  ];
  const fullCaption = captions[photoIndex];
  const caption = scene.add.text(900, 400, '', {
    fontSize: '28px',
    color: '#ffffff',
    wordWrap: { width: 600, useAdvancedWrap: true }  // ограничиваем ширину и включаем перенос
  }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(11);


  photoViewerGroup.addMultiple([overlay, fullPhoto, caption]);

  // Increment heart count when a photo is viewed
  heartCount++;
  heartCountText.setText(heartCount.toString());
  if (heartCount === 20) {
      showSecretMessage(scene);
  }
  // Writing animation with proper context
  let currentIndex = 0;
  const typingSpeed = 75;

 function typeWriter() {
    if (currentIndex < fullCaption.length) {
      caption.setText(fullCaption.substring(0, currentIndex + 1));
      currentIndex++;
      typeWriterEvent = scene.time.delayedCall(typingSpeed, typeWriter, [], this); // 👈 store event
    }
  }

  typeWriter();

  // Close on ESC or E with proper context
  scene.input.keyboard.once('keydown-E', hidePhotoViewer.bind(this));
  scene.input.keyboard.once('keydown-ESC', hidePhotoViewer.bind(this));

  function hidePhotoViewer() {
    photoViewerShown = false;

    // Cancel typing event if still running
    if (typeWriterEvent) {
      typeWriterEvent.remove(); // 👈 safely cancel scheduled call
      typeWriterEvent = null;
    }

    photoViewerGroup.clear(true, true);
    console.log('Photo viewer closed');
  }

  function showSecretMessage(scene) {
    const secretOverlay = scene.add.rectangle(0, 0, 1600, 800, 0x111111, 0.85)
      .setOrigin(0).setScrollFactor(0).setDepth(20);

    const secretText = scene.add.text(800, 400, "Ты просмотрел все наши воспоминания, каждое фото — это часть нашей истории. Спасибо, что всегда рядом, за каждое мгновение вместе, за твоё тепло и любовь. Пусть впереди будет ещё больше счастья, улыбок и незабываемых моментов! Я люблю тебя ❤️", {
      fontSize: '36px',
      color: '#ff69b4',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 1200, useAdvancedWrap: true }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

    secretMessageGroup = scene.add.group([secretOverlay, secretText]);

    // Close secret message on ESC or E
    scene.input.keyboard.once('keydown-E', () => {
      secretMessageGroup.clear(true, true);
      secretMessageGroup = null;
    });
    scene.input.keyboard.once('keydown-ESC', () => {
      secretMessageGroup.clear(true, true);
      secretMessageGroup = null;
    });
  }
}