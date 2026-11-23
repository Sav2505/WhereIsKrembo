import Phaser from 'phaser';

export function makeTextures(scene: Phaser.Scene) {
  const graphics = scene.make.graphics({ x: 0, y: 0 });
  const texture = (key: string, width: number, height: number, draw: () => void) => {
    graphics.clear();
    draw();
    graphics.generateTexture(key, width, height);
  };

  texture('uri', 48, 60, () => {
    graphics.fillStyle(0x101d30, 0.3).fillEllipse(24, 55, 37, 10);
    graphics.fillStyle(0x263953).fillRoundedRect(12, 38, 10, 15, 4).fillRoundedRect(27, 38, 10, 15, 4);
    graphics.fillStyle(0xeb945c).fillRoundedRect(8, 24, 32, 24, 9);
    graphics.fillStyle(0xf6be83).fillCircle(24, 18, 14);
    graphics.fillStyle(0x263953).fillRoundedRect(10, 7, 28, 8, 4).fillCircle(18, 19, 2).fillCircle(30, 19, 2);
    graphics.lineStyle(2, 0x8e4d3e).lineBetween(20, 25, 28, 25);
    graphics.fillStyle(0xffedb5).fillCircle(40, 35, 5);
  });
  texture('hyena', 58, 48, () => {
    graphics.fillStyle(0x152335, 0.3).fillEllipse(29, 43, 48, 8);
    graphics.fillStyle(0xa78870).fillEllipse(28, 27, 37, 24).fillTriangle(6, 18, 10, 2, 21, 17).fillTriangle(30, 14, 43, 4, 43, 21);
    graphics.fillStyle(0x72594d).fillCircle(18, 25, 3).fillCircle(30, 29, 3).fillCircle(35, 20, 3);
    graphics.fillStyle(0xcab59d).fillEllipse(44, 27, 21, 17);
    graphics.fillStyle(0x27333a).fillCircle(51, 25, 3).fillCircle(42, 19, 2).fillRoundedRect(13, 34, 6, 9, 2).fillRoundedRect(36, 34, 6, 9, 2);
  });
  texture('dog', 52, 48, () => {
    graphics.fillStyle(0x152335, 0.25).fillEllipse(26, 43, 40, 8);
    graphics.fillStyle(0xf2d6a5).fillEllipse(24, 27, 34, 23).fillCircle(37, 17, 12);
    graphics.fillStyle(0x805642).fillEllipse(31, 12, 10, 16).fillEllipse(46, 13, 8, 15).fillCircle(19, 25, 5);
    graphics.fillStyle(0x333139).fillCircle(40, 17, 2).fillCircle(46, 22, 3).fillRoundedRect(11, 34, 6, 8, 2).fillRoundedRect(29, 34, 6, 8, 2);
    graphics.lineStyle(4, 0xf2d6a5).lineBetween(8, 24, 3, 15);
    graphics.lineStyle(3, 0xf17661).lineBetween(32, 27, 40, 29);
  });
  texture('neighbor', 48, 60, () => {
    graphics.fillStyle(0x152335, 0.25).fillEllipse(24, 55, 35, 9);
    graphics.fillStyle(0x9a71a5).fillRoundedRect(9, 26, 30, 25, 8);
    graphics.fillStyle(0xf0bd94).fillCircle(24, 19, 13);
    graphics.fillStyle(0xd8d1c5).fillCircle(15, 10, 8).fillCircle(26, 7, 9).fillCircle(34, 11, 8);
    graphics.fillStyle(0x303341).fillCircle(19, 20, 2).fillCircle(29, 20, 2);
  });
  texture('ball', 30, 30, () => {
    graphics.fillStyle(0xffc15e).fillCircle(15, 15, 12);
    graphics.lineStyle(3, 0xec6b5b).strokeCircle(15, 15, 9).lineBetween(5, 15, 25, 15);
  });
  texture('clue', 30, 30, () => {
    graphics.fillStyle(0xf5c867).fillRoundedRect(5, 6, 20, 20, 5);
    graphics.lineStyle(3, 0x805a42).strokeCircle(15, 15, 5).lineBetween(19, 19, 23, 23);
  });
  texture('snack', 30, 34, () => {
    graphics.fillStyle(0xec795b).fillRoundedRect(5, 4, 20, 27, 3);
    graphics.fillStyle(0xffd675).fillRect(8, 11, 14, 10);
    graphics.lineStyle(2, 0x953f40).lineBetween(8, 6, 22, 6);
  });
  graphics.destroy();
}

