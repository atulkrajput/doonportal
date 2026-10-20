import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { useApi } from '../hooks/useApi';
import { track } from '../lib/analytics';
import { directionsHref, formatEventDate, priceLabel } from '../lib/format';
import { CardGrid, Cover, EventCard } from '../components/Cards';
import { DemoBadge } from '../components/Badges';
import { Breadcrumbs, DetailGate, InfoRow } from '../components/Detail';
import { Icon } from '../components/Icons';
import { SaveButton } from '../context/SavedContext';

function EventView({ event }) {
    const { data: related } = useApi(`/events/${event.slug}/related`);
    const crumbs = [['/', 'Home'], ['/events', 'Events'], [null, event.title]];
    const price = priceLabel(event.price);

    useEffect(() => {
        track('event_viewed', { type: 'event', id: event.id });
    }, [event.id]);

    return (
        <article>
            <Cover src={event.cover?.url} alt={event.cover?.alt} title={event.title} type="event" className="h-48 sm:h-72" initial={false} />
            <div className="container-page">
                <div className="relative -mt-10 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
                    <Breadcrumbs items={crumbs} />
                    <div className="mt-3 flex flex-wrap gap-2">
                        <DemoBadge show={event.is_demo} />
                        {event.phase === 'LIVE' && <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs font-semibold text-navy-700">Happening now</span>}
                        {event.phase === 'COMPLETED' && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold">This event has ended</span>}
                    </div>
                    {event.is_cancelled && (
                        <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                            <strong>Cancelled.</strong> {event.cancellation_reason}
                        </div>
                    )}
                    {event.is_rescheduled && !event.is_cancelled && (
                        <div className="mt-3 rounded-xl border border-accent-400 bg-accent-100 p-3 text-sm">
                            <strong>Rescheduled</strong> from {formatEventDate(event.original_starts_at, event.timezone, !event.is_all_day)}.
                        </div>
                    )}
                    <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-accent-500">{formatEventDate(event.starts_at, event.timezone, !event.is_all_day)}</p>
                    <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">{event.title}</h1>
                    {event.summary && <p className="mt-1 text-stone-600">{event.summary}</p>}
                    <div className="mt-5 flex flex-wrap gap-2">
                        {event.ticket_url && !event.is_cancelled && (
                            <a href={event.ticket_url} target="_blank" rel="noopener noreferrer nofollow" className="btn-primary" onClick={() => track('event_ticket_clicked', { type: 'event', id: event.id })}>
                                Tickets & registration
                            </a>
                        )}
                        {event.venue && (
                            <a href={directionsHref(event.venue.location, event.venue.name)} target="_blank" rel="noopener noreferrer" className="btn-secondary" onClick={() => track('directions_clicked', { type: 'event', id: event.id })}>
                                <Icon name="route" size={16} /> Directions
                            </a>
                        )}
                        <SaveButton type="event" id={event.id} />
                    </div>
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        {event.description && (
                            <>
                                <h2 className="font-display text-xl font-bold">About this event</h2>
                                <p className="mt-2 whitespace-pre-line leading-relaxed text-stone-700">{event.description}</p>
                            </>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {event.categories?.map((c) => (
                                <Link key={c.id} to={`/events?category=${c.slug}`} className="chip">
                                    {c.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <aside className="rounded-2xl border border-stone-200 bg-white p-5">
                        <h2 className="font-semibold">Event details</h2>
                        <div className="mt-2 divide-y divide-stone-100">
                            <InfoRow icon={<Icon name="calendar" size={18} />}>
                                {formatEventDate(event.starts_at, event.timezone, !event.is_all_day)}
                                {event.ends_at && <> – {formatEventDate(event.ends_at, event.timezone, !event.is_all_day)}</>}
                                <span className="block text-xs text-stone-500">Times in {event.timezone === 'Asia/Kolkata' ? 'IST' : event.timezone}</span>
                            </InfoRow>
                            {(event.venue || event.area) && (
                                <InfoRow icon={<Icon name="pin" size={18} />}>
                                    {event.venue?.name}
                                    {event.venue?.address && <span className="block">{event.venue.address}</span>}
                                    {event.area && (
                                        <Link to={`/area/${event.area.slug}`} className="block text-navy-700 hover:underline">
                                            {event.area.name}
                                        </Link>
                                    )}
                                </InfoRow>
                            )}
                            {event.online_url && <InfoRow icon={<Icon name="globe" size={18} />}>Online event</InfoRow>}
                            {price && <InfoRow icon={<Icon name="store" size={18} />}>{price}</InfoRow>}
                            {event.age_restriction && <InfoRow icon={<Icon name="user" size={18} />}>{event.age_restriction}</InfoRow>}
                            {event.organizer && <InfoRow icon={<Icon name="user" size={18} />}>Organised by {event.organizer.name}</InfoRow>}
                        </div>
                        {event.provenance?.source_name && <p className="mt-4 text-xs text-stone-500">Source: {event.provenance.source_name}</p>}
                    </aside>
                </div>

                {related?.data?.length > 0 && (
                    <section className="mt-12">
                        <h2 className="mb-4 font-display text-2xl font-bold">More events</h2>
                        <CardGrid>
                            {related.data.map((e) => (
                                <EventCard key={e.id} event={e} />
                            ))}
                        </CardGrid>
                    </section>
                )}
            </div>
        </article>
    );
}

export default function EventDetail() {
    const { slug } = useParams();
    const state = useApi(`/events/${slug}`);
    return <DetailGate state={state}>{(event) => <EventView key={event.id} event={event} />}</DetailGate>;
}
