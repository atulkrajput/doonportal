import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HeroSection from '@/components/sections/HeroSection';
import ProblemsSection from '@/components/sections/ProblemsSection';
import SolutionSection from '@/components/sections/SolutionSection';
import FeatureGrid from '@/components/sections/FeatureGrid';
import ScreenshotsSection from '@/components/sections/ScreenshotsSection';
import BenefitsSection from '@/components/sections/BenefitsSection';
import CTASection from '@/components/sections/CTASection';
import PageLayout from '@/components/layouts/PageLayout';
import { getProductBySlug } from '@/data/products';
import { buildProductJsonLd, buildBreadcrumbJsonLd } from '@/data/seo';

const SLUG = 'inventory-pos';
const SITE_URL = 'https://doonportal.com';

export async function generateMetadata(): Promise<Metadata> {
  const product = getProductBySlug(SLUG);
  if (!product) return {};
  return {
    title: product.seo.title,
    description: product.seo.description,
    keywords: product.seo.keywords,
    openGraph: {
      title: product.seo.title,
      description: product.seo.description,
      images: product.seo.ogImage ? [product.seo.ogImage] : [],
    },
  };
}

export default function InventoryPosPage() {
  const product = getProductBySlug(SLUG);
  if (!product) return notFound();

  const seo = {
    ...product.seo,
    jsonLd: [
      buildProductJsonLd({
        name: product.name,
        description: product.description,
        url: `${SITE_URL}/products/${SLUG}`,
        image: product.heroImage,
      }),
      buildBreadcrumbJsonLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Products', url: `${SITE_URL}/solutions` },
        { name: product.name, url: `${SITE_URL}/products/${SLUG}` },
      ]),
    ],
  };

  return (
    <PageLayout seo={seo}>
      <main>
        <HeroSection
          headline={product.name}
          subheadline={product.tagline}
          ctaButtons={[{ label: 'Request Demo', href: `/book-demo?product=${SLUG}`, variant: 'primary' }]}
          image={{ src: product.heroImage, alt: product.name }}
        />
        <ProblemsSection problems={product.problems} />
        <SolutionSection solution={product.solution} />
        <FeatureGrid features={product.features} columns={3} title="Features" />
        <ScreenshotsSection screenshots={product.screenshots} />
        <BenefitsSection benefits={product.benefits} />
        <CTASection
          headline="Ready to Modernize Your Retail Business?"
          subheadline="Book a free demo and see how our inventory POS software can boost your operations."
          ctaButton={{ label: 'Request Demo', href: `/book-demo?product=${SLUG}` }}
          variant="gradient"
        />
      </main>
    </PageLayout>
  );
}
