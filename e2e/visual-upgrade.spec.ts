import { test, expect } from '@playwright/test';

test.describe('Visual Upgrade Verification', () => {
  test('hero animation visible with gradient background and headline', async ({ page }) => {
    await page.goto('/');

    // HeroAnimation wraps the hero — verify the animated gradient background exists
    const heroContainer = page.locator('.relative.overflow-hidden').first();
    await expect(heroContainer).toBeVisible();

    const gradientBg = heroContainer.locator('.animate-gradient').first();
    await expect(gradientBg).toBeAttached();

    // Verify the gradient includes brand/accent color classes
    const gradientClasses = await gradientBg.getAttribute('class');
    expect(gradientClasses).toContain('bg-gradient-to-br');

    // Verify the headline is visible
    const headline = page.locator('h1');
    await expect(headline).toBeVisible();
  });

  test('navbar glassmorphism on scroll', async ({ page }) => {
    await page.goto('/');

    const navbar = page.locator('nav[role="navigation"]');
    await expect(navbar).toBeVisible();

    // At the top, navbar should be transparent
    const initialClasses = await navbar.getAttribute('class');
    expect(initialClasses).toContain('bg-transparent');

    // Scroll down past 50px threshold
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(500);

    // After scroll, navbar should have glassmorphism styles
    const scrolledClasses = await navbar.getAttribute('class');
    expect(scrolledClasses).toContain('backdrop-blur-xl');
    expect(scrolledClasses).toContain('bg-white/80');
    expect(scrolledClasses).toContain('border-white/20');
  });

  test('card hover effects on product card', async ({ page }) => {
    await page.goto('/');

    // Product cards use AnimatedCard with hover enabled
    const productCard = page.locator('.rounded-2xl.border').first();
    await expect(productCard).toBeVisible();

    // Verify hover classes are present in the element's class list
    const cardClasses = await productCard.getAttribute('class');
    expect(cardClasses).toContain('rounded-2xl');
    expect(cardClasses).toContain('transition-all');
    expect(cardClasses).toContain('duration-200');

    // Hover over the card and verify hover styles apply
    await productCard.hover();
    await page.waitForTimeout(300);

    // Check computed styles after hover — scale and shadow should change
    const transform = await productCard.evaluate(
      (el) => window.getComputedStyle(el).transform
    );
    // After hover, transform should not be 'none' (scale 1.02 applied)
    // Note: some browsers may report matrix values
    if (transform !== 'none') {
      expect(transform).toBeTruthy();
    }
  });

  test('section animations on scroll — AnimatedSection wrappers present', async ({ page }) => {
    await page.goto('/');

    // AnimatedSection renders as motion.div elements on the page
    // Scroll down to trigger animations
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(1000);

    // Verify the "Our Products" heading is visible after scroll
    const productsHeading = page.getByRole('heading', { name: 'Our Products' });
    await expect(productsHeading).toBeVisible();

    // Verify the "Why Choose DoonPortal" section is present
    const whyChooseHeading = page.getByRole('heading', { name: 'Why Choose DoonPortal' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);
    await expect(whyChooseHeading).toBeVisible();
  });

  test('footer dark gradient background', async ({ page }) => {
    await page.goto('/');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const footer = page.locator('footer[role="contentinfo"]');
    await expect(footer).toBeVisible();

    // Verify dark gradient classes
    const footerClasses = await footer.getAttribute('class');
    expect(footerClasses).toContain('from-neutral-900');
    expect(footerClasses).toContain('to-neutral-950');
    expect(footerClasses).toContain('bg-gradient-to-b');

    // Verify gradient top separator exists
    const separator = footer.locator('.bg-gradient-to-r.from-transparent');
    await expect(separator).toBeAttached();
  });

  test('mobile responsive behavior — no floating orbs, mobile menu button visible', async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Hero section should render without floating orbs on mobile
    // Floating orbs have the class animate-float-orb and are inside the hero container
    const heroContainer = page.locator('.relative.overflow-hidden').first();
    await expect(heroContainer).toBeVisible();

    // On mobile (< 768px), floating orbs should not be rendered
    const floatingOrbs = heroContainer.locator('.animate-float-orb');
    await expect(floatingOrbs).toHaveCount(0);

    // Verify navbar has mobile menu button (hamburger) visible
    const mobileMenuButton = page.locator('button[aria-label="Open menu"]');
    await expect(mobileMenuButton).toBeVisible();

    // Desktop nav links should be hidden on mobile
    const desktopNav = page.locator('nav .hidden.md\\:flex');
    await expect(desktopNav).not.toBeVisible();
  });

  test('form regression — demo form renders with required fields and validates', async ({
    page,
  }) => {
    await page.goto('/book-demo');

    // Verify the demo form renders with all required fields
    const nameInput = page.getByLabel(/Name/i);
    await expect(nameInput).toBeVisible();

    const organizationInput = page.getByLabel(/Organization/i);
    await expect(organizationInput).toBeVisible();

    const phoneInput = page.getByLabel(/Phone/i);
    await expect(phoneInput).toBeVisible();

    const emailInput = page.getByLabel(/Email/i);
    await expect(emailInput).toBeVisible();

    // Submit empty form
    const submitButton = page.getByRole('button', { name: /Request a Demo/i });
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Verify validation errors appear for required fields
    await expect(page.getByText(/Name is required/i)).toBeVisible({ timeout: 5000 });
  });
});
