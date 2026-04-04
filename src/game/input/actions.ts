export type GameAction =
  | 'move_left'
  | 'move_right'
  | 'jump'
  | 'start'
  | 'pause';

export interface RawActionState {
  move: number;
  jump: boolean;
  start: boolean;
  pause: boolean;
}

export interface InputFrame {
  move: number;
  jumpPressed: boolean;
  startPressed: boolean;
  pausePressed: boolean;
}