export function drawWorld(scene: Phaser.Scene) {
  const g = scene.add.graphics();
  g.fillStyle(0x203b49).fillRect(0, 0, 3840, 720);
  g.fillStyle(0x304b55).fillRect(0, 188, 3840, 378);
  g.fillStyle(0x3b5960).fillRect(0, 218, 3840, 15).fillRect(0, 521, 3840, 15);
  g.fillStyle(0x61716b, 0.36);
  for (let x = 0; x < 3840; x += 95) g.fillRoundedRect(x, 369, 45, 4, 2);
  g.fillStyle(0x254942).fillRect(960, 0, 960, 210).fillRect(2880, 0, 960, 210);
  g.fillStyle(0x29433f).fillRect(960, 545, 960, 175).fillRect(2880, 545, 960, 175);
  for (let x = 0; x < 3840; x += 240) {
    g.fillStyle(0x142d39, 0.45).fillRect(x + 33, 135, 174, 76);
    g.fillStyle(x > 1920 && x < 2880 ? 0x8b8b79 : 0xb9ad91).fillRoundedRect(x + 24, 12, 168, 160, 5);
    g.fillStyle(0x7d8074).fillRect(x + 24, 12, 168, 15);
    g.fillStyle(0x51616a);
    for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
      const wx = x + 43 + col * 48;
      const wy = 40 + row * 54;
      g.fillRoundedRect(wx, wy, 29, 32, 2);
      if ((x / 240 + row + col) % 3 !== 0) g.fillStyle(0xf6cf81, 0.8).fillRect(wx + 4, wy + 4, 21, 24).fillStyle(0x51616a);
      g.lineStyle(2, 0x718078).lineBetween(wx + 14, wy + 3, wx + 14, wy + 29);
    }
    g.fillStyle(0x303e48).fillRoundedRect(x + 91, 126, 35, 46, 2);
    g.fillStyle(0xe4c89e).fillRect(x + 29, 170, 158, 6);
  }
  for (let x = 160; x < 3840; x += 460) {
    g.fillStyle(0xffdc87, 0.07).fillCircle(x, 230, 115);
    g.fillStyle(0xffdc87, 0.08).fillCircle(x, 230, 70);
    g.fillStyle(0x263c43).fillRoundedRect(x - 3, 155, 6, 83, 3);
    g.fillStyle(0xffe6a1).fillCircle(x, 158, 8);
    g.fillStyle(0xfff4ce, 0.9).fillCircle(x, 158, 4);
  }
  for (let x = 70; x < 3840; x += 180) {
    g.fillStyle(0x1b3438, 0.5).fillEllipse(x, 660, 120, 35);
    g.fillStyle(0x3b6b5a).fillCircle(x, 625, 35).fillCircle(x + 25, 637, 25).fillCircle(x - 28, 640, 24);
    g.fillStyle(0x50826b).fillCircle(x - 8, 617, 19).fillCircle(x + 20, 630, 13);
  }
  g.lineStyle(3, 0xf4d093, 0.45);
  for (let x = 470; x < 3000; x += 90) {
    g.strokeEllipse(x, 460 + Math.sin(x) * 12, 8, 11);
    g.strokeEllipse(x + 12, 450 + Math.sin(x) * 12, 6, 8);
  }
  g.setDepth(-10);
}