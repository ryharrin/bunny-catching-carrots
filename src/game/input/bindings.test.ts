import { describe, expect, it } from 'vitest';
import { InputFrameTracker, getGamepadActionState, getKeyboardActionState, mergeActionStates } from './bindings';

describe('bindings', () => {
  it('maps keyboard controls into movement and jump actions', () => {
    expect(
      getKeyboardActionState({
        left: false,
        right: true,
        run: true,
        down: true,
        jump: true,
        start: false,
        restart: false,
        pause: false,
      }),
    ).toEqual({
      move: 1,
      run: true,
      duck: true,
      jump: true,
      start: false,
      restart: false,
      pause: false,
    });
  });

  it('prefers d-pad input over a neutral analog stick', () => {
    expect(
      getGamepadActionState({
        axisX: 0.05,
        left: true,
        right: false,
        run: true,
        down: true,
        jump: false,
        start: false,
        restart: false,
        pause: false,
      }),
    ).toEqual({
      move: -1,
      run: true,
      duck: true,
      jump: false,
      start: false,
      restart: false,
      pause: false,
    });
  });

  it('merges the strongest movement state and button presses', () => {
    expect(
      mergeActionStates(
        { move: -1, run: false, duck: false, jump: false, start: false, restart: false, pause: false },
        { move: 0.6, run: true, duck: true, jump: true, start: false, restart: true, pause: true },
      ),
    ).toEqual({
      move: -1,
      run: true,
      duck: true,
      jump: true,
      start: false,
      restart: true,
      pause: true,
    });
  });

  it('emits edge-triggered presses for jump, restart, and pause', () => {
    const tracker = new InputFrameTracker();

    expect(tracker.next({ move: 0, run: true, duck: true, jump: true, start: false, restart: false, pause: false })).toEqual({
      move: 0,
      run: true,
      duck: true,
      jumpPressed: true,
      startPressed: false,
      restartPressed: false,
      pausePressed: false,
    });

    expect(tracker.next({ move: 0, run: false, duck: false, jump: true, start: false, restart: true, pause: true })).toEqual({
      move: 0,
      run: false,
      duck: false,
      jumpPressed: false,
      startPressed: false,
      restartPressed: true,
      pausePressed: true,
    });
  });
});
