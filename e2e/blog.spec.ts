import { test, expect } from '@playwright/test';

test.describe('Blog Navigation', () => {
  test('blog listing page loads with posts', async ({ page }) => {
    await page.goto('/blog');
    await expect(page).toHaveTitle(/Blog/i);

    // Should have at least one blog post card
    const postLinks = page.locator('a[href^="/blog/"]');
    await expect(postLinks.first()).toBeVisible();
  });

  test('navigate from blog listing to blog post', async ({ page }) => {
    await page.goto('/blog');

    // Click the first blog post link
    const firstPost = page.locator('a[href^="/blog/"]').first();
    await firstPost.click();

    // Should be on a blog post page
    await expect(page).toHaveURL(/\/blog\/.+/);

    // Blog post should have a title (h1)
    await expect(page.locator('h1')).toBeVisible();
  });
});
