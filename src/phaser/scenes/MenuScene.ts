import Phaser from 'phaser';
import type { GameFlow } from '../../game/simulation/gameSession';
import type { SceneBridge } from '../adapters/sceneBridge';

export class MenuScene extends Phaser.Scene {
  private readonly bridge: SceneBridge;
  private readonly flow: GameFlow;
  private enterKey?: Phaser.Input.Keyboard.Key;
  private jumpKey?: Phaser.Input.Keyboard.Key;
  private startPressed = false;

  constructor(bridge: SceneBridge, flow: GameFlow) {
    super('MenuScene');
    this.bridge = bridge;
    this.flow = flow;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#7ec7ff');

    this.add.tileSprite(640, 580, 1600, 280, 'hill').setTint(0x88c070).setAlpha(0.7);
    this.add.tileSprite(640, 610, 1800, 320, 'hill').setTint(0x5ea653);
    this.add.image(240, 130, 'cloud').setScale(1.15);
    this.add.image(910, 180, 'cloud').setScale(1.1);
    this.add.image(1040, 110, 'cloud').setScale(0.85);
    this.add.image(170, 580, 'platform-block').setDisplaySize(340, 70).setTint(0x825225);
    this.add.image(170, 510, 'bunny-run-0').setScale(2.4);
    this.add.image(260, 470, 'carrot').setScale(2.1);

    this.add
      .text(84, 84, 'BUNNY\nCATCHING\nCARROTS', {
        fontFamily: '"Trebuchet MS", "Verdana", sans-serif',
        fontSize: '56px',
        color: '#fff7c6',
        stroke: '#234269',
        strokeThickness: 10,
        align: 'left',
      })
      .setLineSpacing(8);

    this.add
      .text(84, 324, 'Sprint, hop, and gobble every carrot before the finish feast.', {
        fontFamily: '"Trebuchet MS", "Verdana", sans-serif',
        fontSize: '22px',
        color: '#17345d',
        wordWrap: { width: 520 },
      });

    if (this.input.keyboard) {
      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    this.bridge.showOverlay({
      type: 'menu',
      highScore: this.flow.getHighScore(),
    });
  }

  update(): void {
    const keyboardPressed = Boolean(this.enterKey?.isDown || this.jumpKey?.isDown);
    const pad = this.input.gamepad?.getPad(0);
    const gamepadPressed = Boolean(pad?.buttons[0]?.pressed || pad?.buttons[9]?.pressed);
    const isPressed = keyboardPressed || gamepadPressed;

    if (isPressed && !this.startPressed) {
      this.startPressed = true;
      this.bridge.showOverlay({ type: 'hidden' });
      this.scene.start('GameScene');
      return;
    }

    if (!isPressed) {
      this.startPressed = false;
    }
  }
}
