import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { SaveButton } from '../context/SavedContext';
import { track } from '../lib/analytics';
import { DAYS, directionsHref, formatDate, formatPaise, priceRange, telHref, whatsappHref } from '../lib/format';
import { BusinessCard, CardGrid, Cover } from '../components/Cards';
import { DemoBadge, OpenBadge, Rating, VerifiedBadge } from '../components/Badges';
import { Breadcrumbs, DetailGate, InfoRow, Provenance } from '../components/Detail';
import { Icon } from '../components/Icons';
import { BusinessReviews } from '../components/Reviews';
import ClaimListing from '../components/ClaimListing';

function Actions({ business }) {
    const { contact } = business;
    const entity = { type: 'business', id: business.id };
    const actions = [
        contact.phone && { href: telHref(contact.phone), label: 'Call', icon: 'phone', event: 'business_phone_clicked' },
        contact.whatsapp && { href: whatsappHref(contact.whatsapp), label: 'WhatsApp', icon: 'chat', event: 'business_whatsapp_clicked', external: true },
        { href: directionsHref(business.location, `${business.name} ${business.address?.line ?? ''}`), label: 'Directions', icon: 'route', event: 'directions_clicked', external: true },
        contact.website && { href: contact.website, label: 'Website', icon: 'globe', event: 'business_website_clicked', external: true },
        contact.email && { href: `mailto:${contact.email}`, label: 'Email', icon: 'mail' },
    ].filter(Boolean);

    return (
        <div className="flex flex-wrap gap-2">
            {actions.map((a, i) => (
                <a
                    key={a.label}
                    href={a.href}
                    className={i === 0 ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => a.event && track(a.event, entity)}
                    {...(a.external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}
                >
                    <Icon name={a.icon} size={16} /> {a.label}
                </a>
            ))}
            <SaveButton type="business" id={business.id} />
        </div>
    );
}

function Hours({ hours, openNow }) {
    if (!hours?.length) {
        return <p className="text-sm text-stone-500">Opening hours not confirmed yet.</p>;
    }
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getDay();
    return (
        <div>
            <OpenBadge open={openNow} />
            <table className="mt-2 w-full text-sm">
                <tbody>
                    {DAYS.map((day, i) => {
                        const slots = hours.filter((h) => h.day_of_week === i);
                        return (
                            <tr key={day} className={i === today ? 'font-semibold text-ink' : 'text-stone-600'}>
                                <th scope="row" className="py-1 pr-4 text-left font-normal">
                                    {day}
                                </th>
                                <td className="py-1 text-right">
                                    {!slots.length ? '—' : slots.every((s) => s.is_closed) ? 'Closed' : slots.filter((s) => !s.is_closed).map((s) => `${s.opens_at}–${s.closes_at}`).join(', ')}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/** Gallery photos; a click opens the full image. */
function Photos({ photos, name }) {
    const [open, setOpen] = useState(null);
    useEffect(() => {
        if (open === null) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(null);
            if (e.key === 'ArrowRight') setOpen((i) => (i + 1) % photos.length);
            if (e.key === 'ArrowLeft') setOpen((i) => (i - 1 + photos.length) % photos.length);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, photos.length]);
    const current = open !== null ? photos[open] : null;

    return (
        <section>
            <h2 className="font-display text-xl font-bold">Photos</h2>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((ph, i) => (
                    <li key={ph.id}>
                        <button type="button" className="block w-full overflow-hidden rounded-xl" onClick={() => setOpen(i)} aria-label={`Open photo ${i + 1}${ph.caption ? `: ${ph.caption}` : ''}`}>
                            <img src={ph.media.url} alt={ph.caption || ph.media.alt || `${name} photo ${i + 1}`} loading="lazy" className="aspect-[4/3] w-full bg-stone-100 object-cover transition hover:scale-105" />
                        </button>
                        {ph.caption && <p className="mt-1 text-xs text-stone-600">{ph.caption}</p>}
                    </li>
                ))}
            </ul>
            {current && (
                <div role="dialog" aria-modal="true" aria-label={`${name} photos`} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)}>
                    <img src={current.media.url} alt={current.caption || current.media.alt || name} className="max-h-[80vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
                    <p className="mt-3 text-center text-sm text-white">
                        {current.caption}
                        {current.media.credit && <span className="block text-xs text-stone-300">{current.media.credit}</span>}
                        <span className="block text-xs text-stone-400">
                            {open + 1} of {photos.length} · Esc to close
                        </span>
                    </p>
                    <button type="button" className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/20" onClick={() => setOpen(null)}>
                        Close
                    </button>
                </div>
            )}
        </section>
    );
}

function BusinessView({ business }) {
    const { user } = useAuth();
    const { data: owned } = useApi(user?.is_business_owner ? '/me/businesses' : null);
    const isOwner = Boolean(owned?.data?.some((b) => b.id === business.id));
    const { data: services } = useApi(`/businesses/${business.slug}/services`);
    const { data: offers } = useApi(`/businesses/${business.slug}/offers`);
    const { data: related } = useApi(`/businesses/${business.slug}/related`);
    const { data: photos } = useApi(`/businesses/${business.slug}/photos`);
    const primary = business.categories?.[0];
    const crumbs = [['/', 'Home'], ...(primary ? [[`/businesses/${primary.slug}`, primary.name]] : [['/businesses', 'Businesses']]), [null, business.name]];

    useEffect(() => {
        track('business_viewed', { type: 'business', id: business.id });
    }, [business.id]);

    return (
        <article>
            <div className="relative">
                <Cover src={business.cover?.url} alt={business.cover?.alt} title={business.name} className="h-48 sm:h-72" initial={false} />
                {business.cover?.credit && <p className="absolute bottom-12 right-3 max-w-[70%] truncate rounded bg-black/50 px-2 py-0.5 text-[11px] text-white sm:bottom-14">{business.cover.credit}</p>}
            </div>
            <div className="container-page">
                <div className="relative -mt-10 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
                    <Breadcrumbs items={crumbs} />
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <VerifiedBadge show={business.is_verified} />
                        <DemoBadge show={business.is_demo} />
                        {business.status === 'CLOSED' && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold">Permanently closed</span>}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                        {business.logo?.url && <img src={business.logo.url} alt={`${business.name} logo`} className="h-14 w-14 shrink-0 rounded-xl border border-stone-200 bg-white object-cover sm:h-16 sm:w-16" />}
                        <h1 className="font-display text-3xl font-bold sm:text-4xl">{business.name}</h1>
                    </div>
                    {business.tagline && <p className="mt-1 text-stone-600">{business.tagline}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600">
                        <Rating rating={business.rating} />
                        {business.categories?.map((c) => (
                            <Link key={c.id} to={`/businesses/${c.slug}`} className="hover:text-navy-700">
                                {c.name}
                            </Link>
                        ))}
                        {business.area && (
                            <Link to={`/area/${business.area.slug}`} className="hover:text-navy-700">
                                {business.area.name}
                            </Link>
                        )}
                        {priceRange(business.price_range) && <span>{priceRange(business.price_range)}</span>}
                    </div>
                    <div className="mt-5">
                        <Actions business={business} />
                    </div>
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-3">
                    <div className="space-y-8 lg:col-span-2">
                        {business.description && (
                            <section>
                                <h2 className="font-display text-xl font-bold">About</h2>
                                <p className="mt-2 whitespace-pre-line leading-relaxed text-stone-700">{business.description}</p>
                            </section>
                        )}
                        {photos?.data?.length > 0 && <Photos photos={photos.data} name={business.name} />}
                        {offers?.data?.length > 0 && (
                            <section>
                                <h2 className="font-display text-xl font-bold">Offers</h2>
                                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                                    {offers.data.map((o) => (
                                        <li key={o.id} className="rounded-2xl border border-accent-400 bg-accent-100 p-4">
                                            <p className="font-semibold">{o.title}</p>
                                            {o.discount_label && <p className="text-sm font-semibold text-amber-900">{o.discount_label}</p>}
                                            {o.description && <p className="mt-1 text-sm">{o.description}</p>}
                                            {o.ends_at && <p className="mt-2 text-xs text-stone-600">Valid until {formatDate(o.ends_at)}</p>}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                        {services?.data?.length > 0 && (
                            <section>
                                <h2 className="font-display text-xl font-bold">Services & menu</h2>
                                <ul className="mt-3 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
                                    {services.data.map((s) => (
                                        <li key={s.id} className="flex justify-between gap-4 p-4 text-sm">
                                            <div>
                                                <p className="font-medium">{s.name}</p>
                                                {s.description && <p className="text-stone-600">{s.description}</p>}
                                            </div>
                                            {s.price_min_paise != null && <p className="shrink-0 font-semibold">{formatPaise(s.price_min_paise)}</p>}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                        {business.amenities?.length > 0 && (
                            <section>
                                <h2 className="font-display text-xl font-bold">Amenities</h2>
                                <ul className="mt-3 flex flex-wrap gap-2">
                                    {business.amenities.map((a) => (
                                        <li key={a} className="chip">
                                            {a}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                        <section id="reviews">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h2 className="font-display text-xl font-bold">Reviews</h2>
                                {business.rating?.count > 0 && (
                                    <p className="text-sm text-stone-600">
                                        <span className="font-semibold text-ink">{business.rating.average}</span> out of 5 · {business.rating.count} review{business.rating.count > 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                            <div className="mt-3">
                                <BusinessReviews business={business} isOwner={isOwner} />
                            </div>
                        </section>
                    </div>

                    <aside className="space-y-6">
                        <div className="rounded-2xl border border-stone-200 bg-white p-5">
                            <h2 className="font-semibold">Details</h2>
                            <div className="mt-2 divide-y divide-stone-100">
                                {(business.address.line || business.address.locality) && (
                                    <InfoRow icon={<Icon name="pin" size={18} />}>{[business.address.line, business.address.locality, business.address.city, business.address.pincode].filter(Boolean).join(', ')}</InfoRow>
                                )}
                                {business.contact.phone && <InfoRow icon={<Icon name="phone" size={18} />}>{business.contact.phone}</InfoRow>}
                                {business.contact.website && (
                                    <InfoRow icon={<Icon name="globe" size={18} />}>
                                        <a href={business.contact.website} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-navy-700 underline">
                                            {business.contact.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    </InfoRow>
                                )}
                                {!business.address.line && !business.address.locality && !business.contact.phone && !business.contact.website && (
                                    <p className="py-2 text-sm text-stone-500">Address and contact details not confirmed yet.</p>
                                )}
                                {business.social_links?.map((l) => (
                                    <InfoRow key={l.platform} icon={<Icon name="globe" size={18} />}>
                                        <a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="capitalize text-navy-700 underline">
                                            {l.platform}
                                        </a>
                                    </InfoRow>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-stone-200 bg-white p-5">
                            <h2 className="flex items-center gap-2 font-semibold">
                                <Icon name="clock" size={18} /> Opening hours
                            </h2>
                            <div className="mt-2">
                                <Hours hours={business.hours} openNow={business.open_now} />
                            </div>
                        </div>
                        <div className="rounded-2xl border border-stone-200 bg-white p-5 text-sm">
                            <ClaimListing business={business} isOwner={isOwner} />
                            <p className="mt-4 flex items-center gap-1 border-t border-stone-100 pt-4 text-stone-600">
                                <Icon name="flag" size={16} /> Spotted something wrong? Corrections open soon.
                            </p>
                            <Provenance provenance={business.provenance} />
                        </div>
                    </aside>
                </div>

                {related?.data?.length > 0 && (
                    <section className="mt-12">
                        <h2 className="mb-4 font-display text-2xl font-bold">You might also like</h2>
                        <CardGrid>
                            {related.data.map((b) => (
                                <BusinessCard key={b.id} business={b} />
                            ))}
                        </CardGrid>
                    </section>
                )}
            </div>
        </article>
    );
}

export default function BusinessDetail() {
    const { slug } = useParams();
    const state = useApi(`/businesses/${slug}`);
    return <DetailGate state={state}>{(business) => <BusinessView key={business.id} business={business} />}</DetailGate>;
}
