import { describe, expect, it } from 'vitest';
import { generateLevel } from './generateLevel';
import { GameFlow, GameSession } from './gameSession';

describe('GameSession', () => {
  it('tracks carrot collection as score', () => {
    const level = generateLevel(1);
    const session = new GameSession(level, 0);

    session.collectCarrot(level.carrots[0].id);
    session.collectCarrot(level.carrots[1].id);

    expect(session.getHudState().score).toBe(2);
  });

  it('converts remaining carrots into finish bonus when the run ends', () => {
    const level = generateLevel(2);
    const session = new GameSession(level, 0);

    session.collectCarrot(level.carrots[0].id);

    const outcome = session.finishRun();

    expect(outcome.result.score).toBe(level.carrots.length);
    expect(outcome.result.finishBonus).toBe(level.carrots.length - 1);
    expect(outcome.remainingCarrotIds).toHaveLength(level.carrots.length - 1);
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
