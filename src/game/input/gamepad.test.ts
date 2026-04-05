import { describe, expect, it } from 'vitest';
import { getActivePad } from './gamepad';

describe('getActivePad', () => {
  it('returns the first connected pad across non-zero slots', () => {
    const secondPad = { id: 'xbox-pad' };
    const plugin = {
      total: 2,
      getAll() {
        return [];
      },
      getPad(index: number) {
        return index === 1 ? secondPad : null;
      },
    };

    expect(getActivePad(plugin as never)).toBe(secondPad);
  });

  it('returns null when no pad is available', () => {
    const plugin = {
      total: 0,
      getAll() {
        return [];
      },
      getPad() {
        return null;
      },
    };

    expect(getActivePad(plugin as never)).toBeNull();
  });
});
