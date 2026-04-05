import type Phaser from 'phaser';

type PixelRect = [x: number, y: number, width: number, height: number];

interface BunnyPose {
  legOffset: number;
  earOffset: number;
  bodyLift: number;
  armOffset: number;
  mouthOpen: boolean;
}

function fillRects(
  graphics: Phaser.GameObjects.Graphics,
  color: number,
  rects: PixelRect[],
): void {
  graphics.fillStyle(color);

  for (const [x, y, width, height] of rects) {
    graphics.fillRect(x, y, width, height);
  }
}

function drawBunnyStandingFrame(scene: Phaser.Scene, key: string, pose: BunnyPose): void {
  const graphics = scene.make.graphics();
  const outline = 0x5f5a73;
  const furLight = 0xf3eadf;
  const furMid = 0xd8cbc1;
  const furShadow = 0xbca59f;
  const earPink = 0xdba2b1;
  const shirtLight = 0xd88a63;
  const shirtShadow = 0xa76248;
  const overallLight = 0x7c93a7;
  const overallMid = 0x5d7288;
  const overallShadow = 0x45576d;
  const overallHighlight = 0xa8bdcb;
  const paw = 0xfff8f4;
  const eye = 0x302d3d;
  const cheek = 0xe7b2b0;
  const nose = 0xc88274;
  const mouth = 0x8f5f57;
  const earY = pose.earOffset;
  const bodyY = pose.bodyLift;

  fillRects(graphics, outline, [
    [15, 4 + earY, 7, 18],
    [25, 2 + earY, 7, 20],
    [14, 16 + bodyY, 20, 18],
    [12, 28 + bodyY, 24, 18],
    [11, 31 + bodyY + pose.armOffset, 6, 10],
    [31, 32 + bodyY - pose.armOffset, 6, 10],
    [14 + pose.legOffset, 45 + bodyY, 8, 14],
    [26 - pose.legOffset, 45 + bodyY, 8, 14],
    [15 + pose.legOffset, 58 + bodyY, 9, 4],
    [25 - pose.legOffset, 58 + bodyY, 9, 4],
  ]);

  fillRects(graphics, furLight, [
    [17, 5 + earY, 3, 14],
    [27, 4 + earY, 3, 15],
    [16, 18 + bodyY, 16, 13],
    [14, 30 + bodyY, 19, 12],
    [13, 32 + bodyY + pose.armOffset, 3, 6],
    [32, 33 + bodyY - pose.armOffset, 3, 6],
    [16 + pose.legOffset, 47 + bodyY, 4, 10],
    [28 - pose.legOffset, 47 + bodyY, 4, 10],
    [17 + pose.legOffset, 58 + bodyY, 6, 2],
    [27 - pose.legOffset, 58 + bodyY, 6, 2],
  ]);
  fillRects(graphics, earPink, [
    [18, 8 + earY, 1, 8],
    [28, 6 + earY, 1, 10],
  ]);
  fillRects(graphics, furMid, [
    [18, 24 + bodyY, 10, 5],
    [18, 42 + bodyY, 12, 3],
    [14, 35 + bodyY, 2, 4],
    [13, 29 + bodyY, 2, 7],
  ]);
  fillRects(graphics, furShadow, [
    [29, 18 + bodyY, 2, 12],
    [29, 46 + bodyY, 2, 10],
    [12, 46 + bodyY, 2, 8],
  ]);

  fillRects(graphics, shirtShadow, [[14, 31 + bodyY, 19, 3]]);
  fillRects(graphics, shirtLight, [
    [15, 34 + bodyY, 17, 8],
    [13, 34 + bodyY + pose.armOffset, 3, 4],
    [32, 35 + bodyY - pose.armOffset, 3, 4],
  ]);

  fillRects(graphics, overallShadow, [
    [17, 39 + bodyY, 14, 11],
    [18 + pose.legOffset, 49 + bodyY, 4, 8],
    [26 - pose.legOffset, 49 + bodyY, 4, 8],
  ]);
  fillRects(graphics, overallMid, [
    [18, 38 + bodyY, 12, 10],
    [19, 34 + bodyY, 3, 5],
    [28, 34 + bodyY, 3, 5],
    [18 + pose.legOffset, 48 + bodyY, 3, 8],
    [27 - pose.legOffset, 48 + bodyY, 3, 8],
  ]);
  fillRects(graphics, overallLight, [[19, 40 + bodyY, 9, 3]]);
  fillRects(graphics, overallHighlight, [[20, 39 + bodyY, 5, 2]]);

  fillRects(graphics, eye, [[27, 23 + bodyY, 2, 4]]);
  fillRects(graphics, 0xffffff, [[27, 23 + bodyY, 1, 1]]);
  fillRects(graphics, cheek, [[29, 28 + bodyY, 2, 2]]);
  fillRects(graphics, nose, [[31, 27 + bodyY, 3, 2]]);

  if (pose.mouthOpen) {
    fillRects(graphics, mouth, [[34, 29 + bodyY, 2, 2]]);
  }

  fillRects(graphics, paw, [
    [17 + pose.legOffset, 58 + bodyY, 5, 2],
    [27 - pose.legOffset, 58 + bodyY, 5, 2],
  ]);

  graphics.generateTexture(key, 48, 64);
  graphics.destroy();
}

