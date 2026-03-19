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

const SLUG = 'school-management';
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

export default function SchoolManagementPage() {
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
        category: 'EducationalApplication',
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
        {/* Hero with primary keyword in H1 */}
        <HeroSection
          headline="School Management Software"
          subheadline="Complete school ERP to streamline administration, automate operations, and enhance learning outcomes. Trusted by schools across India."
          ctaButtons={[
            { label: 'Request Demo', href: '#demo-form', variant: 'primary' },
            { label: 'See How It Works', href: '#features', variant: 'secondary' },
          ]}
          image={{ src: product.heroImage, alt: 'School ERP dashboard interface for managing student records and school administration' }}
        />

        {/* H2 — Problems schools face */}
        <AnimatedSection variant="fade-in-up">
          <ProblemsSection problems={product.problems} />
        </AnimatedSection>

        {/* H2 — Software solution */}
        <AnimatedSection variant="fade-in-up">
          <SolutionSection solution={product.solution} />
        </AnimatedSection>

        {/* H2 — Features */}
        <AnimatedSection variant="fade-in-up">
          <div id="features">
            <FeatureGrid features={product.features} columns={3} title="Features" />
          </div>
        </AnimatedSection>

        {/* H2 — Screenshots */}
        <AnimatedSection variant="fade-in-up">
          <ScreenshotsSection screenshots={product.screenshots} />
        </AnimatedSection>

        {/* H2 — Benefits */}
        <AnimatedSection variant="fade-in-up">
          <BenefitsSection benefits={product.benefits} />
        </AnimatedSection>

        {/* H2 — How it works */}
        <AnimatedSection variant="fade-in-up">
          <SectionWrapper className="bg-neutral-50">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                Get started with our school automation system in three simple steps.
              </p>
            </div>
            <div className="mx-auto mt-12 max-w-3xl space-y-6">
              {[
                { step: 1, title: 'Book a Demo', desc: 'Schedule a free demo to see the school management software in action with your specific requirements.' },
                { step: 2, title: 'Setup & Configuration', desc: 'Our team configures the school ERP software to match your institution\'s structure, fee plans, and workflows.' },
                { step: 3, title: 'Go Live', desc: 'Start managing your school digitally. Our support team ensures a smooth transition from day one.' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 rounded-xl bg-white p-6 shadow-card">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">{item.title}</h3>
                    <p className="mt-1 text-neutral-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionWrapper>
        </AnimatedSection>

        {/* Internal links to related content */}
        <AnimatedSection variant="fade-in-up">
          <SectionWrapper>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold text-neutral-900">Related Resources</h2>
              <p className="mt-2 text-neutral-600">Learn more about school automation and management.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Button href="/blog/why-schools-need-erp-software" variant="outline" size="sm">
                  Why Schools Need ERP Software
                </Button>
                <Button href="/blog/best-school-management-software-india" variant="outline" size="sm">
                  Best School Management Software
                </Button>
                <Button href="/solutions" variant="outline" size="sm">
                  All Solutions
                </Button>
              </div>
            </div>
          </SectionWrapper>
        </AnimatedSection>

        {/* H2 — Request Demo form embedded */}
        <AnimatedSection variant="fade-in">
          <SectionWrapper id="demo-form" className="bg-gradient-to-br from-brand-50 via-white to-brand-100">
            <div className="mx-auto max-w-2xl">
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                  Request a Demo
                </h2>
                <p className="mt-4 text-lg text-neutral-600">
                  See how our school management system can automate your school today. Fill out the form and our team will schedule a personalized demo.
                </p>
              </div>
              <div className="mt-8">
                <DemoForm productContext="School Management System" />
              </div>
            </div>
          </SectionWrapper>
        </AnimatedSection>

        <CTASection
          headline="Automate Your School Today"
          subheadline="Join hundreds of schools that trust DoonPortal to streamline their administration."
          ctaButton={{ label: 'Book Free Demo', href: `/book-demo?product=${SLUG}` }}
          variant="gradient"
        />
      </main>
    </PageLayout>
  );
}
