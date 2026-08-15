import { test, expect } from '@playwright/test';

test('Testing modal interactions for crashes', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message + '\n' + err.stack));

  await page.goto('/');
  await page.getByRole('button', { name: /QUICK MATCH/i }).click();

  // Test 1: Open Logs Modal
  const logsBtn = page.getByRole('button', { name: /Console Logs/i });
  await logsBtn.click();
  await expect(page.getByText('Board Console Logs')).toBeVisible();
  // Close Logs Modal
  await page.getByRole('button', { name: /Close Logs Dialog/i }).click();

  // Test 2: Hand card click -> Action menu modal
  const handCards = page.locator('button[aria-label^="Select hand card"]');
  await handCards.first().click({ force: true });

  // Verify modal is open
  const cancelBtn = page.getByRole('button', { name: /Cancel Selection/i });
  await expect(cancelBtn).toBeVisible();

  // Click cancel
  await cancelBtn.click();

  console.log('Errors captured:', errors);
  expect(errors).toEqual([]);
});