function drawBunnySlideFrame(scene: Phaser.Scene, key: string): void {
  const graphics = scene.make.graphics();
  const outline = 0x5f5a73;
  const furLight = 0xf3eadf;
  const furMid = 0xd8cbc1;
  const furShadow = 0xbca59f;
  const earPink = 0xdba2b1;
  const shirtLight = 0xd88a63;
  const shirtShadow = 0xa76248;
  const overallLight = 0x7c93a7;
  const overallMid = 0x5d7288;
  const overallShadow = 0x45576d;
  const overallHighlight = 0xa8bdcb;
  const paw = 0xfff8f4;
  const eye = 0x302d3d;
  const cheek = 0xe7b2b0;
  const nose = 0xc88274;

  fillRects(graphics, outline, [
    [11, 29, 24, 12],
    [19, 18, 12, 12],
    [25, 8, 5, 13],
    [19, 11, 4, 10],
    [9, 34, 8, 8],
    [29, 34, 11, 8],
    [12, 41, 10, 8],
    [24, 40, 11, 10],
    [9, 48, 11, 5],
    [30, 49, 11, 5],
  ]);
  fillRects(graphics, furLight, [
    [13, 30, 20, 9],
    [21, 19, 8, 9],
    [26, 9, 2, 10],
    [20, 12, 2, 7],
    [10, 35, 5, 5],
    [31, 35, 7, 5],
    [13, 42, 7, 6],
    [25, 42, 7, 6],
  ]);
  fillRects(graphics, earPink, [
    [26, 11, 1, 7],
    [20, 14, 1, 5],
  ]);
  fillRects(graphics, furMid, [
    [16, 34, 11, 4],
    [15, 40, 13, 3],
    [12, 35, 2, 4],
  ]);
  fillRects(graphics, furShadow, [
    [29, 20, 1, 7],
    [31, 43, 2, 5],
    [13, 43, 1, 5],
  ]);

  fillRects(graphics, shirtShadow, [[14, 33, 14, 2]]);
  fillRects(graphics, shirtLight, [
    [15, 35, 14, 5],
    [31, 36, 3, 3],
  ]);

  fillRects(graphics, overallShadow, [
    [15, 38, 14, 8],
    [14, 43, 6, 5],
    [24, 42, 9, 6],
  ]);
  fillRects(graphics, overallMid, [
    [16, 37, 12, 8],
    [18, 33, 3, 4],
    [26, 34, 3, 4],
    [15, 43, 4, 4],
    [25, 42, 7, 5],
  ]);
  fillRects(graphics, overallLight, [[18, 39, 8, 2]]);
  fillRects(graphics, overallHighlight, [[20, 38, 4, 2]]);

  fillRects(graphics, eye, [[26, 22, 2, 3]]);
  fillRects(graphics, 0xffffff, [[26, 22, 1, 1]]);
  fillRects(graphics, cheek, [[28, 25, 2, 2]]);
  fillRects(graphics, nose, [[30, 26, 3, 2]]);
  fillRects(graphics, paw, [
    [10, 49, 8, 2],
    [31, 50, 7, 2],
  ]);
  fillRects(graphics, 0xdbe9ff, [
    [3, 51, 4, 2],
    [1, 53, 5, 2],
    [0, 55, 6, 2],
  ]);

  graphics.generateTexture(key, 48, 64);
  graphics.destroy();
}

