import type { SEOMetadata } from '@/types';

const SITE_URL = 'https://doonportal.com';
const SITE_NAME = 'DoonPortal';

export const pageSEO: Record<string, SEOMetadata> = {
  home: {
    title: 'DoonPortal — Automation Software for Schools, Retail & Dairy',
    description:
      'DoonPortal builds industry-specific automation software for schools, retail businesses, and dairy farms. 15+ years of expertise in business automation solutions.',
    keywords: [
      'business automation software',
      'school management software',
      'inventory POS software',
      'dairy management software',
      'automation solutions India',
    ],
    ogImage: '/images/og/home.png',
    canonical: SITE_URL,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/doonportal.png`,
        description:
          'DoonPortal is an automation software company building platforms for schools, retail businesses, and dairy farms.',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Dehradun',
          addressCountry: 'IN',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'info@doonportal.com',
          contactType: 'sales',
        },
      },
    ],
  },
  solutions: {
    title: 'Solutions — School, Retail & Dairy Software | DoonPortal',
    description:
      'Explore DoonPortal\'s automation solutions: School Management System, Inventory POS, Dairy Management, and custom automation services.',
    keywords: [
      'business automation solutions',
      'school ERP',
      'retail POS system',
      'dairy farm software',
      'custom automation',
    ],
    ogImage: '/images/og/solutions.png',
    canonical: `${SITE_URL}/solutions`,
    jsonLd: [
      buildBreadcrumbJsonLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Solutions', url: `${SITE_URL}/solutions` },
      ]),
    ],
  },
  about: {
    title: 'About DoonPortal — 15+ Years of Automation Expertise',
    description:
      'Learn about DoonPortal\'s mission, history, and team. Over 15 years of experience building automation software for schools, retail, and agriculture.',
    keywords: [
      'about DoonPortal',
      'automation software company',
      'software company Dehradun',
      'business automation India',
    ],
    ogImage: '/images/og/about.png',
    canonical: `${SITE_URL}/about`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/doonportal.png`,
        foundingDate: '2008',
        description:
          'DoonPortal is an automation software company with 15+ years of experience building platforms for schools, retail businesses, and dairy farms.',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Dehradun',
          addressCountry: 'IN',
        },
      },
      buildBreadcrumbJsonLd([
        { name: 'Home', url: SITE_URL },
        { name: 'About', url: `${SITE_URL}/about` },
      ]),
    ],
  },
  blog: {
    title: 'Blog — Insights on Business Automation | DoonPortal',
    description:
      'Read articles and insights on school management, retail automation, dairy farm technology, and business process optimization from DoonPortal.',
    keywords: [
      'business automation blog',
      'school management tips',
      'retail technology insights',
      'dairy farm automation',
    ],
    ogImage: '/images/og/blog.png',
    canonical: `${SITE_URL}/blog`,
    jsonLd: [
      buildBreadcrumbJsonLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Blog', url: `${SITE_URL}/blog` },
      ]),
    ],
  },
  contact: {
    title: 'Contact DoonPortal — Get in Touch',
    description:
      'Contact DoonPortal for inquiries about our automation software, custom solutions, or partnership opportunities. We\'re based in Dehradun, India.',
    keywords: [
      'contact DoonPortal',
      'automation software inquiry',
      'business software consultation',
    ],
    ogImage: '/images/og/contact.png',
    canonical: `${SITE_URL}/contact`,
    jsonLd: [
      buildBreadcrumbJsonLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Contact', url: `${SITE_URL}/contact` },
      ]),
    ],
  },
  bookDemo: {
    title: 'Book a Demo — See DoonPortal in Action',
    description:
      'Schedule a free demo of DoonPortal\'s automation software. See how our school management, inventory POS, or dairy management systems can transform your operations.',
    keywords: [
      'book demo',
      'free software demo',
      'school management demo',
      'POS software demo',
      'dairy management demo',
    ],
    ogImage: '/images/og/book-demo.png',
    canonical: `${SITE_URL}/book-demo`,
    jsonLd: [
      buildBreadcrumbJsonLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Book a Demo', url: `${SITE_URL}/book-demo` },
      ]),
    ],
  },
  customAutomation: {
    title: 'Custom Automation Solutions | DoonPortal',
    description:
      'DoonPortal builds custom automation solutions including business process automation, custom ERP development, workflow automation, and system integrations.',
    keywords: [
      'custom automation solutions',
      'custom ERP development',
      'business process automation',
      'workflow automation India',
    ],
    ogImage: '/images/og/custom-automation.png',
    canonical: `${SITE_URL}/custom-automation`,
    jsonLd: [
      buildBreadcrumbJsonLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Custom Automation', url: `${SITE_URL}/custom-automation` },
      ]),
    ],
  },
};

// JSON-LD Template Builders

export function buildBreadcrumbJsonLd(
  items: { name: string; url: string }[]
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildProductJsonLd(product: {
  name: string;
  description: string;
  url: string;
  image?: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    url: product.url,
    image: product.image,
    brand: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
  };
}

export function buildBlogPostingJsonLd(post: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  author: string;
  image?: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: post.url,
    datePublished: post.datePublished,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    image: post.image,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/doonportal.png`,
      },
    },
  };
}
