import { expect, test } from '@playwright/test';

declare global {
  interface Window {
    __BUNNY_DEBUG__?: {
      collectCarrots(count?: number): number;
      clearSessionHighScore(): void;
      forceFinish(): void;
      getActiveScene(): string | null;
      getSessionHighScore(): number;
      startRun(): void;
    };
  }
}

test.describe('Bunny Catching Carrots e2e', () => {
  test.beforeEach(async ({ page }) => {
    const pageErrors: string[] = [];

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    page.on('console', (message) => {
      if (message.type() === 'error') {
        pageErrors.push(message.text());
      }
    });

    await page.goto('/');
    await page.waitForFunction(() => typeof window.__BUNNY_DEBUG__ !== 'undefined');
    await page.evaluate(() => {
      window.__BUNNY_DEBUG__?.clearSessionHighScore();
      window.location.reload();
    });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.__BUNNY_DEBUG__ !== 'undefined');
    await page.waitForFunction(() => window.__BUNNY_DEBUG__?.getActiveScene() === 'MenuScene');

    test.info().attach('page-errors', {
      body: JSON.stringify(pageErrors),
      contentType: 'application/json',
    });
  });

  test('starts a run from the menu and shows the live hud', async ({ page }) => {
    await expect(page.getByTestId('menu-overlay')).toBeVisible();
    await expect(page.getByTestId('menu-high-score')).toHaveText('0');

    await page.evaluate(() => {
      window.__BUNNY_DEBUG__?.startRun();
    });
    await page.waitForFunction(() => window.__BUNNY_DEBUG__?.getActiveScene() === 'GameScene');

    await expect(page.getByTestId('menu-overlay')).toHaveCount(0);
    await expect(page.getByTestId('hud')).toBeVisible();
    await expect(page.getByTestId('score-value')).toHaveText('0');
    await expect(page.getByTestId('high-score-value')).toHaveText('0');
    await expect(page.getByTestId('timer-status')).toHaveText('Time Left');
    await expect(page.getByTestId('timer-value')).toContainText('s');
  });

  test('persists the collected run score as the session high score after finishing', async ({ page }) => {
    await page.evaluate(() => {
      window.__BUNNY_DEBUG__?.startRun();
    });
    await page.waitForFunction(() => window.__BUNNY_DEBUG__?.getActiveScene() === 'GameScene');

    await page.evaluate(() => {
      window.__BUNNY_DEBUG__?.collectCarrots(3);
    });

    const liveScore = await page.getByTestId('score-value').textContent();
    expect(liveScore).not.toBeNull();
    expect(Number.parseInt(liveScore ?? '0', 10)).toBeGreaterThan(0);
    await expect(page.getByTestId('high-score-value')).toHaveText(liveScore ?? '0');

    await page.evaluate(() => {
      window.__BUNNY_DEBUG__?.forceFinish();
    });

    await expect(page.getByTestId('results-overlay')).toBeVisible();

    await expect(page.getByTestId('results-run-score')).toHaveText(liveScore ?? '0');
    const highScore = await page.getByTestId('results-high-score').textContent();
    expect(highScore).not.toBeNull();
    expect(highScore).toBe(liveScore);

    await page.reload();
    await page.waitForFunction(() => typeof window.__BUNNY_DEBUG__ !== 'undefined');

    await expect(page.getByTestId('menu-overlay')).toBeVisible();
    await expect(page.getByTestId('menu-high-score')).toHaveText(highScore ?? '0');
  });
});