function drawPlatformTexture(scene: Phaser.Scene): void {
  const platform = scene.make.graphics();

  fillRects(platform, 0x4e6f33, [[0, 0, 64, 2]]);
  fillRects(platform, 0x74b552, [[0, 2, 64, 6]]);
  fillRects(platform, 0xaedb78, [
    [2, 3, 8, 2],
    [14, 4, 7, 2],
    [26, 3, 9, 2],
    [40, 4, 7, 2],
    [51, 3, 10, 2],
  ]);
  fillRects(platform, 0x3e8f43, [
    [4, 7, 4, 3],
    [11, 8, 5, 2],
    [24, 7, 4, 3],
    [34, 8, 5, 2],
    [48, 7, 4, 3],
    [57, 8, 3, 2],
  ]);
  fillRects(platform, 0x84613e, [[0, 10, 64, 20]]);
  fillRects(platform, 0x5f4630, [
    [0, 10, 64, 3],
    [0, 28, 64, 4],
    [0, 12, 3, 16],
    [61, 12, 3, 16],
  ]);
  fillRects(platform, 0xaa7c4d, [
    [4, 14, 14, 5],
    [20, 15, 10, 4],
    [33, 14, 12, 5],
    [48, 15, 11, 4],
    [7, 21, 12, 5],
    [24, 22, 11, 4],
    [39, 21, 14, 5],
  ]);
  fillRects(platform, 0xd2a16a, [
    [7, 15, 4, 1],
    [23, 16, 2, 1],
    [37, 15, 4, 1],
    [51, 16, 3, 1],
    [10, 22, 3, 1],
    [28, 23, 3, 1],
    [45, 22, 4, 1],
  ]);
  fillRects(platform, 0x6b4f35, [
    [18, 13, 2, 14],
    [31, 13, 2, 14],
    [46, 13, 2, 14],
  ]);
  fillRects(platform, 0x4d3826, [[54, 18, 2, 2]]);

  platform.generateTexture('platform-block', 64, 32);
  platform.destroy();
}

function drawGroundTexture(scene: Phaser.Scene): void {
  const ground = scene.make.graphics();

  fillRects(ground, 0x4c732f, [[0, 0, 64, 2]]);
  fillRects(ground, 0x70bc4d, [[0, 2, 64, 7]]);
  fillRects(ground, 0xb8e57e, [
    [1, 3, 8, 2],
    [13, 4, 6, 2],
    [24, 3, 9, 2],
    [38, 4, 7, 2],
    [49, 3, 10, 2],
  ]);
  fillRects(ground, 0x3f9043, [
    [3, 7, 3, 4],
    [7, 8, 2, 3],
    [15, 7, 4, 4],
    [28, 8, 3, 3],
    [34, 7, 4, 4],
    [46, 8, 3, 3],
    [55, 7, 4, 4],
  ]);
  fillRects(ground, 0x80603a, [[0, 11, 64, 21]]);
  fillRects(ground, 0x685036, [[0, 11, 64, 3], [0, 29, 64, 3]]);
  fillRects(ground, 0x9f7648, [
    [3, 16, 10, 5],
    [16, 18, 7, 4],
    [26, 15, 11, 5],
    [40, 19, 8, 4],
    [51, 16, 9, 5],
    [7, 24, 12, 4],
    [23, 23, 8, 4],
    [36, 25, 11, 3],
    [50, 24, 10, 4],
  ]);
  fillRects(ground, 0xc49363, [
    [6, 17, 4, 1],
    [29, 16, 4, 1],
    [54, 17, 3, 1],
    [10, 25, 4, 1],
    [26, 24, 2, 1],
    [53, 25, 3, 1],
  ]);
  fillRects(ground, 0x5a4530, [
    [13, 15, 3, 2],
    [21, 20, 2, 2],
    [38, 17, 2, 2],
    [48, 22, 3, 2],
    [18, 26, 3, 2],
    [32, 24, 2, 2],
  ]);
  fillRects(ground, 0xb7b2a7, [
    [12, 22, 2, 2],
    [34, 21, 2, 2],
    [45, 18, 2, 2],
    [57, 23, 2, 2],
  ]);

  ground.generateTexture('ground-block', 64, 32);
  ground.destroy();
}

