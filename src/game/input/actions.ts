export type GameAction =
  | 'move_left'
  | 'move_right'
  | 'duck'
  | 'jump'
  | 'start'
  | 'pause';

export interface RawActionState {
  move: number;
  duck: boolean;
  jump: boolean;
  start: boolean;
  pause: boolean;
}

export interface InputFrame {
  move: number;
  duck: boolean;
  jumpPressed: boolean;
  startPressed: boolean;
  pausePressed: boolean;
}
