import Phaser from 'phaser';
import {
  InputFrameTracker,
  getGamepadActionState,
  getKeyboardActionState,
  mergeActionStates,
  type GamepadSnapshot,
  type KeyboardSnapshot,
} from '../../game/input/bindings';
import type { GameFlow, GameSession } from '../../game/simulation/gameSession';
import type { RunResult } from '../../game/simulation/gameSession';
import type { SurfaceSegment } from '../../game/simulation/generateLevel';
import type { SceneBridge } from '../adapters/sceneBridge';

const PLAYER_SPEED = 235;
const PLAYER_JUMP_VELOCITY = -560;
const RESULT_DELAY_MS = 1250;

interface CarrotSprite extends Phaser.Physics.Arcade.Sprite {
  carrotId: string;
}

export class GameScene extends Phaser.Scene {
  private readonly bridge: SceneBridge;
  private readonly flow: GameFlow;
  private session!: GameSession;
  private player!: Phaser.Physics.Arcade.Sprite;
  private carrots = new Map<string, CarrotSprite>();
  private inputTracker = new InputFrameTracker();
  private resultAt: number | null = null;
  private pauseOverlayVisible = false;
  private result?: RunResult;
  private keyboard?: {
    left: Phaser.Input.Keyboard.Key;
    leftAlt: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    rightAlt: Phaser.Input.Keyboard.Key;
    jump: Phaser.Input.Keyboard.Key;
    jumpAlt: Phaser.Input.Keyboard.Key;
    jumpAltTwo: Phaser.Input.Keyboard.Key;
    jumpAltThree: Phaser.Input.Keyboard.Key;
    pause: Phaser.Input.Keyboard.Key;
  };
  private hillBack?: Phaser.GameObjects.TileSprite;
  private hillFront?: Phaser.GameObjects.TileSprite;
  private cloudBand?: Phaser.GameObjects.TileSprite;

  constructor(bridge: SceneBridge, flow: GameFlow) {
    super('GameScene');
    this.bridge = bridge;
    this.flow = flow;
  }

