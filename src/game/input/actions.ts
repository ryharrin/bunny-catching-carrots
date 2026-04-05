export type GameAction =
  | 'move_left'
  | 'move_right'
  | 'run'
  | 'duck'
  | 'jump'
  | 'start'
  | 'restart'
  | 'pause';

export interface RawActionState {
  move: number;
  run: boolean;
  duck: boolean;
  jump: boolean;
  start: boolean;
  restart: boolean;
  pause: boolean;
}

export interface InputFrame {
  move: number;
  run: boolean;
  duck: boolean;
  jumpPressed: boolean;
  startPressed: boolean;
  restartPressed: boolean;
  pausePressed: boolean;
}
