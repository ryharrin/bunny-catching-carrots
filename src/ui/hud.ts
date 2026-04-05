import { getBrowserGamepadDebugState } from '../game/input/gamepad';
import {
  beginWebHidCalibration,
  getWebHidDebugState,
  requestWebHidController,
  resetWebHidCalibration,
} from '../game/input/webhid';
import type { HudSnapshot, OverlayState, SceneBridge } from '../phaser/adapters/sceneBridge';

export class HudController {
  private readonly hudRoot: HTMLElement;
  private readonly overlayRoot: HTMLElement;
  private readonly bridge: SceneBridge;
  private readonly controllerDebugRoot: HTMLElement;
  private lastControllerDebugMarkup = '';

  constructor(
    hudRoot: HTMLElement,
    overlayRoot: HTMLElement,
    bridge: SceneBridge,
  ) {
    this.hudRoot = hudRoot;
    this.overlayRoot = overlayRoot;
    this.bridge = bridge;
    this.controllerDebugRoot = document.createElement('aside');
    this.controllerDebugRoot.className = 'controller-debug';
    this.controllerDebugRoot.setAttribute('aria-live', 'polite');
    this.controllerDebugRoot.setAttribute('data-testid', 'controller-debug');
    this.controllerDebugRoot.hidden = true;
    const stageRoot = this.overlayRoot.parentElement ?? this.hudRoot.parentElement;
    stageRoot?.appendChild(this.controllerDebugRoot);

    bridge.bindHudListener((snapshot) => {
      this.renderHud(snapshot);
    });

    bridge.bindOverlayListener((state) => {
      this.renderOverlay(state);
    });

    this.renderControllerDebug();
    window.setInterval(() => {
      this.renderControllerDebug();
    }, 120);
  }

