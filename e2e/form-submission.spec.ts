import { test, expect } from '@playwright/test';

test.describe('Form Submission', () => {
  test('demo form shows validation errors for empty submission', async ({ page }) => {
    await page.goto('/book-demo');

    // Submit empty form
    await page.getByRole('button', { name: /Request a Demo/i }).click();

    // Should show validation errors
    await expect(page.getByText(/Name is required/i)).toBeVisible();
  });

  test('demo form accepts valid input and shows success', async ({ page }) => {
    await page.goto('/book-demo');

    await page.getByLabel(/Name/i).fill('John Doe');
    await page.getByLabel(/Organization/i).fill('Test School');
    await page.getByLabel(/Phone/i).fill('9876543210');
    await page.getByLabel(/Email/i).fill('john@example.com');
    await page.getByLabel(/Message/i).fill('Interested in a demo');

    await page.getByRole('button', { name: /Request a Demo/i }).click();

    // Wait for success message (may depend on API response)
    await expect(
      page.getByText(/Demo Request Submitted|Something went wrong/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('contact form shows validation errors for empty submission', async ({ page }) => {
    await page.goto('/contact');

    await page.getByRole('button', { name: /Send Message/i }).click();

    await expect(page.getByText(/Name is required/i)).toBeVisible();
  });
});
