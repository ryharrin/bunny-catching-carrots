import type Phaser from 'phaser';
import { SESSION_HIGH_SCORE_KEY } from '../game/storage/sessionHighScore';
import { GameScene } from '../phaser/scenes/GameScene';

interface BunnyDebugApi {
  clearSessionHighScore(): void;
  forceFinish(): void;
  getActiveScene(): string | null;
  getSessionHighScore(): number;
  startRun(): void;
}

declare global {
  interface Window {
    __BUNNY_DEBUG__?: BunnyDebugApi;
  }
}

function isLocalDebugHost(): boolean {
  const host = window.location.hostname;
  return host === '127.0.0.1' || host === 'localhost';
}

function getActiveScene(game: Phaser.Game): Phaser.Scene | null {
  for (const scene of game.scene.getScenes(true)) {
    if (scene.scene.isActive()) {
      return scene;
    }
  }

  return null;
}

function getGameScene(game: Phaser.Game): GameScene | null {
  const scene = game.scene.getScene('GameScene');
  return scene instanceof GameScene && scene.scene.isActive() ? scene : null;
}

export function installDebugApi(game: Phaser.Game): void {
  if (!isLocalDebugHost()) {
    return;
  }

  window.__BUNNY_DEBUG__ = {
    clearSessionHighScore() {
      window.sessionStorage.removeItem(SESSION_HIGH_SCORE_KEY);
    },
    forceFinish() {
      getGameScene(game)?.debugForceFinish();
    },
    getActiveScene() {
      return getActiveScene(game)?.scene.key ?? null;
    },
    getSessionHighScore() {
      const raw = window.sessionStorage.getItem(SESSION_HIGH_SCORE_KEY);
      const parsed = raw == null ? Number.NaN : Number.parseInt(raw, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    },
    startRun() {
      const scene = game.scene.getScene('MenuScene');

      if (scene.scene.isActive()) {
        scene.scene.start('GameScene');
      }
    },
  };
}

export {};
