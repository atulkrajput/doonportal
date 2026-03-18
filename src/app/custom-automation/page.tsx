import type { Metadata } from 'next';
import HeroSection from '@/components/sections/HeroSection';
import FeatureGrid from '@/components/sections/FeatureGrid';
import CTASection from '@/components/sections/CTASection';
import PageLayout from '@/components/layouts/PageLayout';
import SectionWrapper from '@/components/ui/SectionWrapper';
import Card from '@/components/ui/Card';
import { heroContent, services, process as processSteps, ctaContent } from '@/data/custom-automation';
import { pageSEO } from '@/data/seo';

export async function generateMetadata(): Promise<Metadata> {
  const seo = pageSEO.customAutomation;
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

export default function CustomAutomationPage() {
  const seo = pageSEO.customAutomation;

  return (
    <PageLayout seo={seo}>
      <main>
        {/* Hero Section */}
        <HeroSection
          headline={heroContent.headline}
          subheadline={heroContent.subheadline}
          ctaButtons={[{ label: heroContent.ctaButton.label, href: heroContent.ctaButton.href, variant: 'primary' }]}
        />

        {/* Services */}
        <FeatureGrid
          features={services}
          columns={3}
          title="Our Services"
          subtitle="End-to-end automation solutions tailored to your business."
        />

        {/* Process / Workflow Section */}
        <SectionWrapper className="bg-neutral-50">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              How We Work
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              Our proven process ensures your project is delivered on time and on budget.
            </p>
          </div>
          <div className="mx-auto max-w-3xl space-y-6">
            {processSteps.map((step) => (
              <Card key={step.step} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                  {step.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">{step.title}</h3>
                  <p className="mt-1 text-neutral-600">{step.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </SectionWrapper>

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
