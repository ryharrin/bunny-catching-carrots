import { beforeEach, describe, expect, it } from 'vitest';
import { SceneBridge } from '../phaser/adapters/sceneBridge';
import { HudController } from './hud';

describe('HudController integration', () => {
  let bridge: SceneBridge;
  let hudRoot: HTMLElement;
  let overlayRoot: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '<div id="hud-root"></div><div id="overlay-root"></div>';
    hudRoot = document.querySelector<HTMLElement>('#hud-root')!;
    overlayRoot = document.querySelector<HTMLElement>('#overlay-root')!;
    bridge = new SceneBridge();
    new HudController(hudRoot, overlayRoot, bridge);
  });

  it('renders the live hud snapshot through the bridge boundary', () => {
    bridge.updateHud({
      score: 7,
      highScore: 13,
      carrotsCollected: 7,
      totalCarrots: 29,
      timerLabel: '54s',
      statusLabel: 'Time Left',
      isOvertime: false,
    });

    expect(hudRoot.querySelector('[data-testid="score-value"]')?.textContent).toBe('7');
    expect(hudRoot.querySelector('[data-testid="high-score-value"]')?.textContent).toBe('13');
    expect(hudRoot.querySelector('[data-testid="carrots-value"]')?.textContent).toBe('7/29');
    expect(hudRoot.querySelector('[data-testid="timer-value"]')?.textContent).toBe('54s');
    expect(hudRoot.querySelector('[data-testid="timer-status"]')?.textContent?.trim()).toBe('Time Left');
  });

  it('renders menu, pause, results, and hidden overlay states', () => {
    bridge.showOverlay({
      type: 'menu',
      highScore: 12,
    });

    expect(overlayRoot.querySelector('[data-testid="menu-overlay"]')).not.toBeNull();
    expect(overlayRoot.querySelector('[data-testid="menu-high-score"]')?.textContent).toBe('12');

    bridge.showOverlay({
      type: 'pause',
    });

    expect(overlayRoot.querySelector('[data-testid="pause-overlay"]')).not.toBeNull();

    bridge.showOverlay({
      type: 'results',
      score: 21,
      highScore: 34,
      finishBonus: 8,
      elapsedLabel: '62.3s',
    });

    expect(overlayRoot.querySelector('[data-testid="results-overlay"]')).not.toBeNull();
    expect(overlayRoot.querySelector('[data-testid="results-run-score"]')?.textContent).toBe('21');
    expect(overlayRoot.querySelector('[data-testid="results-finish-bonus"]')?.textContent).toBe('+8');
    expect(overlayRoot.querySelector('[data-testid="results-high-score"]')?.textContent).toBe('34');

    bridge.showOverlay({
      type: 'hidden',
    });

    expect(overlayRoot.innerHTML).toBe('');
  });

  it('sends a restart overlay action from the pause menu button', () => {
    let receivedAction: string | null = null;
    bridge.bindOverlayActionListener((action) => {
      receivedAction = action;
    });

    bridge.showOverlay({
      type: 'pause',
    });

    overlayRoot.querySelector<HTMLButtonElement>('[data-testid="pause-restart-button"]')?.click();

    expect(receivedAction).toBe('restart_level');
  });
});
