import type Phaser from 'phaser';

export const BUNNY_RUN_ANIMATION_KEY = 'bunny-run';
export const BUNNY_RUN_FRAME_KEYS = Array.from(
  { length: 12 },
  (_, index) => `bunny-run-${index.toString().padStart(2, '0')}`,
);

function getTextureSource(scene: Phaser.Scene, key: string): CanvasImageSource {
  return scene.textures.get(key).getSourceImage() as CanvasImageSource;
}

export function createBunnyRunAnimation(scene: Phaser.Scene): void {
  if (scene.anims.exists(BUNNY_RUN_ANIMATION_KEY) && scene.textures.exists(BUNNY_RUN_FRAME_KEYS[0])) {
    return;
  }

  if (!scene.textures.exists('bunny-run-0') || !scene.textures.exists('bunny-run-1')) {
    return;
  }

  const sourceKeys = [
    'bunny-run-0',
    'bunny-run-0',
    'bunny-idle-0',
    'bunny-run-1',
    'bunny-run-1',
    'bunny-idle-0',
    'bunny-run-0',
    'bunny-run-0',
    'bunny-idle-0',
    'bunny-run-1',
    'bunny-run-1',
    'bunny-idle-0',
  ];

  const referenceImage = getTextureSource(scene, 'bunny-run-0') as { width: number; height: number };
  const frameWidth = referenceImage.width;
  const frameHeight = referenceImage.height;

  for (const [index, key] of BUNNY_RUN_FRAME_KEYS.entries()) {
    if (scene.textures.exists(key)) {
      continue;
    }

    const canvas = document.createElement('canvas');
    canvas.width = frameWidth;
    canvas.height = frameHeight;
    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    const phase = (index / BUNNY_RUN_FRAME_KEYS.length) * Math.PI * 2;
    const bobY = Math.sin(phase) * 2.8;
    const stretchX = 1 + Math.cos(phase) * 0.035;
    const stretchY = 1 - Math.cos(phase) * 0.055;
    const leanX = Math.sin(phase) * 0.05;
    const source = getTextureSource(scene, sourceKeys[index % sourceKeys.length]);

    context.clearRect(0, 0, frameWidth, frameHeight);
    context.imageSmoothingEnabled = false;
    context.save();
    context.translate(frameWidth / 2, frameHeight / 2 + bobY);
    context.transform(stretchX, 0, leanX, stretchY, 0, 0);
    context.drawImage(source, -frameWidth / 2, -frameHeight / 2);
    context.restore();

    scene.textures.addCanvas(key, canvas);
  }

  if (!scene.anims.exists(BUNNY_RUN_ANIMATION_KEY)) {
    scene.anims.create({
      key: BUNNY_RUN_ANIMATION_KEY,
      frames: BUNNY_RUN_FRAME_KEYS.map((key) => ({ key })),
      frameRate: 20,
      repeat: -1,
    });
  }
}
