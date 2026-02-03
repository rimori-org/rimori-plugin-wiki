import { test, expect } from '@playwright/test';

test('dummy test', async ({ page }) => {
  // This is a dummy test for Playwright
  await page.goto('https://example.com/');
  await expect(page).toHaveTitle(/Example Domain/);
});