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

  it('marks every tenth pickup as a 20-point easter egg', () => {
    const level = generateLevel(7);
    const eggPickups = level.carrots.filter((pickup) => pickup.kind === 'easter_egg');

    expect(eggPickups.length).toBe(Math.floor(level.carrots.length / 10));

    for (const pickup of eggPickups) {
      expect(pickup.points).toBe(20);
    }

    for (const [index, pickup] of level.carrots.entries()) {
      const expectedKind = (index + 1) % 10 === 0 ? 'easter_egg' : 'carrot';
      const expectedPoints = expectedKind === 'easter_egg' ? 20 : 1;

      expect(pickup.kind).toBe(expectedKind);
      expect(pickup.points).toBe(expectedPoints);
    }
  });

  it('keeps platforms within a reachable jump band above the ground', () => {
    const level = generateLevel(11);

    for (const platform of level.platforms) {
      const lift = level.groundTop - platform.y;

      expect(lift).toBeGreaterThanOrEqual(120);
      expect(lift).toBeLessThanOrEqual(163);
    }
  });
});