function drawGroundStripTexture(scene: Phaser.Scene): void {
  const ground = scene.make.graphics();

  fillRects(ground, 0x4f7c33, [[0, 0, 256, 2]]);
  fillRects(ground, 0x74bb4f, [[0, 2, 256, 7]]);
  fillRects(ground, 0xa7db6f, [
    [4, 3, 12, 2],
    [22, 4, 10, 2],
    [41, 3, 14, 2],
    [63, 4, 11, 2],
    [82, 3, 15, 2],
    [107, 4, 10, 2],
    [126, 3, 12, 2],
    [145, 4, 11, 2],
    [166, 3, 14, 2],
    [188, 4, 10, 2],
    [206, 3, 12, 2],
    [225, 4, 11, 2],
  ]);
  fillRects(ground, 0x3b9442, [
    [8, 7, 4, 4],
    [18, 8, 3, 3],
    [37, 7, 5, 4],
    [59, 8, 4, 3],
    [77, 7, 4, 4],
    [101, 8, 4, 3],
    [119, 7, 5, 4],
    [141, 8, 3, 3],
    [159, 7, 4, 4],
    [183, 8, 4, 3],
    [201, 7, 5, 4],
    [223, 8, 3, 3],
    [241, 7, 4, 4],
  ]);

  fillRects(ground, 0x825e38, [[0, 11, 256, 21]]);
  fillRects(ground, 0x6a4d30, [[0, 11, 256, 2], [0, 29, 256, 3]]);
  fillRects(ground, 0x9b7347, [
    [6, 15, 18, 5],
    [31, 18, 14, 4],
    [53, 16, 17, 5],
    [77, 20, 12, 4],
    [95, 15, 18, 5],
    [121, 19, 13, 4],
    [141, 16, 16, 5],
    [164, 20, 13, 4],
    [184, 15, 17, 5],
    [209, 19, 12, 4],
    [227, 16, 18, 5],
    [19, 24, 16, 4],
    [46, 23, 13, 4],
    [71, 25, 16, 3],
    [112, 24, 15, 4],
    [152, 23, 13, 4],
    [191, 25, 17, 3],
    [231, 24, 14, 4],
  ]);
  fillRects(ground, 0xc69361, [
    [10, 16, 5, 1],
    [58, 17, 4, 1],
    [99, 16, 5, 1],
    [145, 17, 4, 1],
    [188, 16, 5, 1],
    [233, 17, 4, 1],
    [24, 25, 4, 1],
    [77, 26, 4, 1],
    [118, 25, 4, 1],
    [196, 26, 4, 1],
  ]);
  fillRects(ground, 0x5b4330, [
    [26, 15, 4, 3],
    [89, 22, 3, 2],
    [135, 18, 3, 3],
    [176, 24, 4, 2],
    [219, 17, 3, 3],
  ]);
  fillRects(ground, 0xbcb4aa, [
    [41, 20, 2, 2],
    [124, 21, 2, 2],
    [170, 18, 2, 2],
    [247, 22, 2, 2],
  ]);

  ground.generateTexture('ground-strip', 256, 32);
  ground.destroy();
}

function drawCarrotTexture(scene: Phaser.Scene): void {
  const carrot = scene.make.graphics();

  fillRects(carrot, 0x4f9146, [
    [13, 1, 2, 6],
    [16, 0, 2, 7],
    [19, 2, 2, 5],
  ]);
  fillRects(carrot, 0x82c56a, [
    [12, 4, 3, 2],
    [16, 3, 3, 2],
    [18, 5, 3, 2],
  ]);
  fillRects(carrot, 0xa75a25, [
    [12, 7, 8, 2],
    [11, 9, 10, 4],
    [10, 13, 10, 4],
    [11, 17, 8, 4],
    [12, 21, 6, 4],
    [13, 25, 4, 4],
  ]);
  fillRects(carrot, 0xdf8940, [
    [13, 8, 6, 2],
    [12, 10, 8, 3],
    [11, 14, 8, 3],
    [12, 18, 6, 3],
    [13, 22, 4, 3],
  ]);
  fillRects(carrot, 0xf0b563, [
    [15, 9, 1, 16],
    [13, 12, 3, 1],
    [12, 16, 3, 1],
    [13, 20, 3, 1],
  ]);

  carrot.generateTexture('carrot', 32, 32);
  carrot.destroy();
}

