import type { SEOMetadata } from '@/types';

interface PageLayoutProps {
  children: React.ReactNode;
  seo: SEOMetadata;
}

export default function PageLayout({ children, seo }: PageLayoutProps) {
  return (
    <>
      {/* Inject JSON-LD structured data */}
      {seo.jsonLd?.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {children}
    </>
  );
}
