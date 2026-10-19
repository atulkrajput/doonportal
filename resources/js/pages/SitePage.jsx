import { useMemo } from 'react';
import { useParams } from 'react-router';
import DOMPurify from 'dompurify';
import { useApi } from '../hooks/useApi';
import { PageHeader } from '../components/Listing';
import { ErrorState, PageLoading } from '../components/States';
import NotFound from './NotFound';
import { formatDateTime } from '../admin/lib';

/**
 * Editable site page (privacy, terms, cookies, about, contact…) from /api/v1/pages/{slug}.
 * The body is sanitized on the server when saved; DOMPurify is defence in depth.
 */
export default function SitePage({ slug: fixedSlug }) {
    const params = useParams();
    const slug = fixedSlug ?? params.slug;
    const { data, error, loading } = useApi(`/pages/${slug}`);
    const html = useMemo(() => (data?.data?.body ? DOMPurify.sanitize(data.data.body) : ''), [data]);

    if (error?.response?.status === 404) {
        return <NotFound />;
    }
    if (error) {
        return (
            <div className="container-page py-10">
                <ErrorState error={error} />
            </div>
        );
    }
    if (loading || !data) {
        return <PageLoading />;
    }

    const page = data.data;
    return (
        <>
            <PageHeader title={page.title}>{page.summary}</PageHeader>
            <article className="container-page max-w-3xl py-8">
                <div className="prose-story text-stone-800" dangerouslySetInnerHTML={{ __html: html }} />
                <p className="mt-10 border-t border-stone-200 pt-4 text-xs text-stone-500">Last updated {formatDateTime(page.updated_at)}</p>
            </article>
        </>
    );
}
