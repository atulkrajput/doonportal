import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/private/', '/test/', '/_next/'],
      },
    ],
    sitemap: 'https://doonportal.com/sitemap.xml',
  };
}
