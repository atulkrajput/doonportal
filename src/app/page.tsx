import type { Metadata } from 'next';
import HeroSection from '@/components/sections/HeroSection';
import ProductCard from '@/components/sections/ProductCard';
import IndustrySection from '@/components/sections/IndustrySection';
import FeatureGrid from '@/components/sections/FeatureGrid';
import FounderSection from '@/components/sections/FounderSection';
import CTASection from '@/components/sections/CTASection';
import PageLayout from '@/components/layouts/PageLayout';
import SectionWrapper from '@/components/ui/SectionWrapper';
import { heroContent, industries, differentiators, founderInfo, ctaContent } from '@/data/homepage';
import { products } from '@/data/products';
import { pageSEO } from '@/data/seo';

export async function generateMetadata(): Promise<Metadata> {
  const seo = pageSEO.home;
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      title: seo.title,
      description: seo.description,
      images: seo.ogImage ? [seo.ogImage] : [],
    },
  };
}

export default function HomePage() {
  const seo = pageSEO.home;

  return (
    <PageLayout seo={seo}>
      <main>
        {/* Hero Section */}
        <HeroSection
          headline={heroContent.headline}
          subheadline={heroContent.subheadline}
          ctaButtons={heroContent.ctaButtons}
        />

        {/* Products Section */}
        <SectionWrapper>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Our Products
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              Industry-specific automation platforms built for real-world needs.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.slug}
                title={product.name}
                description={product.description}
                icon={product.icon}
                href={`/products/${product.slug}`}
              />
            ))}
          </div>
        </SectionWrapper>

        {/* Industries Section */}
        <IndustrySection industries={industries} />

        {/* Why Choose DoonPortal */}
        <FeatureGrid
          features={differentiators}
          columns={3}
          title="Why Choose DoonPortal"
          subtitle="What sets us apart from the rest."
        />

        {/* Founder Section - hidden for now */}
        {/* <FounderSection
          name={founderInfo.name}
          title={founderInfo.title}
          description={founderInfo.description}
          image={founderInfo.image}
        /> */}

        {/* CTA Section */}
        <CTASection
          headline={ctaContent.headline}
          subheadline={ctaContent.subheadline}
          ctaButton={ctaContent.ctaButton}
          variant="gradient"
        />
      </main>
    </PageLayout>
  );
}
