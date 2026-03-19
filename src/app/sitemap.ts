import { MetadataRoute } from 'next';
import { getAllSlugs } from '@/lib/blog';

const SITE_URL = 'https://doonportal.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: { route: string; priority: number; changeFreq: 'weekly' | 'monthly' | 'daily' }[] = [
    { route: '', priority: 1, changeFreq: 'weekly' },
    { route: '/solutions', priority: 0.9, changeFreq: 'monthly' },
    { route: '/products/school-management', priority: 0.95, changeFreq: 'monthly' },
    { route: '/products/inventory-pos', priority: 0.9, changeFreq: 'monthly' },
    { route: '/products/dairy-management', priority: 0.9, changeFreq: 'monthly' },
    { route: '/custom-automation', priority: 0.8, changeFreq: 'monthly' },
    { route: '/about', priority: 0.7, changeFreq: 'monthly' },
    { route: '/blog', priority: 0.8, changeFreq: 'weekly' },
    { route: '/contact', priority: 0.7, changeFreq: 'monthly' },
    { route: '/book-demo', priority: 0.85, changeFreq: 'monthly' },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${SITE_URL}${r.route}`,
    lastModified: new Date(),
    changeFrequency: r.changeFreq,
    priority: r.priority,
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
