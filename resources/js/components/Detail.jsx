import { Link } from 'react-router';
import { ErrorState, PageLoading } from './States';
import NotFound from '../pages/NotFound';

/** Shared loading / 404 / error handling for detail pages. */
export function DetailGate({ state, children }) {
    if (state.loading) {
        return <PageLoading />;
    }
    if (state.error?.response?.status === 404) {
        return <NotFound />;
    }
    if (state.error) {
        return (
            <div className="container-page py-16">
                <ErrorState error={state.error} />
            </div>
        );
    }
    return state.data ? children(state.data.data) : null;
}

export function Breadcrumbs({ items }) {
    return (
        <nav aria-label="Breadcrumb" className="text-sm text-stone-500">
            <ol className="flex flex-wrap items-center gap-1">
                {items.map(([to, label], i) => (
                    <li key={label} className="flex items-center gap-1">
                        {i > 0 && <span aria-hidden="true">/</span>}
                        {to ? (
                            <Link to={to} className="hover:text-forest-700">
                                {label}
                            </Link>
                        ) : (
                            <span aria-current="page" className="text-stone-700">
                                {label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

export function breadcrumbJsonLd(items) {
    return {
        '@type': 'BreadcrumbList',
        itemListElement: items.map(([to, label], i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: label,
            ...(to ? { item: `${window.location.origin}${to}` } : {}),
        })),
    };
}

export function InfoRow({ icon, children }) {
    return (
        <div className="flex gap-3 py-2 text-sm">
            <span className="mt-0.5 shrink-0 text-forest-600">{icon}</span>
            <div className="min-w-0 text-stone-700">{children}</div>
        </div>
    );
}

export function Provenance({ provenance, updatedLabel = 'Last verified' }) {
    if (!provenance?.source_name && !provenance?.last_verified_at) {
        return null;
    }
    return (
        <p className="mt-4 text-xs text-stone-500">
            {provenance.source_name && <>Source: {provenance.source_url ? <a href={provenance.source_url} rel="nofollow noopener noreferrer" target="_blank" className="underline">{provenance.source_name}</a> : provenance.source_name}. </>}
            {provenance.last_verified_at && <>{updatedLabel}: {new Date(provenance.last_verified_at).toLocaleDateString('en-IN')}.</>}
        </p>
    );
}
