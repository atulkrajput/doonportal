import type { Metadata } from 'next';
import ContactTabs from '@/components/ui/ContactTabs';
import PageLayout from '@/components/layouts/PageLayout';
import SectionWrapper from '@/components/ui/SectionWrapper';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { pageSEO } from '@/data/seo';

export async function generateMetadata(): Promise<Metadata> {
  const seo = pageSEO.contact;
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      title: seo.title,
      description: seo.description,
      images: seo.ogImage ? [seo.ogImage] : [],
    },
    alternates: {
      canonical: seo.canonical,
    },
  };
}

export default function ContactPage() {
  const seo = pageSEO.contact;

  return (
    <PageLayout seo={seo}>
      <main>
        <SectionWrapper className="bg-gradient-to-br from-brand-50 via-white to-brand-100">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              Contact Us
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-neutral-600">
              Have a question or want to discuss your requirements? Reach out and our team will get back to you promptly.
            </p>
          </div>
        </SectionWrapper>

        <SectionWrapper>
          <AnimatedSection variant="fade-in">
            <ContactTabs />
          </AnimatedSection>
        </SectionWrapper>
      </main>
    </PageLayout>
  );
}
