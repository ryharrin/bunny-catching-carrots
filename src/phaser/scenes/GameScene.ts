import Phaser from 'phaser';
import {
  InputFrameTracker,
  getGamepadActionState,
  getKeyboardActionState,
  mergeActionStates,
  type GamepadSnapshot,
  type KeyboardSnapshot,
} from '../../game/input/bindings';
import { getActivePad } from '../../game/input/gamepad';
import type { GameFlow, GameSession } from '../../game/simulation/gameSession';
import type { RunResult } from '../../game/simulation/gameSession';
import type {
  CollectiblePickup,
  PickupKind,
  SurfaceSegment,
} from '../../game/simulation/generateLevel';
import type { SceneBridge } from '../adapters/sceneBridge';

const PLAYER_SPEED = 265;
const PLAYER_JUMP_VELOCITY = -760;
const RESULT_DELAY_MS = 1250;
const STANDING_BODY = { width: 26, height: 42, offsetX: 12, offsetY: 20 };
const SLIDING_BODY = { width: 26, height: 28, offsetX: 12, offsetY: 34 };
const SLIDE_SPEED = 335;
const PLAYER_SCALE = 1.72;

interface PickupSprite extends Phaser.Physics.Arcade.Sprite {
  pickupId: string;
  pickupKind: PickupKind;
}

