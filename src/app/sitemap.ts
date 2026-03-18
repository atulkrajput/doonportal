import { MetadataRoute } from 'next';
import { getAllSlugs } from '@/lib/blog';

const SITE_URL = 'https://doonportal.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
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

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route.startsWith('/products') ? 0.9 : 0.8,
  }));

  const blogSlugs = getAllSlugs();
  const blogEntries: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries];
}
