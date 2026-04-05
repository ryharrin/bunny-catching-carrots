import { expect, test, type Page } from '@playwright/test';

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
    __FAKE_GAMEPAD__?: {
      setButton(index: number, pressed: boolean): void;
    };
    __FAKE_WEBHID__?: {
      emitReport(reportId: number, bytes: number[]): void;
    };
  }
}

async function installFakeGamepad(page: Page) {
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 17 }, () => ({
      pressed: false,
      touched: false,
      value: 0,
    }));
    const pad = {
      axes: [0, 0, 0, 0],
      buttons,
      connected: true,
      id: 'Xbox Wireless Controller',
      index: 0,
      mapping: 'standard',
      timestamp: 0,
      vibrationActuator: null,
      hapticActuators: [],
      pose: undefined,
      hand: '',
      displayId: 0,
    } as Gamepad;

    window.__FAKE_GAMEPAD__ = {
      setButton(index: number, pressed: boolean) {
        const button = buttons[index];

        if (!button) {
          return;
        }

        button.pressed = pressed;
        button.touched = pressed;
        button.value = pressed ? 1 : 0;
        pad.timestamp += 1;
      },
    };

    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => [pad],
    });
  });
}

async function setFakeGamepadButton(page: Page, index: number, pressed: boolean) {
  await page.evaluate(
    ([buttonIndex, isPressed]) => {
      window.__FAKE_GAMEPAD__?.setButton(buttonIndex, isPressed);
    },
    [index, pressed] as const,
  );
}

async function installFakeWebHid(page: Page) {
  await page.addInitScript(() => {
    const hidListeners = {
      connect: [] as Array<(event: Event & { device: unknown }) => void>,
      disconnect: [] as Array<(event: Event & { device: unknown }) => void>,
    };
    const inputListeners: Array<(event: Event & { data: DataView; device: unknown; reportId: number }) => void> = [];
    const device = {
      opened: false,
      vendorId: 0x045e,
      productId: 0x0b13,
      productName: 'Xbox Wireless Controller via WebHID',
      collections: [{ usagePage: 0x01, usage: 0x05 }],
      async open() {
        this.opened = true;
      },
      addEventListener(type: string, listener: (event: Event & { data: DataView; device: unknown; reportId: number }) => void) {
        if (type === 'inputreport') {
          inputListeners.push(listener);
        }
      },
    };

    const hid = {
      async getDevices() {
        return [];
      },
      async requestDevice() {
        hidListeners.connect.forEach((listener) => listener({ device } as Event & { device: unknown }));
        return [device];
      },
      addEventListener(type: 'connect' | 'disconnect', listener: (event: Event & { device: unknown }) => void) {
        hidListeners[type].push(listener);
      },
    };

    Object.defineProperty(navigator, 'hid', {
      configurable: true,
      value: hid,
    });

    window.__FAKE_WEBHID__ = {
      emitReport(reportId: number, bytes: number[]) {
        const payload = Uint8Array.from(bytes);
        const view = new DataView(payload.buffer.slice(0));
        inputListeners.forEach((listener) =>
          listener({ data: view, device, reportId } as Event & { data: DataView; device: unknown; reportId: number }),
        );
      },
    };
  });
}

async function emitFakeWebHidReport(page: Page, reportId: number, bytes: number[]) {
  await page.evaluate(
    ([currentReportId, currentBytes]) => {
      window.__FAKE_WEBHID__?.emitReport(currentReportId, [...currentBytes]);
    },
    [reportId, bytes] as const,
  );
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

  test('restarts the current run from the pause menu', async ({ page }) => {
    await page.evaluate(() => {
      window.__BUNNY_DEBUG__?.startRun();
    });
    await page.waitForFunction(() => window.__BUNNY_DEBUG__?.getActiveScene() === 'GameScene');

    await page.evaluate(() => {
      window.__BUNNY_DEBUG__?.collectCarrots(2);
    });

    await expect(page.getByTestId('score-value')).not.toHaveText('0');

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('pause-overlay')).toBeVisible();

    await page.getByTestId('pause-restart-button').click();

    await expect(page.getByTestId('pause-overlay')).toHaveCount(0);
    await expect(page.getByTestId('score-value')).toHaveText('0');
    await expect(page.getByTestId('timer-status')).toHaveText('Time Left');
  });

  test('uses a browser gamepad to start and restart a run while updating the diagnostics panel', async ({
    page,
  }) => {
    await installFakeGamepad(page);
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.__BUNNY_DEBUG__ !== 'undefined');
    await page.waitForFunction(() => window.__BUNNY_DEBUG__?.getActiveScene() === 'MenuScene');

    await expect(page.getByTestId('controller-debug')).toContainText('Xbox Wireless Controller');
    await expect(page.getByTestId('controller-debug')).toContainText('Raw Slots');

    await setFakeGamepadButton(page, 0, true);
    await page.waitForFunction(() => window.__BUNNY_DEBUG__?.getActiveScene() === 'GameScene');
    await setFakeGamepadButton(page, 0, false);

    await page.evaluate(() => {
      window.__BUNNY_DEBUG__?.collectCarrots(2);
    });

    await expect(page.getByTestId('score-value')).not.toHaveText('0');

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('pause-overlay')).toBeVisible();

    await setFakeGamepadButton(page, 3, true);
    await expect(page.getByTestId('controller-debug')).toContainText('Y Restart');
    await page.waitForTimeout(160);
    await setFakeGamepadButton(page, 3, false);

    await expect(page.getByTestId('pause-overlay')).toHaveCount(0);
    await expect(page.getByTestId('score-value')).toHaveText('0');
  });

  test('connects and calibrates a WebHID controller fallback', async ({ page }) => {
    await installFakeWebHid(page);
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.__BUNNY_DEBUG__ !== 'undefined');

    await expect(page.getByTestId('controller-debug')).toContainText('WebHID Fallback');
    await page.getByTestId('webhid-connect-button').click();
    await expect(page.getByTestId('controller-debug')).toContainText('Xbox Wireless Controller via WebHID');

    await page.getByTestId('webhid-calibrate-button').click();
    await expect(page.getByTestId('controller-debug')).toContainText('press A / Jump');

    const calibrationReports: number[] = [1, 2, 4, 8, 16, 32, 64];
    for (const reportValue of calibrationReports) {
      await emitFakeWebHidReport(page, 1, [reportValue]);
      await emitFakeWebHidReport(page, 1, [0]);
    }

    await expect(page.getByTestId('controller-debug')).toContainText('ready');
    await expect(page.getByTestId('controller-debug')).toContainText(
      'down, jump, left, pause, restart, right, run',
    );

    await emitFakeWebHidReport(page, 1, [1]);
    await page.waitForFunction(() => window.__BUNNY_DEBUG__?.getActiveScene() === 'GameScene');
    await emitFakeWebHidReport(page, 1, [0]);

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('pause-overlay')).toBeVisible();

    await emitFakeWebHidReport(page, 1, [4]);
    await page.waitForTimeout(160);
    await emitFakeWebHidReport(page, 1, [0]);

    await expect(page.getByTestId('pause-overlay')).toHaveCount(0);
    await expect(page.getByTestId('score-value')).toHaveText('0');
  });
});
