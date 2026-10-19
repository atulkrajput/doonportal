import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { useApi } from '../hooks/useApi';
import { useMeta } from '../hooks/useMeta';
import { track } from '../lib/analytics';
import { directionsHref, formatPaise } from '../lib/format';
import { CardGrid, Cover, PlaceCard } from '../components/Cards';
import { DemoBadge, Rating } from '../components/Badges';
import { Breadcrumbs, DetailGate, InfoRow, Provenance, breadcrumbJsonLd } from '../components/Detail';
import { Icon } from '../components/Icons';

function entryText(entry) {
    if (entry.is_free) {
        return 'Free entry';
    }
    if (entry.fee_min_paise != null) {
        return entry.fee_max_paise && entry.fee_max_paise !== entry.fee_min_paise
            ? `${formatPaise(entry.fee_min_paise)} – ${formatPaise(entry.fee_max_paise)}`
            : formatPaise(entry.fee_min_paise);
    }
    return null;
}

function PlaceView({ place }) {
    const { data: related } = useApi(`/places/${place.slug}/related`);
    const crumbs = [['/', 'Home'], ['/places', 'Explore'], [null, place.name]];

    useEffect(() => {
        track('place_viewed', { type: 'place', id: place.id });
    }, [place.id]);

    useMeta({
        title: place.name,
        description: place.summary,
        jsonLd: place.is_demo
            ? null
            : {
                  '@context': 'https://schema.org',
                  '@graph': [
                      {
                          '@type': 'TouristAttraction',
                          name: place.name,
                          ...(place.description ? { description: place.description } : {}),
                          ...(place.location ? { geo: { '@type': 'GeoCoordinates', latitude: place.location.lat, longitude: place.location.lng } } : {}),
                          ...(place.entry.is_free != null ? { isAccessibleForFree: place.entry.is_free } : {}),
                      },
                      breadcrumbJsonLd(crumbs),
                  ],
              },
    });

    const fee = entryText(place.entry);

    return (
        <article>
            <Cover src={place.cover?.url} alt={place.cover?.alt} title={place.name} type="place" className="h-48 sm:h-72" initial={false} />
            <div className="container-page">
                <div className="relative -mt-10 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
                    <Breadcrumbs items={crumbs} />
                    <div className="mt-3">
                        <DemoBadge show={place.is_demo} />
                    </div>
                    <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{place.name}</h1>
                    {place.summary && <p className="mt-1 text-stone-600">{place.summary}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600">
                        <Rating rating={place.rating} />
                        {place.categories?.map((c) => (
                            <Link key={c.id} to={`/places/${c.slug}`} className="hover:text-navy-700">
                                {c.name}
                            </Link>
                        ))}
                        {place.area && (
                            <Link to={`/area/${place.area.slug}`} className="hover:text-navy-700">
                                {place.area.name}
                            </Link>
                        )}
                    </div>
                    <div className="mt-5">
                        <a href={directionsHref(place.location, place.name)} target="_blank" rel="noopener noreferrer" className="btn-primary" onClick={() => track('directions_clicked', { type: 'place', id: place.id })}>
                            <Icon name="route" size={16} /> Directions
                        </a>
                    </div>
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {place.description && (
                            <section>
                                <h2 className="font-display text-xl font-bold">About</h2>
                                <p className="mt-2 whitespace-pre-line leading-relaxed text-stone-700">{place.description}</p>
                            </section>
                        )}
                        {place.facilities?.length > 0 && (
                            <section>
                                <h2 className="font-display text-xl font-bold">Facilities</h2>
                                <ul className="mt-3 flex flex-wrap gap-2">
                                    {place.facilities.map((f) => (
                                        <li key={f.name} className="chip" title={f.notes ?? undefined}>
                                            {f.name}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                        {place.accessibility_notes && (
                            <section>
                                <h2 className="font-display text-xl font-bold">Accessibility</h2>
                                <p className="mt-2 text-stone-700">{place.accessibility_notes}</p>
                            </section>
                        )}
                    </div>
                    <aside className="rounded-2xl border border-stone-200 bg-white p-5">
                        <h2 className="font-semibold">Plan your visit</h2>
                        <div className="mt-2 divide-y divide-stone-100">
                            {place.address && <InfoRow icon={<Icon name="pin" size={18} />}>{place.address}</InfoRow>}
                            <InfoRow icon={<Icon name="clock" size={18} />}>{place.timings || 'Timings not confirmed yet'}</InfoRow>
                            {fee && <InfoRow icon={<Icon name="store" size={18} />}>{fee}{place.entry.notes ? ` · ${place.entry.notes}` : ''}</InfoRow>}
                            {place.best_time_to_visit && <InfoRow icon={<Icon name="star" size={18} />}>Best time: {place.best_time_to_visit}</InfoRow>}
                            {place.has_parking != null && <InfoRow icon={<Icon name="route" size={18} />}>{place.has_parking ? 'Parking available' : 'No dedicated parking'}</InfoRow>}
                        </div>
                        <Provenance provenance={place.provenance} />
                    </aside>
                </div>

                {related?.data?.length > 0 && (
                    <section className="mt-12">
                        <h2 className="mb-4 font-display text-2xl font-bold">More to explore</h2>
                        <CardGrid>
                            {related.data.map((p) => (
                                <PlaceCard key={p.id} place={p} />
                            ))}
                        </CardGrid>
                    </section>
                )}
            </div>
        </article>
    );
}

export default function PlaceDetail() {
    const { slug } = useParams();
    const state = useApi(`/places/${slug}`);
    return <DetailGate state={state}>{(place) => <PlaceView key={place.id} place={place} />}</DetailGate>;
}
