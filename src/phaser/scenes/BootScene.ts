import Phaser from 'phaser';
import { createBunnyRunAnimation } from '../boot/createBunnyRunAnimation';
import { createTextures } from '../boot/createTextures';
import { generatedAssetManifest } from '../boot/generatedAssetManifest';
import type { SceneBridge } from '../adapters/sceneBridge';

export class BootScene extends Phaser.Scene {
  private readonly bridge: SceneBridge;

  constructor(bridge: SceneBridge) {
    super('BootScene');
    this.bridge = bridge;
  }

  preload(): void {
    for (const [key, assetUrl] of Object.entries(generatedAssetManifest)) {
      this.load.image(key, assetUrl);
    }
  }

  create(): void {
    createTextures(this);
    createBunnyRunAnimation(this);
    this.bridge.showOverlay({ type: 'hidden' });
    this.scene.start('MenuScene');
  }
}
