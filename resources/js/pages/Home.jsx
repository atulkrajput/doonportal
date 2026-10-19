import { Link } from 'react-router';
import { useApi } from '../hooks/useApi';
import SearchBox from '../components/SearchBox';
import { Section } from '../components/Listing';
import { BusinessCard, CardGrid, CollectionCard, EventCard, PlaceCard, StoryCard } from '../components/Cards';
import { EmptyState, ErrorState, SkeletonCards } from '../components/States';
import { Icon } from '../components/Icons';
import { DoonScene } from '../components/Brand';

const FEATURES = [
    { to: '/places', icon: 'pin', title: 'Explore', text: 'Places to visit' },
    { to: '/businesses/food-drink', icon: 'utensils', title: 'Eat', text: 'Cafes, restaurants & more' },
    { to: '/businesses/shopping', icon: 'bag', title: 'Shop', text: 'Local stores & brands' },
    { to: '/events', icon: 'calendar', title: 'Events', text: 'What’s happening in Doon' },
    { to: '/services', icon: 'users', title: 'Connect', text: 'Businesses, services & community' },
];

/** Icon + badge colour per top-level business category (slug from CategorySeeder). */
const CATEGORY_VISUALS = {
    'food-drink': { icon: 'utensils', badge: 'bg-accent-500' },
    shopping: { icon: 'bag', badge: 'bg-pink-600' },
    'home-services': { icon: 'home', badge: 'bg-amber-500' },
    'professional-services': { icon: 'briefcase', badge: 'bg-navy-600' },
    lifestyle: { icon: 'sparkles', badge: 'bg-purple-600' },
    automotive: { icon: 'car', badge: 'bg-red-600' },
    education: { icon: 'cap', badge: 'bg-sky-600' },
    healthcare: { icon: 'medical', badge: 'bg-emerald-600' },
    'hotels-stays': { icon: 'bed', badge: 'bg-indigo-600' },
};
const PLACES_VISUAL = { icon: 'mountain', badge: 'bg-teal-600' };
const FALLBACK_VISUAL = { icon: 'tag', badge: 'bg-stone-500' };

function CategoryTile({ to, label, visual }) {
    return (
        <Link
            to={to}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-4 font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-navy-500 hover:text-navy-700 hover:shadow-md"
        >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm ring-4 ring-white transition-transform group-hover:scale-105 ${visual.badge}`} aria-hidden="true">
                <Icon name={visual.icon} size={22} />
            </span>
            <span className="leading-snug">{label}</span>
        </Link>
    );
}

/** Hand-drawn mountain doodle from the poster. */
function MountainSketch({ className }) {
    return (
        <svg viewBox="0 0 160 64" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 60 L34 22 L48 36 L70 8 L96 40 L112 26 L158 60" />
            <path d="M70 8 L66 24 L74 30 M34 22 L36 34 M112 26 L110 38" />
            <path d="M118 8 l5 -3 l5 3 M134 14 l4 -2 l4 2" />
        </svg>
    );
}

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
        <div className="relative h-64 overflow-hidden rounded-2xl border border-stone-200 bg-[radial-gradient(circle_at_30%_40%,#dbe3f1,transparent_60%),radial-gradient(circle_at_70%_70%,#fdeedd,transparent_55%)] bg-navy-50">
            {markers.map((m) => (
                <Link
                    key={m.path}
                    to={m.path}
                    style={pos(m)}
                    title={m.title}
                    aria-label={m.title}
                    className={`absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${m.type === 'place' ? 'bg-teal-600' : 'bg-navy-600'} hover:scale-150`}
                />
            ))}
            <p className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs text-stone-600">
                {markers.length} mapped listings · full interactive map coming soon
            </p>
        </div>
    );
}

export default function Home() {
    const { data, loading, error } = useApi('/home');
    const home = data?.data;

    return (
        <>
            <section className="relative overflow-hidden border-b border-stone-200">
                <div className="container-page grid items-center gap-8 py-10 lg:grid-cols-[1.05fr_1fr] lg:py-14">
                    <div className="relative">
                        <MountainSketch className="absolute -left-2 -top-6 hidden h-16 w-40 text-navy-700/40 sm:block" />
                        <h1 className="font-display font-bold uppercase leading-[0.9] tracking-tight">
                            <span className="block text-5xl text-navy-700 sm:text-7xl">All things</span>
                            <span className="block text-6xl text-accent-500 sm:text-8xl">Doon.</span>
                        </h1>
                        <p className="brush-banner mt-5 text-base font-medium sm:text-lg">Your ultimate guide to Dehradun.</p>
                        <ul className="mt-6 grid gap-3 border-l-2 border-accent-500/60 pl-4 sm:grid-cols-2">
                            {FEATURES.map((f, i) => (
                                <li key={f.title}>
                                    <Link to={f.to} className="group flex items-center gap-3">
                                        <span className={`icon-badge ${i % 2 ? 'icon-badge-accent' : ''}`}>
                                            <Icon name={f.icon} size={20} />
                                        </span>
                                        <span>
                                            <span className="block font-display text-lg font-semibold uppercase leading-tight text-navy-700 group-hover:text-accent-600">{f.title}</span>
                                            <span className="block text-sm text-stone-600">{f.text}</span>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 max-w-xl">
                            <SearchBox large />
                        </div>
                    </div>
                    <div className="relative">
                        <div className="overflow-hidden rounded-[2rem] shadow-xl shadow-navy-900/10 [clip-path:polygon(4%_2%,30%_0,62%_3%,100%_0,98%_40%,100%_100%,60%_97%,25%_100%,0_98%,2%_55%)]">
                            <DoonScene className="block h-64 w-full sm:h-80 lg:h-[26rem]" />
                        </div>
                        <div className="absolute -bottom-4 left-4 flex h-32 w-32 rotate-[-6deg] flex-col items-center justify-center rounded-full border-4 border-cream bg-navy-700 p-3 text-center font-script text-xl leading-5 text-white shadow-lg sm:h-36 sm:w-36 sm:text-2xl sm:leading-6">
                            Local stories. Real connections.
                            <Icon name="heart" size={16} className="mt-1 text-accent-400" />
                        </div>
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
                                <CategoryTile key={c.id} to={`/businesses/${c.slug}`} label={c.name} visual={CATEGORY_VISUALS[c.slug] || FALLBACK_VISUAL} />
                            ))}
                            <CategoryTile to="/places" label="Places & attractions" visual={PLACES_VISUAL} />
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
                <div className="flex flex-col items-start gap-4 rounded-3xl bg-accent-100 p-8 sm:flex-row sm:items-center sm:justify-between">
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
