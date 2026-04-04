import { expect, test } from '@playwright/test';

test.describe('Deployed site smoke', () => {
  test('renders the live landing view on GitHub Pages', async ({ page }) => {
    const pageErrors: string[] = [];

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    page.on('console', (message) => {
      if (message.type() === 'error') {
        pageErrors.push(message.text());
      }
    });

    await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? '/');

    await expect(page.locator('.title-chip')).toBeVisible();
    await expect(page.locator('.title-chip')).toContainText(/bunny catching carrots/i);
    await expect(page.getByTestId('menu-overlay')).toBeVisible();
    await expect(page.getByTestId('menu-high-score')).toHaveText('0');
    await expect(page.locator('canvas')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