function drawEasterEggTexture(scene: Phaser.Scene): void {
  const egg = scene.make.graphics();

  egg.fillStyle(0x77658b);
  egg.fillEllipse(16, 16, 24, 30);
  egg.fillStyle(0xf6efdf);
  egg.fillEllipse(16, 16, 20, 26);
  egg.fillStyle(0xfffbf3);
  egg.fillEllipse(13, 10, 5, 6);
  fillRects(egg, 0xd58ca9, [
    [9, 12, 5, 2],
    [13, 14, 3, 2],
    [18, 10, 3, 4],
    [20, 20, 2, 4],
  ]);
  fillRects(egg, 0x77bddd, [
    [10, 18, 12, 2],
    [12, 20, 7, 2],
  ]);
  fillRects(egg, 0xe5c166, [
    [10, 23, 4, 2],
    [15, 24, 4, 2],
    [18, 22, 3, 2],
  ]);
  fillRects(egg, 0x8cbf81, [
    [19, 14, 2, 4],
    [11, 15, 2, 2],
    [12, 25, 3, 2],
  ]);
  fillRects(egg, 0xcfbea8, [[13, 26, 7, 1]]);

  egg.generateTexture('easter-egg', 32, 32);
  egg.destroy();
}

function drawCandyTexture(scene: Phaser.Scene): void {
  const candy = scene.make.graphics();

  fillRects(candy, 0xfffaf4, [[8, 12, 16, 8]]);
  fillRects(candy, 0xe79bb3, [[10, 13, 12, 6]]);
  fillRects(candy, 0xf9d8e4, [[12, 14, 8, 2]]);
  fillRects(candy, 0x8a7098, [[5, 13, 3, 6], [24, 13, 3, 6]]);
  fillRects(candy, 0xc9acd5, [
    [3, 15, 2, 2],
    [6, 12, 2, 2],
    [27, 12, 2, 2],
    [27, 17, 2, 2],
  ]);

  candy.generateTexture('candy-piece', 32, 32);
  candy.destroy();
}

function drawCloudBandTexture(scene: Phaser.Scene): void {
  const cloud = scene.make.graphics();

  const drawCloud = (x: number, y: number, width: number, height: number): void => {
    cloud.fillStyle(0xd8ecf9);
    cloud.fillEllipse(x + width * 0.28, y + height * 0.62, width * 0.34, height * 0.28);
    cloud.fillEllipse(x + width * 0.54, y + height * 0.46, width * 0.42, height * 0.42);
    cloud.fillEllipse(x + width * 0.78, y + height * 0.6, width * 0.28, height * 0.24);
    cloud.fillRect(x + width * 0.16, y + height * 0.56, width * 0.66, height * 0.16);

    cloud.fillStyle(0xf7fbff);
    cloud.fillEllipse(x + width * 0.25, y + height * 0.54, width * 0.24, height * 0.2);
    cloud.fillEllipse(x + width * 0.52, y + height * 0.4, width * 0.32, height * 0.3);
    cloud.fillEllipse(x + width * 0.75, y + height * 0.54, width * 0.2, height * 0.18);
    cloud.fillRect(x + width * 0.22, y + height * 0.5, width * 0.52, height * 0.12);
  };

  drawCloud(12, 12, 66, 26);
  drawCloud(114, 20, 42, 18);
  drawCloud(198, 8, 74, 30);
  drawCloud(314, 16, 52, 20);
  drawCloud(398, 10, 62, 24);
  fillRects(cloud, 0xbdd9ee, [
    [37, 27, 6, 1],
    [229, 23, 8, 1],
    [425, 22, 6, 1],
  ]);

  cloud.generateTexture('cloud-band', 512, 80);
  cloud.destroy();
}

