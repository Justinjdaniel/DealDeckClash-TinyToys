import { test, expect } from "@playwright/test";

test("Lobby loads, starts game, and verifies mobile UI and settings modal", async ({ page }) => {
  await page.goto("http://localhost:5173");

  // Check title on main menu portal
  await expect(page.locator("h1")).toContainText("MONOPOLY DEAL");

  // Screenshot Menu Portal
  await page.screenshot({ path: "screenshots/menu-portal.png" });

  // Click Quick Play vs AI
  await page.getByText("Quick Play vs AI").click();

  // Verify Game Layout loaded
  await expect(page.getByText("Opponent Board")).toBeVisible();
  await expect(page.getByText("Your Board")).toBeVisible();

  // Screenshot Mobile Game View
  await page.screenshot({ path: "screenshots/game-layout.png" });

  // Open Settings Modal
  await page.locator("button[title='Settings & Rules']").click();
  await expect(page.getByText("Sound Effects Volume")).toBeVisible();

  // Screenshot Settings Modal
  await page.screenshot({ path: "screenshots/settings-modal.png" });
});
