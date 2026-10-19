import { Link } from 'react-router';
import { useApi } from '../hooks/useApi';
import { useMeta } from '../hooks/useMeta';
import SearchBox from '../components/SearchBox';
import { Section } from '../components/Listing';
import { BusinessCard, CardGrid, CollectionCard, EventCard, PlaceCard, StoryCard } from '../components/Cards';
import { EmptyState, ErrorState, SkeletonCards } from '../components/States';
import { Icon } from '../components/Icons';

const QUICK_LINKS = [
    ['/businesses/cafes', 'Cafes'],
    ['/businesses/restaurants', 'Restaurants'],
    ['/events', 'Events'],
    ['/places', 'Places'],
    ['/services', 'Services'],
];

function Block({ items, render, emptyTitle, emptyText }) {
    if (!items?.length) {
        return <EmptyState title={emptyTitle}>{emptyText}</EmptyState>;
    }
    return <CardGrid>{items.map(render)}</CardGrid>;
}

function MapPreview({ markers }) {
    if (!markers?.length) {
        return <EmptyState title="The Doon Map is warming up">Listings appear on the map once their locations are confirmed.</EmptyState>;
    }
    const lats = markers.map((m) => m.lat);
    const lngs = markers.map((m) => m.lng);
    const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
    const pos = (m) => ({
        left: `${8 + ((m.lng - minLng) / (maxLng - minLng || 1)) * 84}%`,
        top: `${8 + (1 - (m.lat - minLat) / (maxLat - minLat || 1)) * 84}%`,
    });
    return (
        <div className="relative h-64 overflow-hidden rounded-2xl border border-stone-200 bg-[radial-gradient(circle_at_30%_40%,#dcebe1,transparent_60%),radial-gradient(circle_at_70%_70%,#fdf0d9,transparent_55%)] bg-forest-50">
            {markers.map((m) => (
                <Link
                    key={m.path}
                    to={m.path}
                    style={pos(m)}
                    title={m.title}
                    aria-label={m.title}
                    className={`absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${m.type === 'place' ? 'bg-teal-600' : 'bg-forest-600'} hover:scale-150`}
                />
            ))}
            <p className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs text-stone-600">
                {markers.length} mapped listings · full interactive map coming soon
            </p>
        </div>
    );
}

export default function Home() {
    useMeta({});
    const { data, loading, error } = useApi('/home');
    const home = data?.data;

    return (
        <>
            <section className="relative overflow-hidden bg-forest-900 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(240,181,74,0.25),transparent_45%),radial-gradient(circle_at_10%_90%,rgba(47,122,85,0.6),transparent_50%)]" aria-hidden="true" />
                <div className="container-page relative py-14 sm:py-20">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-saffron-400">All things Doon.</p>
                    <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">Discover. Connect. Belong.</h1>
                    <p className="mt-3 max-w-xl text-forest-100">Businesses, places, events and stories from across Dehradun — in one trusted guide.</p>
                    <div className="mt-6 max-w-2xl text-ink">
                        <SearchBox large />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {QUICK_LINKS.map(([to, label]) => (
                            <Link key={to} to={to} className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm hover:bg-white/20">
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {loading && (
                <div className="container-page py-10">
                    <SkeletonCards count={8} />
                </div>
            )}
            {error && (
                <div className="container-page py-10">
                    <ErrorState error={error} />
                </div>
            )}

            {home && (
                <>
                    <Section title="Explore Doon" subtitle="Browse by category" to="/explore" linkLabel="All categories">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                            {home.explore_categories.map((c) => (
                                <Link key={c.id} to={`/businesses/${c.slug}`} className="rounded-2xl border border-stone-200 bg-white px-4 py-5 font-semibold hover:border-forest-500 hover:text-forest-700">
                                    {c.name}
                                </Link>
                            ))}
                            <Link to="/places" className="rounded-2xl border border-stone-200 bg-white px-4 py-5 font-semibold hover:border-forest-500 hover:text-forest-700">
                                Places & attractions
                            </Link>
                        </div>
                    </Section>

                    <Section title="What’s happening in Doon" to="/events">
                        <Block items={home.happening} render={(e) => <EventCard key={e.id} event={e} />} emptyTitle="No upcoming events listed yet" emptyText="Organising something? Event submissions open soon." />
                    </Section>

                    <Section title="Popular in Doon" to="/businesses">
                        <Block items={home.popular} render={(b) => <BusinessCard key={b.id} business={b} />} emptyTitle="Listings are on their way" emptyText="We’re adding verified local businesses. Own one? List it for free." />
                    </Section>

                    <Section title="New in Doon" subtitle="Recently opened or newly listed" to="/businesses?new=1">
                        <Block items={home.new_in_doon} render={(b) => <BusinessCard key={b.id} business={b} />} emptyTitle="Nothing new this month yet" />
                    </Section>

                    <Section title="Eat in Doon" to="/businesses/food-drink">
                        <Block items={home.eat} render={(b) => <BusinessCard key={b.id} business={b} />} emptyTitle="No food listings yet" />
                    </Section>

                    <Section title="Places to explore" to="/places">
                        <Block items={home.places} render={(p) => <PlaceCard key={p.id} place={p} />} emptyTitle="Places are being added" />
                    </Section>

                    <Section title="Explore by area" to="/areas">
                        <div className="flex flex-wrap gap-2">
                            {home.areas.map((a) => (
                                <Link key={a.id} to={`/area/${a.slug}`} className="chip">
                                    <Icon name="pin" size={14} /> {a.name}
                                    {a.counts?.businesses ? <span className="text-stone-400">· {a.counts.businesses}</span> : null}
                                </Link>
                            ))}
                        </div>
                    </Section>

                    <Section title="Doon Stories" to="/stories">
                        {home.stories.length ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {home.stories.map((s) => (
                                    <StoryCard key={s.id} story={s} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState title="Stories coming soon">Guides, heritage features and local voices are in the works.</EmptyState>
                        )}
                    </Section>

                    <Section title="Doon Map">
                        <MapPreview markers={home.map_preview} />
                    </Section>

                    <Section title="Best of Doon" to="/collections">
                        {home.collections.length ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {home.collections.map((c) => (
                                    <CollectionCard key={c.id} collection={c} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState title="Curated lists coming soon" />
                        )}
                    </Section>
                </>
            )}

            <section className="container-page py-10">
                <div className="flex flex-col items-start gap-4 rounded-3xl bg-saffron-100 p-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-display text-2xl font-bold">Run a business in Dehradun?</h2>
                        <p className="mt-1 text-stone-700">List it free, keep your details accurate and reach people looking for you.</p>
                    </div>
                    <Link to="/business-portal" className="btn-primary">
                        List your business <Icon name="arrow" size={16} />
                    </Link>
                </div>
            </section>
        </>
    );
}
