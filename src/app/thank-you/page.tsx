import type { Metadata } from 'next';
import Link from 'next/link';
import PageLayout from '@/components/layouts/PageLayout';
import SectionWrapper from '@/components/ui/SectionWrapper';
import Button from '@/components/ui/Button';
import { pageSEO } from '@/data/seo';

export const metadata: Metadata = {
  title: 'Thank You — DoonPortal',
  description: 'Thank you for your interest in DoonPortal. Our team will get back to you shortly.',
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  const seo = pageSEO.thankYou;

  return (
    <PageLayout seo={seo}>
      <main>
        <SectionWrapper className="bg-gradient-to-br from-brand-50 via-white to-brand-100">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              Thank You!
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-neutral-600">
              Your request has been received. Our team will review your submission and get back to you within 24 hours.
            </p>
          </div>
        </SectionWrapper>

        <SectionWrapper>
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-neutral-900 text-center">What Happens Next</h2>
            <div className="mt-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">1</div>
                <div>
                  <h3 className="font-semibold text-neutral-900">We Review Your Request</h3>
                  <p className="mt-1 text-neutral-600">Our team will review your requirements and prepare a personalized response.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">2</div>
                <div>
                  <h3 className="font-semibold text-neutral-900">We Schedule a Call</h3>
                  <p className="mt-1 text-neutral-600">A team member will reach out to schedule a convenient time for a demo or discussion.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">3</div>
                <div>
                  <h3 className="font-semibold text-neutral-900">Personalized Demo</h3>
                  <p className="mt-1 text-neutral-600">We walk you through the software tailored to your specific needs and use case.</p>
                </div>
              </div>
            </div>

            {/* Schedule a Demo / Calendar Booking */}
            <div className="mt-12 rounded-2xl border border-brand-200 bg-brand-50 p-8 text-center">
              <h2 className="text-xl font-bold text-neutral-900">Want to Schedule Right Away?</h2>
              <p className="mt-2 text-neutral-600">
                Skip the wait and book a demo slot directly on our calendar.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                {/* Calendly integration placeholder — replace href with actual Calendly link */}
                <Button
                  href={process.env.NEXT_PUBLIC_CALENDLY_URL || '/book-demo'}
                  variant="primary"
                  size="lg"
                >
                  Schedule a Demo
                </Button>
                <Button href="/" variant="outline" size="lg">
                  Back to Home
                </Button>
              </div>
            </div>

            {/* Explore products */}
            <div className="mt-12 text-center">
              <h2 className="text-xl font-bold text-neutral-900">While You Wait, Explore Our Solutions</h2>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Button href="/products/school-management" variant="outline" size="sm">
                  School Management
                </Button>
                <Button href="/products/inventory-pos" variant="outline" size="sm">
                  Inventory POS
                </Button>
                <Button href="/products/dairy-management" variant="outline" size="sm">
                  Dairy Management
                </Button>
              </div>
            </div>
          </div>
        </SectionWrapper>
      </main>
    </PageLayout>
  );
}
