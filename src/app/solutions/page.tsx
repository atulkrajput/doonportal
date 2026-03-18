import type { Metadata } from 'next';
import ProductCard from '@/components/sections/ProductCard';
import CTASection from '@/components/sections/CTASection';
import PageLayout from '@/components/layouts/PageLayout';
import SectionWrapper from '@/components/ui/SectionWrapper';
import Button from '@/components/ui/Button';
import { products } from '@/data/products';
import { pageSEO } from '@/data/seo';

export async function generateMetadata(): Promise<Metadata> {
  const seo = pageSEO.solutions;
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

export default function SolutionsPage() {
  const seo = pageSEO.solutions;

  return (
    <PageLayout seo={seo}>
      <main>
        {/* Overview Section */}
        <SectionWrapper className="bg-gradient-to-br from-brand-50 via-white to-brand-100">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              Our Solutions
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-neutral-600">
              DoonPortal offers industry-specific automation platforms designed to streamline
              operations, reduce costs, and drive growth. Explore our products or learn about
              our custom automation services.
            </p>
          </div>
        </SectionWrapper>

        {/* Products Section */}
        <SectionWrapper>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Core Products
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              Purpose-built platforms for education, retail, and agriculture.
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

        {/* Custom Automation Section */}
        <SectionWrapper className="bg-neutral-50">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Custom Automation
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              Need something beyond our standard products? We build tailored automation
              solutions designed around your unique workflows and requirements.
            </p>
            <div className="mt-8">
              <Button href="/custom-automation" variant="primary" size="lg">
                Explore Custom Solutions
              </Button>
            </div>
          </div>
        </SectionWrapper>

        {/* CTA */}
        <CTASection
          headline="Not Sure Which Solution Fits?"
          subheadline="Talk to our team and we'll help you find the right product for your needs."
          ctaButton={{ label: 'Book a Demo', href: '/book-demo' }}
          variant="gradient"
        />
      </main>
    </PageLayout>
  );
}