function drawHillFarTexture(scene: Phaser.Scene): void {
  const hill = scene.make.graphics();

  hill.fillStyle(0x81b882);
  hill.fillEllipse(54, 76, 92, 58);
  hill.fillEllipse(136, 62, 118, 76);
  hill.fillEllipse(222, 78, 86, 52);
  hill.fillStyle(0x9fd19a);
  hill.fillEllipse(50, 66, 46, 22);
  hill.fillEllipse(134, 52, 56, 28);
  hill.fillEllipse(216, 70, 34, 18);
  fillRects(hill, 0x6f9d73, [
    [26, 78, 16, 6],
    [96, 82, 22, 7],
    [162, 80, 18, 6],
    [212, 83, 14, 5],
  ]);

  hill.generateTexture('hill-far', 256, 96);
  hill.destroy();
}

function drawHillNearTexture(scene: Phaser.Scene): void {
  const hill = scene.make.graphics();

  hill.fillStyle(0x3e7a3c);
  hill.fillEllipse(34, 86, 78, 54);
  hill.fillEllipse(94, 74, 92, 66);
  hill.fillEllipse(166, 88, 86, 52);
  hill.fillEllipse(228, 78, 64, 44);
  hill.fillStyle(0x5ca253);
  hill.fillEllipse(30, 80, 40, 22);
  hill.fillEllipse(92, 68, 46, 26);
  hill.fillEllipse(160, 82, 38, 22);
  hill.fillEllipse(226, 72, 28, 16);
  fillRects(hill, 0x2d5a2c, [[0, 92, 256, 20]]);
  fillRects(hill, 0x4a8a45, [
    [8, 96, 36, 7],
    [56, 98, 26, 6],
    [104, 95, 32, 7],
    [150, 99, 24, 6],
    [194, 96, 28, 7],
  ]);
  fillRects(hill, 0x244524, [
    [44, 80, 8, 10],
    [126, 78, 10, 11],
    [208, 80, 9, 10],
  ]);

  hill.generateTexture('hill-near', 256, 112);
  hill.destroy();
}

function drawFinishFlagTexture(scene: Phaser.Scene): void {
  const finish = scene.make.graphics();

  fillRects(finish, 0x75553a, [[18, 4, 10, 116]]);
  fillRects(finish, 0x9b7452, [[19, 4, 3, 116]]);
  fillRects(finish, 0xd6be85, [[16, 0, 14, 6]]);
  fillRects(finish, 0xceb485, [[28, 10, 48, 40]]);
  fillRects(finish, 0xefdcb2, [
    [30, 12, 44, 10],
    [30, 24, 44, 10],
    [30, 36, 44, 10],
  ]);
  fillRects(finish, 0xd48c5d, [
    [28, 10, 4, 40],
    [44, 10, 4, 40],
    [60, 10, 4, 40],
  ]);
  fillRects(finish, 0xb36f4b, [[30, 22, 44, 2], [30, 34, 44, 2]]);

  finish.generateTexture('finish-flag', 96, 128);
  finish.destroy();
}

