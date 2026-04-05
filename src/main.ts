import Phaser from 'phaser';
import './style.css';
import { GameFlow } from './game/simulation/gameSession';
import { SESSION_HIGH_SCORE_KEY, SessionHighScoreStore } from './game/storage/sessionHighScore';
import { SceneBridge } from './phaser/adapters/sceneBridge';
import { BootScene } from './phaser/scenes/BootScene';
import { GameScene } from './phaser/scenes/GameScene';
import { MenuScene } from './phaser/scenes/MenuScene';
import { ResultScene } from './phaser/scenes/ResultScene';
import { installDebugApi } from './testing/debugApi';
import { HudController } from './ui/hud';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root element not found.');
}

app.innerHTML = `
  <main class="shell">
    <section class="stage-frame">
      <div class="title-chip" aria-hidden="true">Bunny Catching Carrots</div>
      <div id="game-stage" class="game-stage">
        <div id="hud-root" class="hud-layer"></div>
        <div id="overlay-root" class="overlay-layer"></div>
        <div id="game-root" class="game-root" aria-label="Bunny Catching Carrots"></div>
      </div>
    </section>
  </main>
`;

const gameRoot = document.querySelector<HTMLDivElement>('#game-root');
const hudRoot = document.querySelector<HTMLDivElement>('#hud-root');
const overlayRoot = document.querySelector<HTMLDivElement>('#overlay-root');

if (!gameRoot || !hudRoot || !overlayRoot) {
  throw new Error('Game shell did not initialize correctly.');
}

const bridge = new SceneBridge();
const highScoreStore = new SessionHighScoreStore(SESSION_HIGH_SCORE_KEY);
const flow = new GameFlow(highScoreStore);

new HudController(hudRoot, overlayRoot, bridge);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: gameRoot,
  width: 1280,
  height: 720,
  backgroundColor: '#7ec7ff',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    gamepad: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1500 },
      debug: false,
    },
  },
  scene: [
    new BootScene(bridge),
    new MenuScene(bridge, flow),
    new GameScene(bridge, flow),
    new ResultScene(bridge),
  ],
});

installDebugApi(game);

window.addEventListener('beforeunload', () => {
  game.destroy(true);
});