  private renderControllerDebug(): void {
    const gamepadDebug = getBrowserGamepadDebugState();
    const webHidDebug = getWebHidDebugState();

    const markup = `
      <h2 class="controller-debug__title">Controller Debug</h2>
      <div class="controller-debug__section">
        <div class="controller-debug__section-title">Gamepad API</div>
        <div class="controller-debug__row"><span>Page Focus</span><strong>${gamepadDebug.pageFocused ? 'yes' : 'no'}</strong></div>
        <div class="controller-debug__row"><span>Raw Slots</span><strong>${gamepadDebug.visiblePadCount}/${gamepadDebug.slotCount}</strong></div>
        <div class="controller-debug__row"><span>Controller</span><strong>${gamepadDebug.connected ? 'detected' : 'not detected'}</strong></div>
        ${
          gamepadDebug.connected
            ? `
      <div class="controller-debug__row"><span>Index</span><strong>${gamepadDebug.index}</strong></div>
      <div class="controller-debug__row"><span>Mapping</span><strong>${gamepadDebug.mapping}</strong></div>
      <div class="controller-debug__row"><span>Axes</span><strong>X ${gamepadDebug.axisX.toFixed(2)} / Y ${gamepadDebug.axisY.toFixed(2)}</strong></div>
      <div class="controller-debug__row"><span>A Jump</span><strong>${gamepadDebug.buttons.a ? 'pressed' : 'idle'}</strong></div>
      <div class="controller-debug__row"><span>X Sprint</span><strong>${gamepadDebug.buttons.x ? 'pressed' : 'idle'}</strong></div>
      <div class="controller-debug__row"><span>Y Restart</span><strong>${gamepadDebug.buttons.y ? 'pressed' : 'idle'}</strong></div>
      <div class="controller-debug__row"><span>Start Pause</span><strong>${gamepadDebug.buttons.start ? 'pressed' : 'idle'}</strong></div>
      <div class="controller-debug__row"><span>D-pad</span><strong>${[
        gamepadDebug.buttons.dpadUp ? 'U' : '',
        gamepadDebug.buttons.dpadDown ? 'D' : '',
        gamepadDebug.buttons.dpadLeft ? 'L' : '',
        gamepadDebug.buttons.dpadRight ? 'R' : '',
      ].filter(Boolean).join(' ') || 'idle'}</strong></div>
      <div class="controller-debug__hint">${gamepadDebug.id ?? 'Unknown controller'}</div>
            `
            : `
      <div class="controller-debug__hint">Press a button on the controller while this page is focused.</div>
            `
        }
        <div class="controller-debug__list">${gamepadDebug.rawSlots.map((slot) => `<div>${slot}</div>`).join('')}</div>
        <div class="controller-debug__events">${gamepadDebug.eventLog.length > 0 ? gamepadDebug.eventLog.map((entry) => `<div>${entry}</div>`).join('') : '<div>no gamepad events received</div>'}</div>
      </div>
      <div class="controller-debug__section">
        <div class="controller-debug__section-title">WebHID Fallback</div>
        <div class="controller-debug__row"><span>Supported</span><strong>${webHidDebug.supported ? 'yes' : 'no'}</strong></div>
        <div class="controller-debug__row"><span>Granted Devices</span><strong>${webHidDebug.permissionCount}</strong></div>
        <div class="controller-debug__row"><span>Connected</span><strong>${webHidDebug.connected ? 'yes' : 'no'}</strong></div>
        <div class="controller-debug__row"><span>Opened</span><strong>${webHidDebug.opened ? 'yes' : 'no'}</strong></div>
        <div class="controller-debug__row"><span>Calibration</span><strong>${webHidDebug.calibrationStatus}</strong></div>
        <div class="controller-debug__row"><span>Mapped Actions</span><strong>${webHidDebug.calibratedActions.join(', ') || 'none'}</strong></div>
        ${
          webHidDebug.snapshot
            ? `
      <div class="controller-debug__row"><span>A Jump</span><strong>${webHidDebug.snapshot.jump ? 'pressed' : 'idle'}</strong></div>
      <div class="controller-debug__row"><span>X Sprint</span><strong>${webHidDebug.snapshot.run ? 'pressed' : 'idle'}</strong></div>
      <div class="controller-debug__row"><span>Y Restart</span><strong>${webHidDebug.snapshot.restart ? 'pressed' : 'idle'}</strong></div>
      <div class="controller-debug__row"><span>Start Pause</span><strong>${webHidDebug.snapshot.pause ? 'pressed' : 'idle'}</strong></div>
      <div class="controller-debug__row"><span>D-pad</span><strong>${[
        webHidDebug.snapshot.left ? 'L' : '',
        webHidDebug.snapshot.right ? 'R' : '',
        webHidDebug.snapshot.down ? 'D' : '',
      ].filter(Boolean).join(' ') || 'idle'}</strong></div>
            `
            : ''
        }
        <div class="controller-debug__controls">
          <button
            type="button"
            class="controller-debug__button"
            data-testid="webhid-connect-button"
            ${webHidDebug.supported ? '' : 'disabled'}
          >
            ${webHidDebug.requestPending ? 'Waiting…' : 'Connect Controller'}
          </button>
          <button
            type="button"
            class="controller-debug__button"
            data-testid="webhid-calibrate-button"
            ${webHidDebug.connected ? '' : 'disabled'}
          >
            Calibrate Buttons
          </button>
          <button
            type="button"
            class="controller-debug__button"
            data-testid="webhid-reset-button"
            ${webHidDebug.connected || webHidDebug.calibratedActions.length > 0 ? '' : 'disabled'}
          >
            Reset Calibration
          </button>
        </div>
        ${
          webHidDebug.connected
            ? `<div class="controller-debug__hint">${[
                webHidDebug.productName ?? 'Unknown WebHID device',
                webHidDebug.vendorId !== null ? `vendor 0x${webHidDebug.vendorId.toString(16)}` : null,
                webHidDebug.productId !== null ? `product 0x${webHidDebug.productId.toString(16)}` : null,
              ].filter(Boolean).join(' • ')}</div>`
            : '<div class="controller-debug__hint">Use the connect button, then calibrate A, X, Y, Start, and D-pad directions.</div>'
        }
        <div class="controller-debug__list">${(webHidDebug.collectionSummary.length > 0 ? webHidDebug.collectionSummary : ['no WebHID collections visible']).map((entry) => `<div>${entry}</div>`).join('')}</div>
        <div class="controller-debug__events">${webHidDebug.eventLog.length > 0 ? webHidDebug.eventLog.map((entry) => `<div>${entry}</div>`).join('') : '<div>no WebHID events received</div>'}</div>
        <div class="controller-debug__hint">${webHidDebug.lastReportHex ? `report ${webHidDebug.lastReportId ?? 0}: ${webHidDebug.lastReportHex}` : webHidDebug.error ?? 'no input report captured yet'}</div>
      </div>
    `;

    if (markup === this.lastControllerDebugMarkup) {
      return;
    }

    this.lastControllerDebugMarkup = markup;
    this.controllerDebugRoot.innerHTML = markup;
    this.controllerDebugRoot.hidden = true;

    const connectButton = this.controllerDebugRoot.querySelector<HTMLButtonElement>('[data-testid="webhid-connect-button"]');
    connectButton?.addEventListener('click', () => {
      void requestWebHidController();
    });

    const calibrateButton = this.controllerDebugRoot.querySelector<HTMLButtonElement>('[data-testid="webhid-calibrate-button"]');
    calibrateButton?.addEventListener('click', () => {
      beginWebHidCalibration();
    });

    const resetButton = this.controllerDebugRoot.querySelector<HTMLButtonElement>('[data-testid="webhid-reset-button"]');
    resetButton?.addEventListener('click', () => {
      resetWebHidCalibration();
    });
  }

