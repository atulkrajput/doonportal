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
import SectionWrapper from '@/components/ui/SectionWrapper';
import DemoForm from '@/components/forms/DemoForm';
import AnimatedSection from '@/components/ui/AnimatedSection';
import Button from '@/components/ui/Button';
import { getProductBySlug } from '@/data/products';
import {
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  buildSoftwareApplicationJsonLd,
} from '@/data/seo';

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
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.seo.title,
      description: product.seo.description,
      images: product.seo.ogImage ? [product.seo.ogImage] : [],
    },
    alternates: {
      canonical: `${SITE_URL}/products/${SLUG}`,
    },
  };
}

export default function InventoryPosPage() {
  const product = getProductBySlug(SLUG);
  if (!product) return notFound();

  const seo = {
    ...product.seo,
    canonical: `${SITE_URL}/products/${SLUG}`,
    jsonLd: [
      buildSoftwareApplicationJsonLd({
        name: product.name,
        description: product.seo.description,
        url: `${SITE_URL}/products/${SLUG}`,
        image: product.heroImage,
        category: 'BusinessApplication',
      }),
      buildProductJsonLd({
        name: product.name,
        description: product.description,
        url: `${SITE_URL}/products/${SLUG}`,
        image: product.heroImage,
      }),
      buildBreadcrumbJsonLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Solutions', url: `${SITE_URL}/solutions` },
        { name: product.name, url: `${SITE_URL}/products/${SLUG}` },
      ]),
    ],
  };

  return (
    <PageLayout seo={seo}>
      <main>
        <HeroSection
          headline="Inventory Management System & POS Software"
          subheadline="Smart POS software for retail with real-time inventory tracking, barcode scanning, and sales analytics. Built for modern retail businesses."
          ctaButtons={[
            { label: 'Request Demo', href: '#demo-form', variant: 'primary' },
            { label: 'See How It Works', href: '#features', variant: 'secondary' },
          ]}
          image={{ src: product.heroImage, alt: 'Retail inventory POS software dashboard for managing stock and billing' }}
        />
        <AnimatedSection variant="fade-in-up">
          <ProblemsSection problems={product.problems} />
        </AnimatedSection>
        <AnimatedSection variant="fade-in-up">
          <SolutionSection solution={product.solution} />
        </AnimatedSection>
        <AnimatedSection variant="fade-in-up">
          <div id="features">
            <FeatureGrid features={product.features} columns={3} title="Features" />
          </div>
        </AnimatedSection>
        <AnimatedSection variant="fade-in-up">
          <ScreenshotsSection screenshots={product.screenshots} />
        </AnimatedSection>
        <AnimatedSection variant="fade-in-up">
          <BenefitsSection benefits={product.benefits} />
        </AnimatedSection>

        {/* How it works */}
        <AnimatedSection variant="fade-in-up">
          <SectionWrapper className="bg-neutral-50">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                Get your retail inventory software up and running quickly.
              </p>
            </div>
            <div className="mx-auto mt-12 max-w-3xl space-y-6">
              {[
                { step: 1, title: 'Book a Demo', desc: 'See the POS software for retail in action with a personalized walkthrough.' },
                { step: 2, title: 'Import Your Catalog', desc: 'We help you import products, set up barcode scanning, and configure pricing.' },
                { step: 3, title: 'Start Selling', desc: 'Begin billing, tracking inventory, and generating reports from day one.' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 rounded-xl bg-white p-6 shadow-card">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">{item.step}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">{item.title}</h3>
                    <p className="mt-1 text-neutral-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionWrapper>
        </AnimatedSection>

        {/* Internal links */}
        <AnimatedSection variant="fade-in-up">
          <SectionWrapper>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold text-neutral-900">Related Resources</h2>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Button href="/blog/retail-inventory-management-best-practices" variant="outline" size="sm">
                  Inventory Management Best Practices
                </Button>
                <Button href="/blog/benefits-inventory-management-software" variant="outline" size="sm">
                  Benefits of Inventory Software
                </Button>
                <Button href="/solutions" variant="outline" size="sm">
                  All Solutions
                </Button>
              </div>
            </div>
          </SectionWrapper>
        </AnimatedSection>

        {/* Demo form */}
        <AnimatedSection variant="fade-in">
          <SectionWrapper id="demo-form" className="bg-gradient-to-br from-brand-50 via-white to-brand-100">
            <div className="mx-auto max-w-2xl">
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">Request a Demo</h2>
                <p className="mt-4 text-lg text-neutral-600">See how our inventory management system can modernize your retail operations.</p>
              </div>
              <div className="mt-8">
                <DemoForm productContext="Inventory POS System" />
              </div>
            </div>
          </SectionWrapper>
        </AnimatedSection>

        <CTASection
          headline="Ready to Modernize Your Retail Business?"
          subheadline="Book a free demo and see how our POS software can boost your operations."
          ctaButton={{ label: 'Book Free Demo', href: `/book-demo?product=${SLUG}` }}
          variant="gradient"
        />
      </main>
    </PageLayout>
  );
}
