export interface HudSnapshot {
  score: number;
  highScore: number;
  carrotsCollected: number;
  totalCarrots: number;
  timerLabel: string;
  statusLabel: string;
  isOvertime: boolean;
}

export type OverlayState =
  | {
      type: 'hidden';
    }
  | {
      type: 'menu';
      highScore: number;
    }
  | {
      type: 'pause';
    }
  | {
      type: 'results';
      score: number;
      highScore: number;
      finishBonus: number;
      elapsedLabel: string;
    };

export class SceneBridge {
  private hudListener?: (snapshot: HudSnapshot) => void;
  private overlayListener?: (state: OverlayState) => void;

  bindHudListener(listener: (snapshot: HudSnapshot) => void): void {
    this.hudListener = listener;
  }

  bindOverlayListener(listener: (state: OverlayState) => void): void {
    this.overlayListener = listener;
  }

  updateHud(snapshot: HudSnapshot): void {
    this.hudListener?.(snapshot);
  }

  showOverlay(state: OverlayState): void {
    this.overlayListener?.(state);
  }
}
