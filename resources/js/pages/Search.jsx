import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useApi } from '../hooks/useApi';
import { useMeta } from '../hooks/useMeta';
import { track } from '../lib/analytics';
import SearchBox from '../components/SearchBox';
import { EntityCard } from '../components/Cards';
import { EmptyState, ErrorState, SkeletonCards } from '../components/States';

const GROUPS = [
    ['business', 'Businesses', (q) => `/businesses?q=${encodeURIComponent(q)}`],
    ['place', 'Places', null],
    ['event', 'Events', null],
    ['story', 'Stories', null],
];

export default function Search() {
    const [params] = useSearchParams();
    const q = (params.get('q') ?? '').trim();
    const { data, loading, error } = useApi(q.length >= 2 ? '/search' : null, { q, limit: 8 });
    useMeta({ title: q ? `Search: ${q}` : 'Search Doon' });

    useEffect(() => {
        if (q.length >= 2) {
            track('search_performed', null, { query: q.slice(0, 100) });
        }
    }, [q]);

    return (
        <div className="container-page py-8">
            <h1 className="font-display text-3xl font-bold">Search Doon</h1>
            <div className="mt-4 max-w-2xl">
                <SearchBox key={q} initial={q} large autoFocus={!q} />
            </div>
            <div className="mt-8">
                {!q && <p className="text-stone-600">Search across businesses, places, events and stories.</p>}
                {q.length === 1 && <p className="text-stone-600">Type at least two characters.</p>}
                {loading && <SkeletonCards />}
                {error && <ErrorState error={error} />}
                {data && data.total === 0 && (
                    <EmptyState title={`No results for “${data.query}”`}>
                        Try a broader word, or browse <Link to="/explore" className="underline">all categories</Link>.
                    </EmptyState>
                )}
                {data &&
                    data.total > 0 &&
                    GROUPS.map(([type, label, moreLink]) =>
                        data.results[type]?.length ? (
                            <section key={type} className="mb-8">
                                <div className="mb-3 flex items-end justify-between">
                                    <h2 className="font-display text-xl font-bold">{label}</h2>
                                    {moreLink && (
                                        <Link to={moreLink(q)} className="text-sm font-semibold text-navy-700 hover:underline">
                                            More {label.toLowerCase()} →
                                        </Link>
                                    )}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {data.results[type].map((card) => (
                                        <EntityCard key={card.id} card={card} />
                                    ))}
                                </div>
                            </section>
                        ) : null,
                    )}
            </div>
        </div>
    );
}