function drawFinishRocketTexture(scene: Phaser.Scene): void {
  const rocket = scene.make.graphics();

  fillRects(rocket, 0x6d3e32, [[48, 18, 12, 126]]);
  fillRects(rocket, 0x8f5646, [[49, 18, 4, 126]]);
  fillRects(rocket, 0xd8d8df, [
    [74, 14, 24, 116],
    [68, 26, 36, 92],
  ]);
  fillRects(rocket, 0xb9bcc8, [
    [72, 18, 6, 108],
    [92, 18, 6, 108],
    [70, 120, 32, 10],
  ]);
  fillRects(rocket, 0xf14f37, [
    [78, 8, 16, 10],
    [68, 26, 10, 26],
    [94, 26, 10, 26],
    [70, 118, 12, 22],
    [90, 118, 12, 22],
  ]);
  fillRects(rocket, 0xffd65f, [
    [80, 14, 12, 4],
    [72, 124, 8, 8],
    [92, 124, 8, 8],
  ]);
  fillRects(rocket, 0x7ad1ff, [
    [80, 38, 12, 12],
    [78, 36, 16, 16],
  ]);
  fillRects(rocket, 0xdff6ff, [[82, 40, 8, 8]]);
  fillRects(rocket, 0x3f5e8a, [[80, 38, 12, 2], [80, 48, 12, 2], [80, 40, 2, 8], [90, 40, 2, 8]]);
  fillRects(rocket, 0xc64a3c, [[76, 72, 20, 10], [80, 84, 12, 24]]);
  fillRects(rocket, 0xf1efe8, [[81, 85, 10, 20]]);
  fillRects(rocket, 0xffc947, [
    [76, 132, 20, 10],
    [80, 142, 12, 8],
    [84, 150, 4, 8],
  ]);
  fillRects(rocket, 0xff8e2b, [
    [78, 140, 16, 10],
    [82, 150, 8, 10],
    [84, 160, 4, 6],
  ]);
  fillRects(rocket, 0xfff0a0, [[82, 144, 8, 8], [84, 152, 4, 8]]);
  fillRects(rocket, 0x77b85a, [
    [16, 140, 26, 6],
    [30, 134, 18, 6],
    [102, 140, 24, 6],
    [94, 134, 18, 6],
  ]);
  fillRects(rocket, 0x4d7b35, [
    [22, 146, 16, 4],
    [108, 146, 14, 4],
  ]);
  fillRects(rocket, 0xf6d6a3, [
    [36, 144, 4, 4],
    [112, 142, 4, 4],
  ]);

  rocket.generateTexture('finish-rocket', 144, 176);
  rocket.destroy();
}

export function createTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('bunny-idle-0')) {
    drawBunnyStandingFrame(scene, 'bunny-idle-0', {
      legOffset: 0,
      earOffset: 0,
      bodyLift: 0,
      armOffset: 0,
      mouthOpen: false,
    });
  }
  if (!scene.textures.exists('bunny-run-0')) {
    drawBunnyStandingFrame(scene, 'bunny-run-0', {
      legOffset: -2,
      earOffset: 1,
      bodyLift: 0,
      armOffset: 1,
      mouthOpen: false,
    });
  }
  if (!scene.textures.exists('bunny-run-1')) {
    drawBunnyStandingFrame(scene, 'bunny-run-1', {
      legOffset: 2,
      earOffset: -1,
      bodyLift: 0,
      armOffset: -1,
      mouthOpen: false,
    });
  }
  if (!scene.textures.exists('bunny-jump-0')) {
    drawBunnyStandingFrame(scene, 'bunny-jump-0', {
      legOffset: 0,
      earOffset: -2,
      bodyLift: -2,
      armOffset: 1,
      mouthOpen: false,
    });
  }
  if (!scene.textures.exists('bunny-slide-0')) {
    drawBunnySlideFrame(scene, 'bunny-slide-0');
  }
  if (!scene.textures.exists('bunny-finish-0')) {
    drawBunnyStandingFrame(scene, 'bunny-finish-0', {
      legOffset: -1,
      earOffset: 0,
      bodyLift: -1,
      armOffset: -1,
      mouthOpen: true,
    });
  }
  if (!scene.textures.exists('bunny-finish-1')) {
    drawBunnyStandingFrame(scene, 'bunny-finish-1', {
      legOffset: 1,
      earOffset: -1,
      bodyLift: 0,
      armOffset: 1,
      mouthOpen: true,
    });
  }

  if (!scene.textures.exists('platform-block')) drawPlatformTexture(scene);
  if (!scene.textures.exists('ground-block')) drawGroundTexture(scene);
  if (!scene.textures.exists('ground-strip')) drawGroundStripTexture(scene);
  if (!scene.textures.exists('carrot')) drawCarrotTexture(scene);
  if (!scene.textures.exists('easter-egg')) drawEasterEggTexture(scene);
  if (!scene.textures.exists('candy-piece')) drawCandyTexture(scene);
  if (!scene.textures.exists('cloud-band')) drawCloudBandTexture(scene);
  if (!scene.textures.exists('hill-far')) drawHillFarTexture(scene);
  if (!scene.textures.exists('hill-near')) drawHillNearTexture(scene);
  if (!scene.textures.exists('finish-flag')) drawFinishFlagTexture(scene);
  if (!scene.textures.exists('finish-rocket')) drawFinishRocketTexture(scene);
}
