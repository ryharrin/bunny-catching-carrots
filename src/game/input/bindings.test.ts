import { describe, expect, it } from 'vitest';
import { InputFrameTracker, getGamepadActionState, getKeyboardActionState, mergeActionStates } from './bindings';

describe('bindings', () => {
  it('maps keyboard controls into movement and jump actions', () => {
    expect(
      getKeyboardActionState({
        left: false,
        right: true,
        jump: true,
        start: false,
        pause: false,
      }),
    ).toEqual({
      move: 1,
      jump: true,
      start: false,
      pause: false,
    });
  });

  it('prefers d-pad input over a neutral analog stick', () => {
    expect(
      getGamepadActionState({
        axisX: 0.05,
        left: true,
        right: false,
        jump: false,
        start: false,
        pause: false,
      }),
    ).toEqual({
      move: -1,
      jump: false,
      start: false,
      pause: false,
    });
  });

  it('merges the strongest movement state and button presses', () => {
    expect(
      mergeActionStates(
        { move: -1, jump: false, start: false, pause: false },
        { move: 0.6, jump: true, start: false, pause: true },
      ),
    ).toEqual({
      move: -1,
      jump: true,
      start: false,
      pause: true,
    });
  });

  it('emits edge-triggered presses for jump and pause', () => {
    const tracker = new InputFrameTracker();

    expect(tracker.next({ move: 0, jump: true, start: false, pause: false })).toEqual({
      move: 0,
      jumpPressed: true,
      startPressed: false,
      pausePressed: false,
    });

    expect(tracker.next({ move: 0, jump: true, start: false, pause: true })).toEqual({
      move: 0,
      jumpPressed: false,
      startPressed: false,
      pausePressed: true,
    });
  });
});
