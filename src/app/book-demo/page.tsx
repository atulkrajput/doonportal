import type { Metadata } from 'next';
import DemoForm from '@/components/forms/DemoForm';
import PageLayout from '@/components/layouts/PageLayout';
import SectionWrapper from '@/components/ui/SectionWrapper';
import { getProductBySlug } from '@/data/products';
import { pageSEO } from '@/data/seo';

export async function generateMetadata(): Promise<Metadata> {
  const seo = pageSEO.bookDemo;
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

interface BookDemoPageProps {
  searchParams: Promise<{ product?: string }>;
}

export default async function BookDemoPage({ searchParams }: BookDemoPageProps) {
  const params = await searchParams;
  const seo = pageSEO.bookDemo;
  const productSlug = params.product;
  const product = productSlug ? getProductBySlug(productSlug) : undefined;

  return (
    <PageLayout seo={seo}>
      <main>
        <SectionWrapper className="bg-gradient-to-br from-brand-50 via-white to-brand-100">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              Book a Demo
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-neutral-600">
              {product
                ? `See ${product.name} in action. Fill out the form below and our team will schedule a personalized demo for you.`
                : 'Schedule a free demo of our automation software. Fill out the form below and our team will get in touch.'}
            </p>
          </div>
        </SectionWrapper>

        <SectionWrapper>
          <div className="mx-auto max-w-2xl">
            <DemoForm productContext={product?.name} />
          </div>
        </SectionWrapper>
      </main>
    </PageLayout>
  );
}
