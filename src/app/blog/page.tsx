import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import PageLayout from '@/components/layouts/PageLayout';
import SectionWrapper from '@/components/ui/SectionWrapper';
import AnimatedSection from '@/components/ui/AnimatedSection';
import Card from '@/components/ui/Card';
import { getAllPosts } from '@/lib/blog';
import { pageSEO } from '@/data/seo';

export async function generateMetadata(): Promise<Metadata> {
  const seo = pageSEO.blog;
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

export default function BlogPage() {
  const seo = pageSEO.blog;
  const posts = getAllPosts();

  return (
    <PageLayout seo={seo}>
      <main>
        <SectionWrapper className="bg-gradient-to-br from-brand-50 via-white to-brand-100">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              Blog
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-neutral-600">
              Insights on business automation, school management, retail technology, and dairy farm operations.
            </p>
          </div>
        </SectionWrapper>

        <SectionWrapper>
          <AnimatedSection variant="fade-in-up">
            {posts.length === 0 ? (
              <p className="text-center text-neutral-600">No blog posts yet. Check back soon!</p>
            ) : (
              <>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post) => (
                    <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                      <Card hover className="h-full">
                        <div className="relative mb-4 aspect-video overflow-hidden rounded-lg bg-neutral-100">
                          <Image
                            src={post.featuredImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            loading="lazy"
                          />
                        </div>
                        <time className="text-sm text-neutral-500" dateTime={post.date}>
                          {new Date(post.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </time>
                        <h2 className="mt-2 text-xl font-semibold text-neutral-900">
                          {post.title}
                        </h2>
                        <p className="mt-2 text-neutral-600">{post.excerpt}</p>
                        <span className="mt-4 inline-block text-sm font-medium text-brand-600">
                          Read more{' '}
                          <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
                        </span>
                      </Card>
                    </Link>
                  ))}
                </div>

              </>
            )}
          </AnimatedSection>
        </SectionWrapper>
      </main>
    </PageLayout>
  );
}
