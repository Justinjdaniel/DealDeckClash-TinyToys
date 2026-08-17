import { test, expect } from '@playwright/test';

test('Lobby loads and shows title', async ({ page }) => {
  await page.goto('/');
  const title = page.locator('h1');
  await expect(title).toContainText('DEAL DECK CLASH');
});