  create(): void {
    this.session = this.flow.createSession();
    this.inputTracker = new InputFrameTracker();
    this.resultAt = null;
    this.result = undefined;
    this.pauseOverlayVisible = false;
    this.carrots.clear();

    const { width, height, groundSegments, platforms, carrots, spawn, finishX, paletteIndex } =
      this.session.level;

    this.physics.world.setBounds(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setBackgroundColor('#7ec7ff');

    this.cloudBand = this.add.tileSprite(0, 110, width, 180, 'cloud').setOrigin(0, 0.5);
    this.cloudBand.setTileScale(0.85, 0.85).setAlpha(0.9);
    this.hillBack = this.add.tileSprite(0, 440, width, 140, 'hill').setOrigin(0, 0.5);
    this.hillBack.setTileScale(0.8, 0.9).setTint(0x6ec36a, 0x6ec36a, 0x84d87b, 0x84d87b);
    this.hillFront = this.add.tileSprite(0, 520, width, 180, 'hill').setOrigin(0, 0.5);
    this.hillFront.setTileScale(1, 1).setTint(0x4fa04b, 0x4fa04b, 0x64bf53, 0x64bf53);

    if (paletteIndex === 1) {
      this.cameras.main.setBackgroundColor('#88d1ff');
      this.hillBack.setTint(0x66b56d, 0x66b56d, 0x87d27a, 0x87d27a);
      this.hillFront.setTint(0x4b9a4b, 0x4b9a4b, 0x71c65d, 0x71c65d);
    }

    if (paletteIndex === 2) {
      this.cameras.main.setBackgroundColor('#91d6ff');
      this.hillBack.setTint(0x70bd7c, 0x70bd7c, 0x98db8c, 0x98db8c);
      this.hillFront.setTint(0x4b9650, 0x4b9650, 0x66bf5e, 0x66bf5e);
    }

    const groundGroup = this.physics.add.staticGroup();
    const platformGroup = this.physics.add.staticGroup();

    for (const segment of groundSegments) {
      this.createSurfaceTiles(groundGroup, segment);
    }

    for (const platform of platforms) {
      this.createSurfaceSprite(platformGroup, platform);
    }

    this.player = this.physics.add.sprite(spawn.x, spawn.y, 'bunny-idle-0');
    this.player.setScale(1.7);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(26, 42);
    this.player.setOffset(12, 20);
    this.player.setDepth(4);

    this.physics.add.collider(this.player, groundGroup);
    this.physics.add.collider(this.player, platformGroup);

    for (const carrot of carrots) {
      const carrotSprite = this.physics.add.sprite(carrot.x, carrot.y, 'carrot') as CarrotSprite;
      carrotSprite.carrotId = carrot.id;
      const carrotBody = carrotSprite.body as Phaser.Physics.Arcade.Body;
      carrotBody.setAllowGravity(false);
      carrotSprite.setImmovable(true);
      carrotSprite.setScale(1.3);
      carrotSprite.setDepth(3);
      this.tweens.add({
        targets: carrotSprite,
        y: carrot.y - 8,
        duration: 780,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.carrots.set(carrot.id, carrotSprite);
    }

    const finishLine = this.physics.add.staticSprite(finishX, this.session.level.groundTop, 'finish-flag');
    finishLine.setOrigin(0.5, 1);
    finishLine.setDepth(2);

    this.physics.add.overlap(this.player, finishLine, () => {
      this.handleFinish();
    });

    for (const carrotSprite of this.carrots.values()) {
      this.physics.add.overlap(this.player, carrotSprite, () => {
        this.collectCarrot(carrotSprite);
      });
    }

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setLerp(0.12, 0.12);
    this.cameras.main.setDeadzone(180, 120);

    if (this.input.keyboard) {
      this.keyboard = {
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        leftAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        rightAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        jump: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        jumpAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        jumpAltTwo: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        jumpAltThree: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
        pause: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      };
    }

    this.bridge.showOverlay({ type: 'hidden' });
    this.publishHud();
  }

  update(_time: number, delta: number): void {
    if (this.pauseOverlayVisible) {
      const pauseFrame = this.inputTracker.next(
        mergeActionStates(this.getKeyboardState(), this.getGamepadState()),
      );
      if (pauseFrame.pausePressed) {
        this.togglePause();
      }
      return;
    }

    if (this.resultAt !== null) {
      this.player.setVelocityX(0);
      this.player.setTexture(Math.floor(this.time.now / 180) % 2 === 0 ? 'bunny-finish-0' : 'bunny-finish-1');
      if (this.time.now >= this.resultAt && this.result) {
        this.scene.start('ResultScene', { result: this.result });
      }
      return;
    }

    const inputFrame = this.inputTracker.next(
      mergeActionStates(this.getKeyboardState(), this.getGamepadState()),
    );

    if (inputFrame.pausePressed) {
      this.togglePause();
      return;
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const move = Phaser.Math.Clamp(inputFrame.move, -1, 1);
    this.player.setVelocityX(move * PLAYER_SPEED);

    if (move !== 0) {
      this.player.setFlipX(move < 0);
    }

    if (inputFrame.jumpPressed && (body.blocked.down || body.touching.down)) {
      this.player.setVelocityY(PLAYER_JUMP_VELOCITY);
    }

    this.session.tick(delta);
    this.animatePlayer();
    this.scrollBackground();
    this.publishHud();
  }

  private createSurfaceTiles(
    group: Phaser.Physics.Arcade.StaticGroup,
    segment: SurfaceSegment,
  ): void {
    const tileWidth = 64;
    const tileCount = Math.ceil(segment.width / tileWidth);

    for (let index = 0; index < tileCount; index += 1) {
      const x = segment.x + index * tileWidth + tileWidth / 2;
      const tile = group.create(x, segment.y + segment.height / 2, 'platform-block');
      tile.setDisplaySize(tileWidth, segment.height).refreshBody();
    }
  }

  private createSurfaceSprite(
    group: Phaser.Physics.Arcade.StaticGroup,
    segment: SurfaceSegment,
  ): void {
    const platform = group.create(
      segment.x + segment.width / 2,
      segment.y + segment.height / 2,
      'platform-block',
    );
    platform.setDisplaySize(segment.width, segment.height).refreshBody();
  }

  private collectCarrot(carrotSprite: CarrotSprite): void {
    if (!carrotSprite.active) {
      return;
    }

    this.session.collectCarrot(carrotSprite.carrotId);
    carrotSprite.disableBody(true, true);
    this.carrots.delete(carrotSprite.carrotId);
    this.publishHud();
  }

  private handleFinish(): void {
    if (this.resultAt !== null) {
      return;
    }

    const outcome = this.session.finishRun();
    const updatedHighScore = this.flow.recordScore(outcome.result.score);
    this.session.setHighScore(updatedHighScore);

    for (const carrotId of outcome.remainingCarrotIds) {
      const carrotSprite = this.carrots.get(carrotId);

      if (!carrotSprite) {
        continue;
      }

      this.carrots.delete(carrotId);
      const carrotBody = carrotSprite.body as Phaser.Physics.Arcade.Body;
      carrotBody.enable = false;
      this.tweens.add({
        targets: carrotSprite,
        x: this.player.x + (this.player.flipX ? -18 : 18),
        y: this.player.y - 10,
        alpha: 0,
        scale: 0.6,
        duration: 520,
        ease: 'Quad.easeIn',
        onComplete: () => {
          carrotSprite.destroy();
        },
      });
    }

    this.publishHud();
    this.result = this.session.getResult();
    this.resultAt = this.time.now + RESULT_DELAY_MS;
    this.player.setVelocity(0, 0);
  }

  private getKeyboardState(): ReturnType<typeof getKeyboardActionState> {
    if (!this.keyboard) {
      return getKeyboardActionState({
        left: false,
        right: false,
        jump: false,
        start: false,
        pause: false,
      });
    }

    const snapshot: KeyboardSnapshot = {
      left: this.keyboard.left.isDown || this.keyboard.leftAlt.isDown,
      right: this.keyboard.right.isDown || this.keyboard.rightAlt.isDown,
      jump:
        this.keyboard.jump.isDown ||
        this.keyboard.jumpAlt.isDown ||
        this.keyboard.jumpAltTwo.isDown ||
        this.keyboard.jumpAltThree.isDown,
      start: false,
      pause: this.keyboard.pause.isDown,
    };

    return getKeyboardActionState(snapshot);
  }

  private getGamepadState(): ReturnType<typeof getGamepadActionState> {
    const pad = this.input.gamepad?.getPad(0);

    if (!pad) {
      return getGamepadActionState(null);
    }

    const snapshot: GamepadSnapshot = {
      axisX: pad.axes.length > 0 ? pad.axes[0].getValue() : 0,
      left: Boolean(pad.buttons[14]?.pressed),
      right: Boolean(pad.buttons[15]?.pressed),
      jump: Boolean(pad.buttons[0]?.pressed),
      start: Boolean(pad.buttons[9]?.pressed),
      pause: Boolean(pad.buttons[9]?.pressed),
    };

    return getGamepadActionState(snapshot);
  }

  private animatePlayer(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    if (!body.blocked.down && !body.touching.down) {
      this.player.setTexture('bunny-jump-0');
      return;
    }

    if (Math.abs(body.velocity.x) > 12) {
      this.player.setTexture(Math.floor(this.time.now / 140) % 2 === 0 ? 'bunny-run-0' : 'bunny-run-1');
      return;
    }

    this.player.setTexture('bunny-idle-0');
  }

  private scrollBackground(): void {
    const scrollX = this.cameras.main.scrollX;

    if (this.cloudBand) {
      this.cloudBand.tilePositionX = scrollX * 0.12;
    }

    if (this.hillBack) {
      this.hillBack.tilePositionX = scrollX * 0.2;
    }

    if (this.hillFront) {
      this.hillFront.tilePositionX = scrollX * 0.34;
    }
  }

  private publishHud(): void {
    const hud = this.session.getHudState();
    const totalSeconds = Math.ceil(hud.timeRemainingMs / 1000);
    const overtimeSeconds = Math.floor(hud.overtimeMs / 1000);

    this.bridge.updateHud({
      score: hud.score,
      highScore: hud.highScore,
      carrotsCollected: hud.carrotsCollected,
      totalCarrots: hud.totalCarrots,
      timerLabel: hud.isOvertime ? `+${overtimeSeconds}s` : `${totalSeconds}s`,
      statusLabel: hud.isOvertime ? 'Overtime' : 'Time Left',
      isOvertime: hud.isOvertime,
    });
  }

  private togglePause(): void {
    this.pauseOverlayVisible = !this.pauseOverlayVisible;
    this.physics.world.isPaused = this.pauseOverlayVisible;
    this.bridge.showOverlay(this.pauseOverlayVisible ? { type: 'pause' } : { type: 'hidden' });
  }
}
