import { test, expect } from '@playwright/test';

test('Lobby loads, starts game against bot, and renders bot speech bubble', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('DEAL DECK CLASH');

  // Click start game button
  const startBtn = page.getByRole('button', { name: /QUICK MATCH/i });
  await startBtn.click();

  // Wait for boardroom view to render
  await expect(page.getByText('Boardroom', { exact: true })).toBeVisible();

  // Click End Turn to pass turn to bot
  const endTurnBtn = page.getByRole('button', { name: /End Turn/i });
  await endTurnBtn.click();

  // Wait for bot to take action and render tactical speech bubble commentary
  await expect(page.getByRole('heading', { name: 'Rich Aunt Bot' })).toBeVisible();
  await expect(page.locator('text=Weight:').first()).toBeVisible({ timeout: 5000 });
});
