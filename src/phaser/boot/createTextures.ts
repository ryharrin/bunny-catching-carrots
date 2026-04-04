import type Phaser from 'phaser';

function drawBunnyFrame(
  scene: Phaser.Scene,
  key: string,
  legOffset: number,
  earOffset: number,
  mouthOpen: boolean,
): void {
  const graphics = scene.make.graphics();

  graphics.fillStyle(0x2f4c7d);
  graphics.fillRect(0, 0, 48, 64);

  graphics.fillStyle(0xffffff);
  graphics.fillRect(16, 4 + earOffset, 7, 16);
  graphics.fillRect(24, 0, 7, 20);
  graphics.fillStyle(0xffb6c1);
  graphics.fillRect(18, 7 + earOffset, 3, 9);
  graphics.fillRect(26, 3, 3, 11);

  graphics.fillStyle(0xffffff);
  graphics.fillRect(12, 18, 24, 26);
  graphics.fillRect(18, 40, 16, 12);
  graphics.fillRect(10, 28, 10, 8);
  graphics.fillRect(28, 30, 10, 8);

  graphics.fillStyle(0x1d1f33);
  graphics.fillRect(28, 22, 3, 3);

  graphics.fillStyle(0xff7b5b);
  graphics.fillRect(34, 28, mouthOpen ? 6 : 4, mouthOpen ? 4 : 2);

  graphics.fillStyle(0xe7e0d7);
  graphics.fillRect(15, 46, 18, 8);

  graphics.fillStyle(0x4b78bd);
  graphics.fillRect(15, 36, 18, 12);
  graphics.fillRect(17, 48, 6, 10);
  graphics.fillRect(25, 48, 6, 10);

  graphics.fillStyle(0xffffff);
  graphics.fillRect(18 + legOffset, 56, 8, 6);
  graphics.fillRect(28 - legOffset, 56, 8, 6);

  graphics.generateTexture(key, 48, 64);
  graphics.destroy();
}

export function createTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('bunny-run-0')) {
    return;
  }

  drawBunnyFrame(scene, 'bunny-idle-0', 0, 0, false);
  drawBunnyFrame(scene, 'bunny-run-0', -2, 1, false);
  drawBunnyFrame(scene, 'bunny-run-1', 2, -1, false);
  drawBunnyFrame(scene, 'bunny-jump-0', 0, -2, false);
  drawBunnyFrame(scene, 'bunny-finish-0', -1, 0, true);
  drawBunnyFrame(scene, 'bunny-finish-1', 1, 0, true);

  const platform = scene.make.graphics();
  platform.fillStyle(0x5c2f18);
  platform.fillRect(0, 8, 64, 24);
  platform.fillStyle(0x2fb344);
  platform.fillRect(0, 0, 64, 10);
  platform.fillStyle(0x92de64);
  platform.fillRect(6, 2, 52, 4);
  platform.generateTexture('platform-block', 64, 32);
  platform.destroy();

  const carrot = scene.make.graphics();
  carrot.fillStyle(0x2fb344);
  carrot.fillRect(14, 0, 3, 8);
  carrot.fillRect(10, 4, 12, 4);
  carrot.fillStyle(0xff8a1f);
  carrot.fillRect(9, 8, 14, 4);
  carrot.fillRect(10, 12, 12, 4);
  carrot.fillRect(11, 16, 10, 4);
  carrot.fillRect(12, 20, 8, 4);
  carrot.fillRect(13, 24, 6, 4);
  carrot.fillRect(14, 28, 4, 4);
  carrot.generateTexture('carrot', 32, 32);
  carrot.destroy();

  const hill = scene.make.graphics();
  hill.fillStyle(0x5aa75b);
  hill.fillEllipse(60, 56, 120, 110);
  hill.fillStyle(0x7ece75);
  hill.fillEllipse(52, 48, 72, 56);
  hill.generateTexture('hill', 120, 90);
  hill.destroy();

  const cloud = scene.make.graphics();
  cloud.fillStyle(0xffffff);
  cloud.fillEllipse(28, 26, 30, 20);
  cloud.fillEllipse(54, 18, 34, 26);
  cloud.fillEllipse(82, 24, 34, 22);
  cloud.fillRect(18, 24, 72, 18);
  cloud.generateTexture('cloud', 112, 56);
  cloud.destroy();

  const finish = scene.make.graphics();
  finish.fillStyle(0x8d5f2a);
  finish.fillRect(18, 0, 10, 120);
  finish.fillStyle(0xffd34d);
  finish.fillRect(28, 10, 48, 10);
  finish.fillStyle(0xff7f2a);
  finish.fillRect(28, 20, 38, 10);
  finish.fillStyle(0xffd34d);
  finish.fillRect(28, 30, 48, 10);
  finish.fillStyle(0xff7f2a);
  finish.fillRect(28, 40, 38, 10);
  finish.generateTexture('finish-flag', 96, 128);
  finish.destroy();
}
