import Phaser from 'phaser';
import { isBrowserGamepadConfirmPressed } from '../../game/input/gamepad';
import { isWebHidConfirmPressed, shouldPreferWebHidInput } from '../../game/input/webhid';
import type { RunResult } from '../../game/simulation/gameSession';
import type { SceneBridge } from '../adapters/sceneBridge';

interface ResultSceneData {
  result: RunResult;
}

export class ResultScene extends Phaser.Scene {
  private readonly bridge: SceneBridge;
  private enterKey?: Phaser.Input.Keyboard.Key;
  private restartPressed = false;

  constructor(bridge: SceneBridge) {
    super('ResultScene');
    this.bridge = bridge;
  }

  create(data: ResultSceneData): void {
    const elapsedSeconds = (data.result.elapsedMs / 1000).toFixed(1);

    this.cameras.main.setBackgroundColor('#7ec7ff');
    this.add.tileSprite(640, 588, 1700, 290, 'hill').setTint(0x6fb857);
    this.add.image(300, 180, 'cloud').setScale(1.1);
    this.add.image(950, 150, 'cloud').setScale(0.95);
    this.add.image(180, 612, 'ground-block').setDisplaySize(360, 96);
    this.add.image(1060, 612, 'ground-block').setDisplaySize(360, 96);
    this.add.image(240, 520, 'bunny-finish-1').setScale(2.6);
    this.add.image(1040, 510, 'carrot').setScale(2.4);

    this.bridge.showOverlay({
      type: 'results',
      score: data.result.score,
      highScore: data.result.highScore,
      finishBonus: data.result.finishBonus,
      elapsedLabel: `${elapsedSeconds}s`,
    });

    if (this.input.keyboard) {
      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }
  }

  update(): void {
    const isPressed = Boolean(
      this.enterKey?.isDown ||
        (shouldPreferWebHidInput()
          ? isWebHidConfirmPressed()
          : isBrowserGamepadConfirmPressed() || isWebHidConfirmPressed()),
    );

    if (isPressed && !this.restartPressed) {
      this.restartPressed = true;
      this.bridge.showOverlay({ type: 'hidden' });
      this.scene.start('GameScene');
      return;
    }

    if (!isPressed) {
      this.restartPressed = false;
    }
  }
}
