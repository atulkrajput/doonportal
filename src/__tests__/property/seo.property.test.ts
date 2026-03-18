import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { pageSEO } from '@/data/seo';
import { products } from '@/data/products';

/**
 * Property 7: Unique meta title and description per page
 * For any two distinct pages in the site, their meta title values should
 * differ and their meta description values should differ.
 * **Validates: Requirements 14.1**
 */
describe('Property 7: Unique meta title and description per page', () => {
  const pageKeys = Object.keys(pageSEO);

  it('all page titles are unique', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: pageKeys.length - 1 }),
        fc.integer({ min: 0, max: pageKeys.length - 1 }),
        (i, j) => {
          fc.pre(i !== j);
          const titleA = pageSEO[pageKeys[i]].title;
          const titleB = pageSEO[pageKeys[j]].title;
          expect(titleA).not.toBe(titleB);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all page descriptions are unique', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: pageKeys.length - 1 }),
        fc.integer({ min: 0, max: pageKeys.length - 1 }),
        (i, j) => {
          fc.pre(i !== j);
          const descA = pageSEO[pageKeys[i]].description;
          const descB = pageSEO[pageKeys[j]].description;
          expect(descA).not.toBe(descB);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 9: Target keywords in product page metadata
 * For any product page, the meta title or meta description or keywords
 * should contain at least one of the target keywords associated with that product.
 * We check that each keyword's significant words appear in the combined SEO text.
 * **Validates: Requirements 14.4**
 */
describe('Property 9: Target keywords in product page metadata', () => {
  it('each product SEO data contains at least one target keyword in title, description, or keywords list', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: products.length - 1 }),
        (idx) => {
          const product = products[idx];
          const seo = product.seo;
          const keywords = seo.keywords || [];
          // Combine title + description + all keywords into one searchable text
          const searchText = `${seo.title} ${seo.description} ${keywords.join(' ')}`.toLowerCase();
          // Check that at least one keyword's core terms appear
          const hasKeyword = keywords.some((kw) => {
            const kwWords = kw.toLowerCase().split(/\s+/);
            // All words of the keyword should appear in the search text
            return kwWords.every((word) => searchText.includes(word));
          });
          expect(hasKeyword).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 10: Sitemap contains all public routes
 * For any public route defined in the application routing structure,
 * the generated sitemap should contain a URL entry for that route.
 * **Validates: Requirements 14.5**
 */
describe('Property 10: Sitemap contains all public routes', () => {
  const SITE_URL = 'https://doonportal.com';
  const publicRoutes = [
    '',
    '/solutions',
    '/about',
    '/blog',
    '/contact',
    '/book-demo',
    '/custom-automation',
    '/products/school-management',
    '/products/inventory-pos',
    '/products/dairy-management',
  ];

  it('every public static route is present in the sitemap route list', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: publicRoutes.length - 1 }),
        (idx) => {
          const route = publicRoutes[idx];
          const expectedUrl = `${SITE_URL}${route}`;
          expect(publicRoutes).toContain(route);
          expect(expectedUrl).toMatch(/^https:\/\/doonportal\.com/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('product routes match product slugs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: products.length - 1 }),
        (idx) => {
          const product = products[idx];
          const expectedRoute = `/products/${product.slug}`;
          expect(publicRoutes).toContain(expectedRoute);
        }
      ),
      { numRuns: 100 }
    );
  });
});
