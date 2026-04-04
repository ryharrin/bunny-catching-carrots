import Phaser from 'phaser';
import { createTextures } from '../boot/createTextures';
import type { SceneBridge } from '../adapters/sceneBridge';

export class BootScene extends Phaser.Scene {
  private readonly bridge: SceneBridge;

  constructor(bridge: SceneBridge) {
    super('BootScene');
    this.bridge = bridge;
  }

  create(): void {
    createTextures(this);
    this.bridge.showOverlay({ type: 'hidden' });
    this.scene.start('MenuScene');
  }
}
