import type { InputFrame, RawActionState } from './actions';

export interface KeyboardSnapshot {
  left: boolean;
  right: boolean;
  down: boolean;
  jump: boolean;
  start: boolean;
  pause: boolean;
}

export interface GamepadSnapshot {
  axisX: number;
  left: boolean;
  right: boolean;
  down: boolean;
  jump: boolean;
  start: boolean;
  pause: boolean;
}

const GAMEPAD_DEAD_ZONE = 0.2;

export function getKeyboardActionState(snapshot: KeyboardSnapshot): RawActionState {
  return {
    move: Number(snapshot.right) - Number(snapshot.left),
    duck: snapshot.down,
    jump: snapshot.jump,
    start: snapshot.start,
    pause: snapshot.pause,
  };
}

export function getGamepadActionState(snapshot: GamepadSnapshot | null): RawActionState {
  if (!snapshot) {
    return {
      move: 0,
      duck: false,
      jump: false,
      start: false,
      pause: false,
    };
  }

  const axisMove =
    Math.abs(snapshot.axisX) >= GAMEPAD_DEAD_ZONE ? Math.max(-1, Math.min(1, snapshot.axisX)) : 0;
  const buttonMove = Number(snapshot.right) - Number(snapshot.left);
  const move = buttonMove !== 0 ? buttonMove : axisMove;

  return {
    move,
    duck: snapshot.down,
    jump: snapshot.jump,
    start: snapshot.start,
    pause: snapshot.pause,
  };
}

export function mergeActionStates(...states: RawActionState[]): RawActionState {
  return states.reduce<RawActionState>(
    (combined, current) => ({
      move:
        Math.abs(current.move) > Math.abs(combined.move) ? current.move : combined.move,
      duck: combined.duck || current.duck,
      jump: combined.jump || current.jump,
      start: combined.start || current.start,
      pause: combined.pause || current.pause,
    }),
    {
      move: 0,
      duck: false,
      jump: false,
      start: false,
      pause: false,
    },
  );
}

export class InputFrameTracker {
  private previous = {
    jump: false,
    start: false,
    pause: false,
  };

  next(state: RawActionState): InputFrame {
    const frame: InputFrame = {
      move: state.move,
      duck: state.duck,
      jumpPressed: state.jump && !this.previous.jump,
      startPressed: state.start && !this.previous.start,
      pausePressed: state.pause && !this.previous.pause,
    };

    this.previous = {
      jump: state.jump,
      start: state.start,
      pause: state.pause,
    };

    return frame;
  }
}
