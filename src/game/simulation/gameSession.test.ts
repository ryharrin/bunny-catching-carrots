import { describe, expect, it } from 'vitest';
import { generateLevel } from './generateLevel';
import { GameFlow, GameSession } from './gameSession';

describe('GameSession', () => {
  it('tracks pickup values as score', () => {
    const level = generateLevel(1);
    const session = new GameSession(level, 0);

    session.collectCarrot(level.carrots[0].id);
    session.collectCarrot(level.carrots[1].id);

    expect(session.getHudState().score).toBe(2);
  });

  it('awards 20 points for an easter egg pickup', () => {
    const level = generateLevel(1);
    const session = new GameSession(level, 0);
    const eggPickup = level.carrots.find((pickup) => pickup.kind === 'easter_egg');

    expect(eggPickup).toBeDefined();

    session.collectCarrot(eggPickup!.id);

    expect(session.getHudState().score).toBe(20);
    expect(session.getHudState().carrotsCollected).toBe(1);
  });

  it('keeps the run score intact and reports leftovers as a finish bonus', () => {
    const level = generateLevel(2);
    const session = new GameSession(level, 0);

    session.collectCarrot(level.carrots[0].id);

    const outcome = session.finishRun();

    const remainingPoints = level.carrots.slice(1).reduce((total, pickup) => total + pickup.points, 0);

    expect(outcome.result.score).toBe(level.carrots[0].points);
    expect(outcome.result.finishBonus).toBe(remainingPoints);
    expect(outcome.remainingCarrotIds).toHaveLength(level.carrots.length - 1);
  });

  it('shows the current run as the live session high score before the run ends', () => {
    const level = generateLevel(3);
    const session = new GameSession(level, 4);

    for (const carrot of level.carrots.slice(0, 6)) {
      session.collectCarrot(carrot.id);
    }

    const collectedPoints = level.carrots.slice(0, 6).reduce((total, pickup) => total + pickup.points, 0);

    expect(session.getHudState().score).toBe(collectedPoints);
    expect(session.getHudState().highScore).toBe(collectedPoints);
  });

  it('updates the stored high score only when a run beats the current best', () => {
    let storedHighScore = 4;
    const store = {
      load: () => storedHighScore,
      save: (score: number) => {
        storedHighScore = score;
      },
    };

    const flow = new GameFlow(store);

    expect(flow.recordScore(3)).toBe(4);
    expect(flow.recordScore(9)).toBe(9);
    expect(storedHighScore).toBe(9);
  });
});
