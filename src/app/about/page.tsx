import type { Metadata } from 'next';
import FeatureGrid from '@/components/sections/FeatureGrid';
import FounderSection from '@/components/sections/FounderSection';
import CTASection from '@/components/sections/CTASection';
import PageLayout from '@/components/layouts/PageLayout';
import SectionWrapper from '@/components/ui/SectionWrapper';
import Card from '@/components/ui/Card';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { mission, vision, history, values, team, ctaContent } from '@/data/about';
import { pageSEO } from '@/data/seo';

export async function generateMetadata(): Promise<Metadata> {
  const seo = pageSEO.about;
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

export default function AboutPage() {
  const seo = pageSEO.about;

  return (
    <PageLayout seo={seo}>
      <main>
        {/* Mission & Vision */}
        <AnimatedSection variant="fade-in-up">
          <SectionWrapper className="bg-gradient-to-br from-brand-50 via-white to-brand-100">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
                About DoonPortal
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-neutral-600">
                {mission.description}
              </p>
            </div>
          </SectionWrapper>
        </AnimatedSection>

        <AnimatedSection variant="fade-in-up" delay={0.1}>
          <SectionWrapper>
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="text-center">
                <h2 className="text-2xl font-bold text-neutral-900">{mission.title}</h2>
                <p className="mt-4 text-neutral-600">{mission.description}</p>
              </Card>
              <Card className="text-center">
                <h2 className="text-2xl font-bold text-neutral-900">{vision.title}</h2>
                <p className="mt-4 text-neutral-600">{vision.description}</p>
              </Card>
            </div>
          </SectionWrapper>
        </AnimatedSection>

        {/* History & Milestones */}
        <AnimatedSection variant="fade-in-up">
          <SectionWrapper className="bg-neutral-50">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                {history.title}
              </h2>
              <p className="mt-6 text-center text-lg leading-relaxed text-neutral-600">
                {history.description}
              </p>
              <div className="mt-12 space-y-6">
                {history.milestones.map((milestone) => (
                  <div key={milestone.year} className="flex items-start gap-4">
                    <span className="shrink-0 rounded-full bg-brand-600 px-4 py-1 text-sm font-bold text-white">
                      {milestone.year}
                    </span>
                    <p className="text-neutral-700">{milestone.event}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionWrapper>
        </AnimatedSection>

        {/* Founder & Team - hidden for now */}
        {/* <FounderSection
          name={team.founder.name}
          title={team.founder.title}
          description={team.founder.description}
          image={team.founder.image}
        /> */}

        <AnimatedSection variant="fade-in">
          <SectionWrapper>
            <p className="mx-auto max-w-3xl text-center text-lg leading-relaxed text-neutral-600">
              {team.description}
            </p>
          </SectionWrapper>
        </AnimatedSection>

        {/* Values */}
        <AnimatedSection variant="fade-in-up">
          <FeatureGrid
            features={values}
            columns={4}
            title="Our Values"
            subtitle="The principles that guide everything we do."
          />
        </AnimatedSection>

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
