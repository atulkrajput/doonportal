import { test, expect } from '@playwright/test';

test.describe('Homepage → Product → Demo Flow', () => {
  test('navigate from homepage to product page to demo form', async ({ page }) => {
    await page.goto('/');

    // Click on a product card to go to product page
    await page.getByRole('link', { name: /School Management/i }).first().click();
    await expect(page).toHaveURL('/products/school-management');
    await expect(page.locator('h1')).toContainText(/School Management/i);

    // Click Request Demo CTA on product page
    await page.getByRole('link', { name: /Request Demo|Book Demo/i }).first().click();
    await expect(page).toHaveURL('/book-demo');

    // Verify demo form is visible
    await expect(page.getByLabel(/Name/i)).toBeVisible();
    await expect(page.getByLabel(/Organization/i)).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Phone/i)).toBeVisible();
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('open hamburger menu and navigate', async ({ page }) => {
    await page.goto('/');

    // Open mobile menu
    await page.getByLabel(/Open menu/i).click();

    // Navigate to About page from mobile menu
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL('/about');
  });
});
