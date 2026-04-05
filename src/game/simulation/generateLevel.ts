export interface SurfaceSegment {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PickupKind = 'carrot' | 'easter_egg';

export interface CollectiblePickup {
  id: string;
  x: number;
  y: number;
  kind: PickupKind;
  points: number;
}

export interface LevelLayout {
  seed: number;
  width: number;
  height: number;
  groundSegments: SurfaceSegment[];
  platforms: SurfaceSegment[];
  carrots: CollectiblePickup[];
  spawn: {
    x: number;
    y: number;
  };
  finishX: number;
  groundTop: number;
  paletteIndex: number;
}

const LEVEL_WIDTH = 10880;
const LEVEL_HEIGHT = 720;
const GROUND_TOP = 596;
const GROUND_HEIGHT = 124;
const CHUNK_WIDTH = 480;
const FINISH_OFFSET = 260;
const FLOATING_MIN_LIFT = 96;
const FLOATING_LIFT_VARIATION = 84;

function createRng(seed: number): () => number {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function generateLevel(seed: number): LevelLayout {
  const rng = createRng(seed);
  const finishX = LEVEL_WIDTH - FINISH_OFFSET;
  const carrots: CollectiblePickup[] = [];

  const addCarrotCluster = (baseX: number, y: number, count: number, spacing: number): void => {
    for (let index = 0; index < count; index += 1) {
      const x = baseX + index * spacing;

      if (x < 240 || x > finishX - 80) {
        continue;
      }

      const pickupNumber = carrots.length + 1;
      const isEgg = pickupNumber % 10 === 0;

      carrots.push({
        id: `carrot-${carrots.length + 1}`,
        x,
        y,
        kind: isEgg ? 'easter_egg' : 'carrot',
        points: isEgg ? 20 : 1,
      });
    }
  };

  const addFloatingCluster = (baseX: number): void => {
    const count = 3 + Math.floor(rng() * 3);
    const spacing = 38 + Math.floor(rng() * 8);
    const baseY =
      GROUND_TOP - FLOATING_MIN_LIFT - Math.floor(rng() * FLOATING_LIFT_VARIATION);

    for (let index = 0; index < count; index += 1) {
      const arcOffset = Math.abs(index - (count - 1) / 2);
      const y = baseY - Math.round((1.6 - arcOffset) * 10);
      addCarrotCluster(baseX + index * spacing, y, 1, spacing);
    }
  };

  for (let chunkIndex = 1; chunkIndex < LEVEL_WIDTH / CHUNK_WIDTH - 1; chunkIndex += 1) {
    const chunkStart = chunkIndex * CHUNK_WIDTH;
    const chance = rng();

    if (chance > 0.18) {
      const groundCount = 2 + Math.floor(rng() * 3);
      addCarrotCluster(
        chunkStart + 74 + Math.floor(rng() * 46),
        GROUND_TOP - 30,
        groundCount,
        42,
      );
    }

    if (chance > 0.34) {
      const floatingX = clamp(
        chunkStart + 54 + Math.floor(rng() * (CHUNK_WIDTH - 216)),
        210,
        finishX - 240,
      );
      addFloatingCluster(floatingX);

      if (chance > 0.72) {
        addFloatingCluster(clamp(floatingX + 148, 210, finishX - 220));
      }
    }
  }

  addCarrotCluster(finishX - 300, GROUND_TOP - 30, 4, 44);

  return {
    seed,
    width: LEVEL_WIDTH,
    height: LEVEL_HEIGHT,
    groundSegments: [
      {
        id: 'ground-main',
        x: 0,
        y: GROUND_TOP,
        width: LEVEL_WIDTH,
        height: GROUND_HEIGHT,
      },
    ],
    platforms: [],
    carrots,
    spawn: {
      x: 148,
      y: GROUND_TOP - 76,
    },
    finishX,
    groundTop: GROUND_TOP,
    paletteIndex: seed % 3,
  };
}
