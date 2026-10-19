import { Link, useParams } from 'react-router';
import { useApi } from '../hooks/useApi';
import { useMeta } from '../hooks/useMeta';
import { BusinessCard, CardGrid, EventCard, PlaceCard, StoryCard } from '../components/Cards';
import { Breadcrumbs, DetailGate } from '../components/Detail';
import { PageHeader, Section } from '../components/Listing';
import { EmptyState, ErrorState, SkeletonCards } from '../components/States';
import { Icon } from '../components/Icons';

export function AreaList() {
    const { data, loading, error } = useApi('/areas');
    useMeta({ title: 'Areas of Dehradun', description: 'Explore Dehradun neighbourhood by neighbourhood.' });

    return (
        <>
            <PageHeader eyebrow="Neighbourhoods" title="Explore by area">
                From Rajpur Road to Clement Town — find what’s around you.
            </PageHeader>
            <div className="container-page py-6">
                {loading && <SkeletonCards count={8} />}
                {error && <ErrorState error={error} />}
                {data && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {data.data.map((a) => (
                            <Link key={a.id} to={`/area/${a.slug}`} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-5 hover:border-forest-500">
                                <span className="flex items-center gap-2 font-semibold">
                                    <Icon name="pin" className="text-forest-600" /> {a.name}
                                </span>
                                <span className="text-sm text-stone-500">
                                    {a.counts?.businesses ?? 0} listings · {a.counts?.places ?? 0} places
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function AreaBlock({ path, title, to, render, grid = true }) {
    const { data, loading } = useApi(path, { per_page: 8 });
    if (loading) {
        return (
            <Section title={title}>
                <SkeletonCards count={4} />
            </Section>
        );
    }
    if (!data?.data?.length) {
        return (
            <Section title={title}>
                <EmptyState title={`No ${title.toLowerCase()} listed here yet`} />
            </Section>
        );
    }
    return (
        <Section title={title} to={data.meta?.total > data.data.length ? to : undefined}>
            {grid ? <CardGrid>{data.data.map(render)}</CardGrid> : data.data.map(render)}
        </Section>
    );
}

function AreaView({ area }) {
    useMeta({ title: `${area.name}, Dehradun`, description: area.summary || `Businesses, places, events and stories in ${area.name}, Dehradun.` });

    return (
        <>
            <PageHeader eyebrow={<Breadcrumbs items={[['/', 'Home'], ['/areas', 'Areas'], [null, area.name]]} />} title={area.name}>
                {area.description || area.summary || `What’s in and around ${area.name}.`}
            </PageHeader>
            <AreaBlock path={`/areas/${area.slug}/businesses`} title="Businesses" to={`/businesses?area=${area.slug}`} render={(b) => <BusinessCard key={b.id} business={b} />} />
            <AreaBlock path={`/areas/${area.slug}/places`} title="Places" to={`/places?area=${area.slug}`} render={(p) => <PlaceCard key={p.id} place={p} />} />
            <AreaBlock path={`/areas/${area.slug}/events`} title="Upcoming events" to={`/events?area=${area.slug}`} render={(e) => <EventCard key={e.id} event={e} />} />
            <AreaBlock path={`/areas/${area.slug}/stories`} title="Stories" render={(s) => <StoryCard key={s.id} story={s} />} />
        </>
    );
}

export function AreaDetail() {
    const { slug } = useParams();
    const state = useApi(`/areas/${slug}`);
    return <DetailGate state={state}>{(area) => <AreaView key={area.id} area={area} />}</DetailGate>;
}
