export interface SurfaceSegment {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CarrotPickup {
  id: string;
  x: number;
  y: number;
}

export interface LevelLayout {
  seed: number;
  width: number;
  height: number;
  groundSegments: SurfaceSegment[];
  platforms: SurfaceSegment[];
  carrots: CarrotPickup[];
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
  const platforms: SurfaceSegment[] = [];
  const carrots: CarrotPickup[] = [];

  const addCarrotCluster = (baseX: number, y: number, count: number, spacing: number): void => {
    for (let index = 0; index < count; index += 1) {
      const x = baseX + index * spacing;

      if (x < 240 || x > finishX - 80) {
        continue;
      }

      carrots.push({
        id: `carrot-${carrots.length + 1}`,
        x,
        y,
      });
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

    const platformCount = chance > 0.6 ? 2 : 1;

    for (let platformIndex = 0; platformIndex < platformCount; platformIndex += 1) {
      const width = 144 + Math.floor(rng() * 3) * 32;
      const x = clamp(
        chunkStart + 36 + Math.floor(rng() * (CHUNK_WIDTH - width - 72)),
        210,
        finishX - width - 120,
      );
      const y = GROUND_TOP - 130 - Math.floor(rng() * 150);

      platforms.push({
        id: `platform-${platforms.length + 1}`,
        x,
        y,
        width,
        height: 28,
      });

      const carrotCount = 2 + Math.floor(rng() * Math.max(2, width / 72));
      addCarrotCluster(x + 28, y - 24, carrotCount, 38);
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
    platforms,
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
