import { test, expect } from '@playwright/test';

test('Lobby loads and shows title', async ({ page }) => {
  // Spins up or navigates to local web server
  await page.goto('http://localhost:5173/');
  const title = page.locator('h1');
  await expect(title).toContainText('DEAL CLASH');
});
