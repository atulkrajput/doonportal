import { test, expect } from '@playwright/test';

test.describe('Site Navigation', () => {
  test('homepage loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DoonPortal/);
  });

  test('navigate to Solutions page via navbar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Solutions' }).first().click();
    await expect(page).toHaveURL('/solutions');
  });

  test('navigate to About page via navbar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'About' }).first().click();
    await expect(page).toHaveURL('/about');
  });

  test('navigate to Blog page via navbar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Blog' }).first().click();
    await expect(page).toHaveURL('/blog');
  });

  test('navigate to Contact page via navbar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Contact' }).first().click();
    await expect(page).toHaveURL('/contact');
  });

  test('navigate to Book Demo page via CTA button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Book Demo' }).first().click();
    await expect(page).toHaveURL('/book-demo');
  });

  test('all product pages are accessible', async ({ page }) => {
    const productPages = [
      '/products/school-management',
      '/products/inventory-pos',
      '/products/dairy-management',
    ];
    for (const url of productPages) {
      await page.goto(url);
      await expect(page.locator('h1')).toBeVisible();
    }
  });
});
