import { beforeEach, describe, expect, it } from 'vitest';
import { SessionHighScoreStore } from './sessionHighScore';

describe('SessionHighScoreStore', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('loads zero when no session score exists', () => {
    const store = new SessionHighScoreStore('bunny-test-score');

    expect(store.load()).toBe(0);
  });

  it('persists a score within the current session', () => {
    const store = new SessionHighScoreStore('bunny-test-score');
    store.save(12);

    expect(store.load()).toBe(12);
  });
});