  private renderHud(snapshot: HudSnapshot): void {
    this.hudRoot.innerHTML = `
      <section class="hud" aria-label="Game stats" data-testid="hud">
        <div class="hud__row">
          <span class="hud__label">Score</span>
          <span class="hud__value hud__value--score" data-testid="score-value">${snapshot.score}</span>
        </div>
        <div class="hud__row">
          <span class="hud__label">High Score</span>
          <span class="hud__value" data-testid="high-score-value">${snapshot.highScore}</span>
        </div>
        <div class="hud__row">
          <span class="hud__label">Carrots</span>
          <span class="hud__value" data-testid="carrots-value">${snapshot.carrotsCollected}/${snapshot.totalCarrots}</span>
        </div>
        <div class="hud__row">
          <span class="hud__label">Timer</span>
          <span class="hud__value" data-testid="timer-value">${snapshot.timerLabel}</span>
        </div>
        <div class="hud__status ${snapshot.isOvertime ? 'hud__status--overtime' : ''}" data-testid="timer-status">
          ${snapshot.statusLabel}
        </div>
      </section>
    `;
  }

  private renderOverlay(state: OverlayState): void {
    if (state.type === 'hidden') {
      this.overlayRoot.innerHTML = '';
      return;
    }

    if (state.type === 'menu') {
      this.overlayRoot.innerHTML = `
        <section class="overlay" aria-label="Start menu" data-testid="menu-overlay">
          <div class="overlay__backdrop"></div>
          <article class="overlay__panel">
            <p class="overlay__eyebrow">A Fredda Rose Game Studio Production</p>
            <h1 class="overlay__title">Catch every carrot you can.</h1>
            <p class="overlay__body">
              Each run is a one-minute side-scrolling sprint with safe ground, floating carrot arcs,
              and a finish-line feast. Reach the banner and your bunny gulps every leftover carrot.
            </p>
            <div class="overlay__stats">
              <div class="overlay__stat">
                <span class="overlay__stat-label">Session High Score</span>
                <span class="overlay__stat-value" data-testid="menu-high-score">${state.highScore}</span>
              </div>
            </div>
            <div class="overlay__controls">
              <span class="overlay__hint">Press Enter, Space, or Xbox A to start</span>
              <span>Move with arrows or WASD. Sprint with Shift, X, or Xbox X.</span>
              <span>Slide with Down, S, or Xbox D-pad Down. Jump with Space, W, Z, Up, or Xbox A.</span>
            </div>
          </article>
        </section>
      `;
      return;
    }

    if (state.type === 'pause') {
      this.overlayRoot.innerHTML = `
        <section class="overlay" aria-label="Pause menu" data-testid="pause-overlay">
          <div class="overlay__backdrop"></div>
          <article class="overlay__panel">
            <p class="overlay__eyebrow">Paused</p>
            <h1 class="overlay__title">Take a breath.</h1>
            <p class="overlay__body">
              The bunny is waiting at the edge of the meadow. Press Escape or Xbox Start to jump
              back in, or restart this run from the top.
            </p>
            <div class="overlay__controls">
              <button type="button" class="overlay__button" data-testid="pause-restart-button">
                Restart Level
              </button>
              <span>Press R on keyboard or Xbox Y to restart.</span>
            </div>
          </article>
        </section>
      `;
      const restartButton = this.overlayRoot.querySelector<HTMLButtonElement>('[data-testid="pause-restart-button"]');
      restartButton?.addEventListener('click', () => {
        this.bridge.sendOverlayAction('restart_level');
      });
      return;
    }

    this.overlayRoot.innerHTML = `
      <section class="overlay" aria-label="Results" data-testid="results-overlay">
        <div class="overlay__backdrop"></div>
        <article class="overlay__panel">
          <p class="overlay__eyebrow">Finish Line Feast</p>
          <h1 class="overlay__title">The bunny cleaned the field.</h1>
          <p class="overlay__body">
            You crossed the banner in ${state.elapsedLabel} and the bunny chomped every carrot left
            on the course.
          </p>
          <div class="overlay__stats">
            <div class="overlay__stat">
              <span class="overlay__stat-label">Run Score</span>
              <span class="overlay__stat-value" data-testid="results-run-score">${state.score}</span>
            </div>
            <div class="overlay__stat">
              <span class="overlay__stat-label">Finish Feast Bonus</span>
              <span class="overlay__stat-value" data-testid="results-finish-bonus">+${state.finishBonus}</span>
            </div>
            <div class="overlay__stat">
              <span class="overlay__stat-label">Session High Score</span>
              <span class="overlay__stat-value" data-testid="results-high-score">${state.highScore}</span>
            </div>
          </div>
          <div class="overlay__controls">
            <span class="overlay__hint">Press Enter or Xbox A to run again</span>
          </div>
        </article>
      </section>
    `;
  }
}
