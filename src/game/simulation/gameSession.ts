import type { HighScoreStore } from '../storage/sessionHighScore';
import { generateLevel, type LevelLayout } from './generateLevel';

const LEVEL_TARGET_MS = 60_000;

export interface HudState {
  score: number;
  highScore: number;
  carrotsCollected: number;
  totalCarrots: number;
  timeRemainingMs: number;
  overtimeMs: number;
  isOvertime: boolean;
}

export interface RunResult extends HudState {
  elapsedMs: number;
  finishBonus: number;
}

export interface FinishOutcome {
  result: RunResult;
  remainingCarrotIds: string[];
}

export class GameSession {
  readonly level: LevelLayout;

  private readonly collectedCarrotIds = new Set<string>();
  private elapsedMs = 0;
  private finished = false;
  private finishBonus = 0;
  private highScore: number;

  constructor(level: LevelLayout, highScore: number) {
    this.level = level;
    this.highScore = highScore;
  }

  tick(deltaMs: number): void {
    if (this.finished) {
      return;
    }

    this.elapsedMs += deltaMs;
  }

  collectCarrot(carrotId: string): void {
    if (this.finished) {
      return;
    }

    this.collectedCarrotIds.add(carrotId);
  }

  finishRun(): FinishOutcome {
    if (this.finished) {
      return {
        result: this.getResult(),
        remainingCarrotIds: [],
      };
    }

    const remainingCarrotIds = this.level.carrots
      .map((carrot) => carrot.id)
      .filter((carrotId) => !this.collectedCarrotIds.has(carrotId));

    for (const carrotId of remainingCarrotIds) {
      this.collectedCarrotIds.add(carrotId);
    }

    this.finishBonus = remainingCarrotIds.length;
    this.finished = true;

    return {
      result: this.getResult(),
      remainingCarrotIds,
    };
  }

  setHighScore(highScore: number): void {
    this.highScore = highScore;
  }

  getScore(): number {
    return this.collectedCarrotIds.size;
  }

  getHudState(): HudState {
    const timeRemainingMs = Math.max(0, LEVEL_TARGET_MS - this.elapsedMs);
    const overtimeMs = Math.max(0, this.elapsedMs - LEVEL_TARGET_MS);

    return {
      score: this.getScore(),
      highScore: this.highScore,
      carrotsCollected: this.collectedCarrotIds.size,
      totalCarrots: this.level.carrots.length,
      timeRemainingMs,
      overtimeMs,
      isOvertime: overtimeMs > 0,
    };
  }

  getResult(): RunResult {
    return {
      ...this.getHudState(),
      elapsedMs: this.elapsedMs,
      finishBonus: this.finishBonus,
    };
  }
}

export class GameFlow {
  private highScore: number;
  private runSeed = 1;
  private readonly highScoreStore: HighScoreStore;

  constructor(highScoreStore: HighScoreStore) {
    this.highScoreStore = highScoreStore;
    this.highScore = this.highScoreStore.load();
  }

  createSession(): GameSession {
    const session = new GameSession(generateLevel(this.runSeed), this.highScore);
    this.runSeed += 1;
    return session;
  }

  getHighScore(): number {
    return this.highScore;
  }

  recordScore(score: number): number {
    if (score <= this.highScore) {
      return this.highScore;
    }

    this.highScore = score;
    this.highScoreStore.save(score);
    return this.highScore;
  }
}