export class GameScene extends Phaser.Scene {
  private readonly bridge: SceneBridge;
  private readonly flow: GameFlow;
  private session!: GameSession;
  private player!: Phaser.Physics.Arcade.Sprite;
  private pickups = new Map<string, PickupSprite>();
  private inputTracker = new InputFrameTracker();
  private resultAt: number | null = null;
  private pauseOverlayVisible = false;
  private isSliding = false;
  private slideDirection = 1;
  private result?: RunResult;
  private keyboard?: {
    left: Phaser.Input.Keyboard.Key;
    leftAlt: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    rightAlt: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    downAlt: Phaser.Input.Keyboard.Key;
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
    this.isSliding = false;
    this.slideDirection = 1;
    this.pickups.clear();

    const { width, height, groundSegments, platforms, carrots, spawn, finishX, paletteIndex } =
      this.session.level;

    this.physics.world.setBounds(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setBackgroundColor('#8ec4e4');

    this.cloudBand = this.add.tileSprite(0, 116, width, 118, 'cloud-band').setOrigin(0, 0.5);
    this.cloudBand.setTileScale(0.84, 0.84).setAlpha(0.58);
    this.hillBack = this.add.tileSprite(0, 452, width, 132, 'hill-far').setOrigin(0, 0.5);
    this.hillBack.setTileScale(0.86, 0.86).setAlpha(0.84);
    this.hillFront = this.add.tileSprite(0, 534, width, 176, 'hill-near').setOrigin(0, 0.5);
    this.hillFront.setTileScale(0.96, 0.96);

    if (paletteIndex === 1) {
      this.cameras.main.setBackgroundColor('#95c8e5');
      this.cloudBand.setTint(0xecf4fa);
      this.hillBack.setTint(0xe4efe1);
      this.hillFront.setTint(0xf0f6e5);
    }

    if (paletteIndex === 2) {
      this.cameras.main.setBackgroundColor('#a2cae4');
      this.cloudBand.setTint(0xf8f1ea);
      this.hillBack.setTint(0xebefe0);
      this.hillFront.setTint(0xf4eddc);
    }

    const groundGroup = this.physics.add.staticGroup();
    const platformGroup = this.physics.add.staticGroup();

    for (const segment of groundSegments) {
      this.createSurfaceTiles(groundGroup, segment, 'ground-block');
    }

    for (const platform of platforms) {
      this.createSurfaceTiles(platformGroup, platform, 'platform-block');
    }

    this.player = this.physics.add.sprite(spawn.x, spawn.y, 'bunny-idle-0');
    this.player.setScale(PLAYER_SCALE);
    this.player.setCollideWorldBounds(true);
    this.applyBodySize(STANDING_BODY);
    this.player.setDepth(4);

    this.physics.add.collider(this.player, groundGroup);
    this.physics.add.collider(this.player, platformGroup);

    for (const pickup of carrots) {
      const pickupSprite = this.createPickupSprite(pickup);
      this.tweens.add({
        targets: pickupSprite,
        y: pickup.y - 8,
        duration: 780,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.pickups.set(pickup.id, pickupSprite);
    }

    const finishLine = this.physics.add.staticSprite(finishX, this.session.level.groundTop, 'finish-flag');
    finishLine.setOrigin(0.5, 1);
    finishLine.setDepth(2);

    this.physics.add.overlap(this.player, finishLine, () => {
      this.handleFinish();
    });

    for (const pickupSprite of this.pickups.values()) {
      this.physics.add.overlap(this.player, pickupSprite, () => {
        this.collectPickup(pickupSprite);
      });
    }

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setLerp(0.18, 0.18);
    this.cameras.main.setDeadzone(180, 120);

    if (this.input.keyboard) {
      this.keyboard = {
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        leftAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        rightAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
        downAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
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
    const wantsSlide = inputFrame.duck && (body.blocked.down || body.touching.down);
    const move = Phaser.Math.Clamp(inputFrame.move, -1, 1);

    if (move !== 0) {
      this.player.setFlipX(move < 0);
      this.slideDirection = move < 0 ? -1 : 1;
    }

    this.updateSlideState(wantsSlide, move);

    if (this.isSliding) {
      this.player.setVelocityX(this.slideDirection * SLIDE_SPEED);
    } else {
      this.player.setVelocityX(move * PLAYER_SPEED);
    }

    if (inputFrame.jumpPressed && !this.isSliding && (body.blocked.down || body.touching.down)) {
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
    textureKey: string,
  ): void {
    const tileWidth = 64;
    const tileCount = Math.ceil(segment.width / tileWidth);

    for (let index = 0; index < tileCount; index += 1) {
      const remainingWidth = segment.width - index * tileWidth;
      const currentTileWidth = Math.min(tileWidth, remainingWidth);
      const x = segment.x + index * tileWidth + currentTileWidth / 2;
      const tile = group.create(x, segment.y + segment.height / 2, textureKey);
      tile.setDisplaySize(currentTileWidth, segment.height).refreshBody();
    }
  }

  private createPickupSprite(pickup: CollectiblePickup): PickupSprite {
    const textureKey = pickup.kind === 'easter_egg' ? 'easter-egg' : 'carrot';
    const pickupSprite = this.physics.add.sprite(pickup.x, pickup.y, textureKey) as PickupSprite;
    pickupSprite.pickupId = pickup.id;
    pickupSprite.pickupKind = pickup.kind;
    const pickupBody = pickupSprite.body as Phaser.Physics.Arcade.Body;
    pickupBody.setAllowGravity(false);
    pickupSprite.setImmovable(true);
    pickupSprite.setScale(pickup.kind === 'easter_egg' ? 1.45 : 1.3);
    pickupSprite.setDepth(3);
    return pickupSprite;
  }

  private collectPickup(pickupSprite: PickupSprite): void {
    if (!pickupSprite.active) {
      return;
    }

    this.session.collectCarrot(pickupSprite.pickupId);
    pickupSprite.disableBody(true, true);
    this.pickups.delete(pickupSprite.pickupId);
    this.publishHud();
  }

  private burstEasterEgg(eggSprite: PickupSprite): void {
    this.tweens.add({
      targets: eggSprite,
      scaleX: eggSprite.scaleX * 1.2,
      scaleY: eggSprite.scaleY * 0.88,
      angle: this.player.flipX ? -10 : 10,
      duration: 130,
      yoyo: true,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        const burstX = eggSprite.x;
        const burstY = eggSprite.y;

        this.spawnCandyBurst(burstX, burstY);
        this.tweens.add({
          targets: eggSprite,
          alpha: 0,
          scale: eggSprite.scale * 1.35,
          duration: 180,
          ease: 'Quad.easeOut',
          onComplete: () => {
            eggSprite.destroy();
          },
        });
      },
    });
  }

  private spawnCandyBurst(originX: number, originY: number): void {
    const candyColors = [0xff7aa2, 0x6cc7ff, 0xffc857, 0x7bd88f, 0xf28dff, 0xff8f5a];
    const burstCount = 7;

    for (let index = 0; index < burstCount; index += 1) {
      const candy = this.add.sprite(originX, originY - 4, 'candy-piece');
      candy.setDepth(5);
      candy.setScale(0.5 + Math.random() * 0.18);
      candy.setTint(candyColors[index % candyColors.length]);

      const travelX =
        originX + Phaser.Math.Between(-72, 72) + (this.player.flipX ? -18 : 18);
      const travelY = originY - Phaser.Math.Between(34, 92);
      const settleY = originY + Phaser.Math.Between(30, 78);
      const angle = Phaser.Math.Between(-180, 180);

      this.tweens.add({
        targets: candy,
        x: travelX,
        y: travelY,
        angle,
        alpha: 0.94,
        duration: 220,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: candy,
            y: settleY,
            alpha: 0,
            angle: angle + Phaser.Math.Between(-80, 80),
            duration: 320,
            ease: 'Quad.easeIn',
            onComplete: () => {
              candy.destroy();
            },
          });
        },
      });
    }
  }

  private handleFinish(): void {
    if (this.resultAt !== null) {
      return;
    }

    const outcome = this.session.finishRun();
    const updatedHighScore = this.flow.recordScore(outcome.result.score);
    this.session.setHighScore(updatedHighScore);

    for (const carrotId of outcome.remainingCarrotIds) {
      const carrotSprite = this.pickups.get(carrotId);

      if (!carrotSprite) {
        continue;
      }

      this.pickups.delete(carrotId);
      const carrotBody = carrotSprite.body as Phaser.Physics.Arcade.Body;
      carrotBody.enable = false;

      if (carrotSprite.pickupKind === 'easter_egg') {
        this.burstEasterEgg(carrotSprite);
        continue;
      }

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

  debugForceFinish(): void {
    this.handleFinish();
  }

  debugCollectCarrots(count = 1): number {
    let collected = 0;

    for (const carrotSprite of this.pickups.values()) {
      this.collectPickup(carrotSprite);
      collected += 1;

      if (collected >= count) {
        break;
      }
    }

    return collected;
  }

  private getKeyboardState(): ReturnType<typeof getKeyboardActionState> {
    if (!this.keyboard) {
      return getKeyboardActionState({
        left: false,
        right: false,
        down: false,
        jump: false,
        start: false,
        pause: false,
      });
    }

    const snapshot: KeyboardSnapshot = {
      left: this.keyboard.left.isDown || this.keyboard.leftAlt.isDown,
      right: this.keyboard.right.isDown || this.keyboard.rightAlt.isDown,
      down: this.keyboard.down.isDown || this.keyboard.downAlt.isDown,
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
    const pad = getActivePad(this.input.gamepad);

    if (!pad) {
      return getGamepadActionState(null);
    }

    const snapshot: GamepadSnapshot = {
      axisX: pad.axes.length > 0 ? pad.axes[0].getValue() : 0,
      left: Boolean(pad.buttons[14]?.pressed),
      right: Boolean(pad.buttons[15]?.pressed),
      down: Boolean(pad.buttons[13]?.pressed),
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

    if (this.isSliding) {
      this.player.setTexture('bunny-slide-0');
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

  private applyBodySize(size: typeof STANDING_BODY): void {
    this.player.setSize(size.width, size.height);
    this.player.setOffset(size.offsetX, size.offsetY);
  }

  private updateSlideState(wantsSlide: boolean, move: number): void {
    if (wantsSlide) {
      if (!this.isSliding) {
        if (move !== 0) {
          this.slideDirection = move < 0 ? -1 : 1;
        } else {
          this.slideDirection = this.player.flipX ? -1 : 1;
        }

        this.applyBodySize(SLIDING_BODY);
        this.isSliding = true;
      }
      return;
    }

    if (!this.isSliding || !this.canStandUp()) {
      return;
    }

    this.applyBodySize(STANDING_BODY);
    this.isSliding = false;
  }

  private canStandUp(): boolean {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const headroomHeight = STANDING_BODY.height - SLIDING_BODY.height;
    const headroom = {
      left: body.x,
      right: body.x + body.width,
      top: body.y - headroomHeight,
      bottom: body.y,
    };

    const surfaces = [...this.session.level.groundSegments, ...this.session.level.platforms];

    return !surfaces.some((surface) => {
      const surfaceLeft = surface.x;
      const surfaceRight = surface.x + surface.width;
      const surfaceTop = surface.y;
      const surfaceBottom = surface.y + surface.height;

      return (
        headroom.left < surfaceRight &&
        headroom.right > surfaceLeft &&
        headroom.top < surfaceBottom &&
        headroom.bottom > surfaceTop
      );
    });
  }

  private togglePause(): void {
    this.pauseOverlayVisible = !this.pauseOverlayVisible;
    this.physics.world.isPaused = this.pauseOverlayVisible;
    this.bridge.showOverlay(this.pauseOverlayVisible ? { type: 'pause' } : { type: 'hidden' });
  }
}
