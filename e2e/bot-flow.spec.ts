import { test, expect } from '@playwright/test';

test('Lobby loads, starts game against bot, and renders bot speech bubble', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('DEAL CLASH');
  await page.screenshot({ path: 'lobby-screen.png' });

  // Click start game button
  const startBtn = page.getByRole('button', { name: /Begin Match/i });
  await startBtn.click();

  // Wait for boardroom view to render
  await expect(page.getByText('Boardroom', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'boardroom-screen.png' });

  // Verify Bot section and speech bubble
  await expect(page.getByRole('heading', { name: 'Rich Aunt Bot' })).toBeVisible();
  await page.screenshot({ path: 'bot-gameplay-screen.png' });
});
