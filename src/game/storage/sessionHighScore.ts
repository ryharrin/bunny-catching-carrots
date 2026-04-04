export interface HighScoreStore {
  load(): number;
  save(score: number): void;
}

export class SessionHighScoreStore implements HighScoreStore {
  private readonly key: string;
  private readonly storage: Storage | null;

  constructor(
    key: string,
    storage: Storage | null = typeof window === 'undefined' ? null : window.sessionStorage,
  ) {
    this.key = key;
    this.storage = storage;
  }

  load(): number {
    const raw = this.storage?.getItem(this.key);
    const parsed = raw == null ? Number.NaN : Number.parseInt(raw, 10);

    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  save(score: number): void {
    if (!this.storage) {
      return;
    }

    this.storage.setItem(this.key, String(score));
  }
}
