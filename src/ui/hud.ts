import type { HudSnapshot, OverlayState, SceneBridge } from '../phaser/adapters/sceneBridge';

export class HudController {
  private readonly hudRoot: HTMLElement;
  private readonly overlayRoot: HTMLElement;

  constructor(
    hudRoot: HTMLElement,
    overlayRoot: HTMLElement,
    bridge: SceneBridge,
  ) {
    this.hudRoot = hudRoot;
    this.overlayRoot = overlayRoot;

    bridge.bindHudListener((snapshot) => {
      this.renderHud(snapshot);
    });

    bridge.bindOverlayListener((state) => {
      this.renderOverlay(state);
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
            <p class="overlay__eyebrow">Retro Bunny Run</p>
            <h1 class="overlay__title">Catch every carrot you can.</h1>
            <p class="overlay__body">
              Each run is a one-minute side-scrolling sprint with safe ground, sky platforms, and a
              finish-line feast. Reach the banner and your bunny gulps every leftover carrot.
            </p>
            <div class="overlay__stats">
              <div class="overlay__stat">
                <span class="overlay__stat-label">Session High Score</span>
                <span class="overlay__stat-value" data-testid="menu-high-score">${state.highScore}</span>
              </div>
            </div>
            <div class="overlay__controls">
              <span class="overlay__hint">Press Enter, Space, or Xbox A to start</span>
              <span>Move with arrows or WASD. Jump with Space, W, Z, Up, or Xbox A.</span>
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
              back in.
            </p>
          </article>
        </section>
      `;
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
