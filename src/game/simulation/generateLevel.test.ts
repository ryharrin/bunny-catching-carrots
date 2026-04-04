import { describe, expect, it } from 'vitest';
import { generateLevel } from './generateLevel';

describe('generateLevel', () => {
  it('creates a single continuous ground segment so the player never faces pits', () => {
    const level = generateLevel(5);

    expect(level.groundSegments).toHaveLength(1);
    expect(level.groundSegments[0].x).toBe(0);
    expect(level.groundSegments[0].width).toBe(level.width);
  });

  it('places the finish line inside the world bounds with carrots to collect', () => {
    const level = generateLevel(7);

    expect(level.finishX).toBeLessThan(level.width);
    expect(level.finishX).toBeGreaterThan(0);
    expect(level.carrots.length).toBeGreaterThan(40);
    expect(level.platforms.length).toBeGreaterThan(8);
  });
});
