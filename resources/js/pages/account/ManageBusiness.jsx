import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { api, errorMessage, fieldErrors } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { DAYS, formatDate } from '../../lib/format';
import { Icon } from '../../components/Icons';
import { Message, StatusPill } from '../../components/Form';
import { Stars } from '../../components/Reviews';
import { EmptyState, ErrorState, PageLoading } from '../../components/States';
import { VerifiedBadge } from '../../components/Badges';
import { Panel } from './AccountLayout';

const TABS = [
    ['details', 'Listing details', 'list'],
    ['reviews', 'Reviews', 'star'],
    ['stats', 'Performance', 'chart'],
];

const SOCIAL = [
    ['instagram', 'Instagram'],
    ['facebook', 'Facebook'],
    ['x', 'X (Twitter)'],
    ['youtube', 'YouTube'],
    ['linkedin', 'LinkedIn'],
    ['whatsapp', 'WhatsApp channel'],
    ['zomato', 'Zomato'],
    ['swiggy', 'Swiggy'],
    ['google_maps', 'Google Maps'],
    ['other', 'Other'],
];

const FIELD_LABELS = {
    tagline: 'Tagline',
    description: 'About',
    address_line: 'Address',
    locality: 'Locality',
    pincode: 'PIN code',
    phone: 'Phone',
    whatsapp: 'WhatsApp',
    email: 'Email',
    website: 'Website',
    price_range: 'Price range',
    amenities: 'Amenities',
    payment_methods: 'Payment methods',
    hours: 'Opening hours',
    services: 'Services & menu',
    social_links: 'Social links',
    logo_media_id: 'Logo',
    cover_media_id: 'Cover photo',
    photos: 'Photos',
};

const toList = (text) =>
    text
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

function Err({ errors, name }) {
    const e = errors[name]?.[0];
    return e ? <span className="mt-1 block text-sm text-red-700">{e}</span> : null;
}

function Input({ label, name, values, setValues, errors, type = 'text', className = '', ...props }) {
    const Tag = type === 'textarea' ? 'textarea' : 'input';
    return (
        <label className={`block ${className}`}>
            <span className="text-sm font-medium text-stone-700">{label}</span>
            <Tag
                className="input mt-1"
                type={type === 'textarea' ? undefined : type}
                rows={type === 'textarea' ? 5 : undefined}
                value={values[name] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
                aria-invalid={Boolean(errors[name])}
                {...props}
            />
            <Err errors={errors} name={name} />
        </label>
    );
}

/** Opening hours: per day, closed or one or more time slots. */
function HoursEditor({ hours, onChange, errors }) {
    const byDay = DAYS.map((_, day) => hours.filter((h) => h.day_of_week === day));
    const setDay = (day, slots) => onChange([...hours.filter((h) => h.day_of_week !== day), ...slots].sort((a, b) => a.day_of_week - b.day_of_week));
    const copyToAll = (day) => {
        const template = byDay[day];
        onChange(DAYS.flatMap((_, d) => template.map((s) => ({ ...s, day_of_week: d }))));
    };
    const hourErrors = Object.keys(errors).filter((k) => k.startsWith('hours'));

    return (
        <div>
            <ul className="divide-y divide-stone-100">
                {DAYS.map((label, day) => {
                    const slots = byDay[day];
                    const closed = slots.length > 0 && slots.every((s) => s.is_closed);
                    const unknown = slots.length === 0;
                    return (
                        <li key={label} className="grid gap-2 py-3 sm:grid-cols-[110px_1fr] sm:items-start">
                            <span className="pt-2 text-sm font-semibold">{label}</span>
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2 text-sm">
                                    {[
                                        ['open', 'Open', !closed && !unknown],
                                        ['closed', 'Closed', closed],
                                        ['unknown', 'Not set', unknown],
                                    ].map(([mode, text, active]) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() =>
                                                setDay(day, mode === 'open' ? [{ day_of_week: day, is_closed: false, opens_at: '09:00', closes_at: '18:00' }] : mode === 'closed' ? [{ day_of_week: day, is_closed: true, opens_at: null, closes_at: null }] : [])
                                            }
                                            className={`rounded-full px-3 py-1 font-semibold ${active ? 'bg-navy-700 text-white' : 'border border-stone-300 bg-white text-stone-700'}`}
                                        >
                                            {text}
                                        </button>
                                    ))}
                                    {!closed && !unknown && (
                                        <button type="button" className="text-sm font-semibold text-navy-700 underline" onClick={() => copyToAll(day)}>
                                            Copy to all days
                                        </button>
                                    )}
                                </div>
                                {!closed &&
                                    slots.map((slot, i) => (
                                        <div key={i} className="flex flex-wrap items-center gap-2">
                                            <input
                                                type="time"
                                                className="input w-32"
                                                value={slot.opens_at ?? ''}
                                                aria-label={`${label} opens`}
                                                onChange={(e) => setDay(day, slots.map((s, j) => (j === i ? { ...s, opens_at: e.target.value } : s)))}
                                            />
                                            <span className="text-stone-500">to</span>
                                            <input
                                                type="time"
                                                className="input w-32"
                                                value={slot.closes_at ?? ''}
                                                aria-label={`${label} closes`}
                                                onChange={(e) => setDay(day, slots.map((s, j) => (j === i ? { ...s, closes_at: e.target.value } : s)))}
                                            />
                                            {slots.length > 1 ? (
                                                <button type="button" className="text-sm text-stone-600 underline" onClick={() => setDay(day, slots.filter((_, j) => j !== i))}>
                                                    Remove
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="text-sm text-navy-700 underline"
                                                    onClick={() => setDay(day, [...slots, { day_of_week: day, is_closed: false, opens_at: '17:00', closes_at: '22:00' }])}
                                                >
                                                    Add a second slot
                                                </button>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </li>
                    );
                })}
            </ul>
            {hourErrors.length > 0 && <p className="mt-2 text-sm text-red-700">{errors[hourErrors[0]][0]} Check the opening hours.</p>}
            <p className="mt-2 text-xs text-stone-500">Times are in Indian Standard Time. For past midnight, close at e.g. 01:00.</p>
        </div>
    );
}

function ServicesEditor({ services, onChange, errors }) {
    const update = (i, patch) => onChange(services.map((s, j) => (j === i ? { ...s, ...patch } : s)));
    return (
        <div className="space-y-3">
            {services.map((s, i) => (
                <div key={i} className="grid gap-2 rounded-xl border border-stone-200 p-3 sm:grid-cols-[1fr_140px_auto]">
                    <div className="space-y-2">
                        <input className="input" placeholder="Name, e.g. Cappuccino" value={s.name} aria-label="Service name" onChange={(e) => update(i, { name: e.target.value })} />
                        <Err errors={errors} name={`services.${i}.name`} />
                        <input className="input" placeholder="Short description (optional)" value={s.description ?? ''} aria-label="Service description" onChange={(e) => update(i, { description: e.target.value })} />
                    </div>
                    <label className="block">
                        <span className="sr-only">Price in rupees</span>
                        <div className="flex items-center gap-1">
                            <span className="text-stone-500">₹</span>
                            <input
                                className="input"
                                inputMode="decimal"
                                placeholder="Price"
                                value={s.price_min_paise != null ? s.price_min_paise / 100 : ''}
                                onChange={(e) => update(i, { price_min_paise: e.target.value === '' ? null : Math.round(Number(e.target.value) * 100) })}
                            />
                        </div>
                        <Err errors={errors} name={`services.${i}.price_min_paise`} />
                    </label>
                    <button type="button" className="self-start text-sm text-stone-600 underline hover:text-red-700" onClick={() => onChange(services.filter((_, j) => j !== i))}>
                        Remove
                    </button>
                </div>
            ))}
            <button type="button" className="btn-secondary" onClick={() => onChange([...services, { name: '', description: '', price_min_paise: null, price_max_paise: null }])}>
                + Add a service or menu item
            </button>
        </div>
    );
}

function SocialEditor({ links, onChange, errors }) {
    const used = links.map((l) => l.platform);
    return (
        <div className="space-y-2">
            {links.map((l, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                    <select className="input w-44" value={l.platform} aria-label="Platform" onChange={(e) => onChange(links.map((x, j) => (j === i ? { ...x, platform: e.target.value } : x)))}>
                        {SOCIAL.map(([value, label]) => (
                            <option key={value} value={value} disabled={value !== l.platform && used.includes(value)}>
                                {label}
                            </option>
                        ))}
                    </select>
                    <input className="input min-w-0 flex-1" type="url" placeholder="https://" value={l.url} aria-label="Link" onChange={(e) => onChange(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                    <button type="button" className="text-sm text-stone-600 underline" onClick={() => onChange(links.filter((_, j) => j !== i))}>
                        Remove
                    </button>
                    <Err errors={errors} name={`social_links.${i}.url`} />
                </div>
            ))}
            {links.length < SOCIAL.length && (
                <button type="button" className="btn-secondary" onClick={() => onChange([...links, { platform: SOCIAL.find(([v]) => !used.includes(v))[0], url: '' }])}>
                    + Add a link
                </button>
            )}
        </div>
    );
}

const MAX_PHOTOS = 10;

/** Pick an image file and upload it; calls onUploaded({ id, url }). */
function UploadButton({ businessId, kind, label, onUploaded, onError, className = 'btn-secondary' }) {
    const [busy, setBusy] = useState(false);
    const pick = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            onError('That image is over 5 MB. Please choose a smaller one.');
            return;
        }
        setBusy(true);
        onError(null);
        try {
            const form = new FormData();
            form.append('file', file);
            form.append('kind', kind);
            const { data } = await api.post(`/me/businesses/${businessId}/images`, form, { timeout: 60000 });
            onUploaded(data.data);
        } catch (err) {
            onError(fieldErrors(err).file?.[0] || errorMessage(err));
        } finally {
            setBusy(false);
        }
    };
    return (
        <label className={`${className} cursor-pointer ${busy ? 'pointer-events-none opacity-60' : ''}`}>
            {busy ? 'Uploading…' : label}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pick} disabled={busy} />
        </label>
    );
}

/** Logo, cover and gallery photos. Uploads are private until staff approve the change. */
function PhotosEditor({ businessId, values, setValues, media, setMedia, errors }) {
    const [error, setError] = useState(null);
    const photos = values.photos || [];
    const remember = (m) => setMedia((all) => ({ ...all, [m.id]: m.url }));
    const setPhotos = (list) => setValues((v) => ({ ...v, photos: list }));
    const photoErrors = Object.keys(errors).filter((k) => k.startsWith('photos'));

    const single = (name, kind, title, hint, shape) => {
        const url = values[name] ? media[values[name]] : null;
        return (
            <div>
                <p className="text-sm font-medium text-stone-700">{title}</p>
                <div className="mt-2 flex items-center gap-3">
                    <div className={`${shape} flex shrink-0 items-center justify-center overflow-hidden border border-stone-200 bg-stone-100 text-xs text-stone-500`}>
                        {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : 'None'}
                    </div>
                    <div className="flex flex-col items-start gap-2">
                        <UploadButton
                            businessId={businessId}
                            kind={kind}
                            label={url ? 'Replace' : 'Upload'}
                            onError={setError}
                            onUploaded={(m) => {
                                remember(m);
                                setValues((v) => ({ ...v, [name]: m.id }));
                            }}
                        />
                        {url && (
                            <button type="button" className="text-sm text-stone-600 underline hover:text-red-700" onClick={() => setValues((v) => ({ ...v, [name]: null }))}>
                                Remove
                            </button>
                        )}
                    </div>
                </div>
                <p className="mt-1 text-xs text-stone-500">{hint}</p>
                <Err errors={errors} name={name} />
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {error && (
                <p role="alert" className="text-sm text-red-700">
                    {error}
                </p>
            )}
            <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
                {single('logo_media_id', 'logo', 'Logo', 'Square works best.', 'h-20 w-20 rounded-xl')}
                {single('cover_media_id', 'cover', 'Cover photo', 'Shown at the top of your listing. Wide (landscape) works best.', 'h-20 w-36 rounded-xl')}
            </div>
            <div>
                <p className="text-sm font-medium text-stone-700">
                    Gallery{' '}
                    <span className="font-normal text-stone-500">
                        ({photos.length} of {MAX_PHOTOS})
                    </span>
                </p>
                {photos.length > 0 && (
                    <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {photos.map((ph, i) => (
                            <li key={ph.media_id} className="overflow-hidden rounded-xl border border-stone-200">
                                <img src={media[ph.media_id]} alt="" className="aspect-[4/3] w-full bg-stone-100 object-cover" />
                                <div className="space-y-2 p-2">
                                    <input
                                        className="input text-sm"
                                        placeholder="Caption (optional)"
                                        maxLength={150}
                                        aria-label={`Caption for photo ${i + 1}`}
                                        value={ph.caption ?? ''}
                                        onChange={(e) => setPhotos(photos.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))}
                                    />
                                    <div className="flex gap-3 text-xs">
                                        {i > 0 && (
                                            <button type="button" className="underline" onClick={() => setPhotos(photos.map((x, j) => (j === i - 1 ? photos[i] : j === i ? photos[i - 1] : x)))}>
                                                Move earlier
                                            </button>
                                        )}
                                        <button type="button" className="ml-auto text-stone-600 underline hover:text-red-700" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                {photoErrors.length > 0 && <p className="mt-2 text-sm text-red-700">{errors[photoErrors[0]][0]}</p>}
                {photos.length < MAX_PHOTOS && (
                    <div className="mt-3">
                        <UploadButton
                            businessId={businessId}
                            kind="photo"
                            label="+ Add a photo"
                            onError={setError}
                            onUploaded={(m) => {
                                remember(m);
                                setPhotos([...photos, { media_id: m.id, caption: '' }]);
                            }}
                        />
                    </div>
                )}
            </div>
            <p className="text-xs text-stone-500">
                JPEG, PNG or WebP, up to 5 MB each. Only use photos you took or have permission to use. New photos show on your listing once our team approves your changes.
            </p>
        </div>
    );
}

function DetailsTab({ business, onSubmitted }) {
    const pending = business.pending_edit;
    const start = { ...business.current, ...(pending?.payload || {}) };
    const [values, setValues] = useState({
        ...start,
        amenities: (start.amenities || []).join(', '),
        payment_methods: (start.payment_methods || []).join(', '),
    });
    const [media, setMedia] = useState(business.media || {});
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [busy, setBusy] = useState(false);
    const set = (name) => (value) => setValues((v) => ({ ...v, [name]: value }));

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors({});
        setMessage(null);
        try {
            await api.post(`/me/businesses/${business.id}/edits`, {
                ...values,
                price_range: values.price_range ? Number(values.price_range) : null,
                amenities: toList(values.amenities),
                payment_methods: toList(values.payment_methods),
                services: values.services.filter((s) => s.name.trim()),
                social_links: values.social_links.filter((l) => l.url.trim()),
                photos: (values.photos || []).map((ph) => ({ media_id: ph.media_id, caption: ph.caption?.trim() || null })),
            });
            onSubmitted('Thanks! Your changes have been sent to our team and will go live once approved, usually within 2 working days.');
            window.scrollTo(0, 0);
        } catch (err) {
            setErrors(fieldErrors(err));
            setMessage({ type: 'error', text: fieldErrors(err).changes?.[0] || errorMessage(err) });
        } finally {
            setBusy(false);
        }
    };

    const withdraw = async () => {
        await api.delete(`/me/submissions/${pending.id}`);
        onSubmitted('Your pending changes were withdrawn. Your live listing is unchanged.');
    };

    const p = { values, setValues, errors };

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <Message message={message} />
            {pending && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm">
                    <p className="font-semibold text-amber-900">Changes waiting for review</p>
                    <p className="mt-1 text-amber-900">
                        You sent changes to {Object.keys(pending.payload).map((k) => FIELD_LABELS[k] || k).join(', ')} on {formatDate(pending.updated_at)}. The form below includes them; sending again replaces them.
                    </p>
                    <button type="button" className="mt-2 font-semibold text-amber-900 underline" onClick={withdraw}>
                        Withdraw these changes
                    </button>
                </div>
            )}
            {!pending && business.last_decision?.status === 'REJECTED' && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                    <p className="font-semibold">Your last changes weren’t approved</p>
                    {business.last_decision.review_notes && <p className="mt-1">Note from our team: {business.last_decision.review_notes}</p>}
                </div>
            )}

            <Panel title="About">
                <p className="mb-4 text-sm text-stone-600">
                    Name, categories and verification are managed by our team.{' '}
                    <Link to="/contact" className="underline">
                        Contact us
                    </Link>{' '}
                    to change them.
                </p>
                <div className="space-y-4">
                    <Input label="Tagline" name="tagline" maxLength={255} {...p} />
                    <Input label="About the business" name="description" type="textarea" maxLength={10000} {...p} />
                    <label className="block max-w-xs">
                        <span className="text-sm font-medium text-stone-700">Price range</span>
                        <select className="input mt-1" value={values.price_range ?? ''} onChange={(e) => set('price_range')(e.target.value)}>
                            <option value="">Not set</option>
                            <option value="1">₹ Budget</option>
                            <option value="2">₹₹ Moderate</option>
                            <option value="3">₹₹₹ Pricey</option>
                            <option value="4">₹₹₹₹ Luxury</option>
                        </select>
                    </label>
                    <Input label="Amenities" name="amenities" placeholder="Wi-Fi, Parking, Outdoor seating" {...p} />
                    <Input label="Payment methods" name="payment_methods" placeholder="UPI, Cash, Cards" {...p} />
                    <p className="-mt-2 text-xs text-stone-500">Separate items with commas.</p>
                </div>
            </Panel>

            <Panel title="Photos">
                <PhotosEditor businessId={business.id} values={values} setValues={setValues} media={media} setMedia={setMedia} errors={errors} />
            </Panel>

            <Panel title="Location & contact">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input className="sm:col-span-2" label="Address" name="address_line" maxLength={255} {...p} />
                    <Input label="Locality / landmark" name="locality" maxLength={255} {...p} />
                    <Input label="PIN code" name="pincode" inputMode="numeric" maxLength={6} {...p} />
                    <Input label="Phone" name="phone" type="tel" placeholder="+91 98765 43210" {...p} />
                    <Input label="WhatsApp" name="whatsapp" type="tel" placeholder="+91 98765 43210" {...p} />
                    <Input label="Email" name="email" type="email" {...p} />
                    <Input label="Website" name="website" type="url" placeholder="https://" {...p} />
                </div>
            </Panel>

            <Panel title="Opening hours">
                <HoursEditor hours={values.hours} onChange={set('hours')} errors={errors} />
            </Panel>

            <Panel title="Services & menu">
                <ServicesEditor services={values.services} onChange={set('services')} errors={errors} />
            </Panel>

            <Panel title="Social links">
                <SocialEditor links={values.social_links} onChange={set('social_links')} errors={errors} />
            </Panel>

            <div className="sticky bottom-20 z-10 flex items-center justify-end gap-3 rounded-2xl border border-stone-200 bg-white/95 p-3 shadow-sm backdrop-blur md:bottom-4">
                <p className="mr-auto hidden text-sm text-stone-600 sm:block">Changes go live after a quick check by our team.</p>
                <button type="submit" className="btn-primary" disabled={busy}>
                    {busy ? 'Sending…' : 'Send changes for review'}
                </button>
            </div>
        </form>
    );
}

function ReplyBox({ businessId, review, onSaved }) {
    const [editing, setEditing] = useState(!review.owner_reply);
    const [body, setBody] = useState(review.owner_reply ?? '');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const url = `/me/businesses/${businessId}/reviews/${review.id}/reply`;

    const save = async (remove = false) => {
        setBusy(true);
        setError(null);
        try {
            const { data } = remove ? await api.delete(url) : await api.put(url, { body });
            onSaved(data.data);
            setBody(data.data.owner_reply ?? '');
            setEditing(!data.data.owner_reply);
        } catch (err) {
            setError(fieldErrors(err).body?.[0] || errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    if (!editing) {
        return (
            <div className="mt-3 border-l-4 border-navy-200 bg-navy-50/60 py-2 pl-3 pr-2 text-sm">
                <p className="font-semibold text-navy-700">Your reply</p>
                <p className="mt-1 whitespace-pre-line text-stone-700">{review.owner_reply}</p>
                <div className="mt-2 flex gap-3">
                    <button type="button" className="font-semibold text-navy-700 underline" onClick={() => setEditing(true)}>
                        Edit
                    </button>
                    <button type="button" className="text-stone-600 underline hover:text-red-700" disabled={busy} onClick={() => save(true)}>
                        Delete reply
                    </button>
                </div>
            </div>
        );
    }
    return (
        <div className="mt-3 space-y-2">
            <label className="block">
                <span className="text-sm font-medium text-stone-700">Public reply</span>
                <textarea className="input mt-1" rows={3} maxLength={1500} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Thank the reviewer or respond to their feedback. Replies are public." />
            </label>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <div className="flex gap-2">
                <button type="button" className="btn-primary" disabled={busy || !body.trim()} onClick={() => save()}>
                    {busy ? 'Posting…' : 'Post reply'}
                </button>
                {review.owner_reply && (
                    <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}

function ReviewsTab({ business }) {
    const { data, loading, error } = useApi(`/me/businesses/${business.id}/reviews`, { per_page: 50 });
    const [updated, setUpdated] = useState({});

    if (loading) {
        return <PageLoading />;
    }
    if (error) {
        return <ErrorState error={error} />;
    }
    if (!data?.data?.length) {
        return <EmptyState title="No published reviews yet">When members review {business.name}, you’ll be able to reply here.</EmptyState>;
    }
    return (
        <ul className="space-y-4">
            {data.data.map((original) => {
                const r = updated[original.id] || original;
                return (
                    <li key={r.id} className="rounded-2xl border border-stone-200 bg-white p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold">{r.author?.name ?? 'Member'}</p>
                            <Stars rating={r.rating} size="text-sm" />
                        </div>
                        {r.title && <p className="mt-1 font-medium">{r.title}</p>}
                        <p className="mt-1 whitespace-pre-line text-sm text-stone-700">{r.body}</p>
                        <p className="mt-2 text-xs text-stone-500">{formatDate(r.created_at)}</p>
                        <ReplyBox businessId={business.id} review={r} onSaved={(next) => setUpdated((u) => ({ ...u, [r.id]: next }))} />
                    </li>
                );
            })}
        </ul>
    );
}

const STAT_LABELS = {
    business_viewed: ['Listing views', 'globe'],
    business_phone_clicked: ['Calls', 'phone'],
    business_whatsapp_clicked: ['WhatsApp chats', 'chat'],
    directions_clicked: ['Direction requests', 'route'],
    business_website_clicked: ['Website visits', 'external'],
    business_saved: ['Saves', 'heart'],
    offer_clicked: ['Offer clicks', 'tag'],
};

function StatsTab({ business }) {
    const [days, setDays] = useState(30);
    const { data, loading, error } = useApi(`/me/businesses/${business.id}/stats`, { days });

    if (error) {
        return <ErrorState error={error} />;
    }
    const stats = data?.data;
    const max = Math.max(1, ...(stats?.daily_views || []).map((d) => d.views));

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-stone-600">How people interacted with your listing on DoonPortal.</p>
                <div className="flex gap-1" role="group" aria-label="Period">
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            type="button"
                            aria-pressed={days === d}
                            onClick={() => setDays(d)}
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${days === d ? 'bg-navy-700 text-white' : 'border border-stone-300 bg-white'}`}
                        >
                            {d} days
                        </button>
                    ))}
                </div>
            </div>
            {loading || !stats ? (
                <PageLoading />
            ) : (
                <>
                    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {stats.totals.map((t) => (
                            <li key={t.event} className="rounded-2xl border border-stone-200 bg-white p-4">
                                <p className="flex items-center gap-1.5 text-sm text-stone-600">
                                    <Icon name={STAT_LABELS[t.event]?.[1] || 'chart'} size={16} /> {STAT_LABELS[t.event]?.[0] || t.event}
                                </p>
                                <p className="mt-1 font-display text-3xl font-bold">{t.total.toLocaleString('en-IN')}</p>
                            </li>
                        ))}
                        <li className="rounded-2xl border border-stone-200 bg-white p-4">
                            <p className="flex items-center gap-1.5 text-sm text-stone-600">
                                <Icon name="star" size={16} /> Rating
                            </p>
                            <p className="mt-1 font-display text-3xl font-bold">{stats.rating.count ? stats.rating.average : '–'}</p>
                            <p className="text-xs text-stone-500">{stats.rating.count} review{stats.rating.count === 1 ? '' : 's'}</p>
                        </li>
                    </ul>
                    <Panel title="Daily views">
                        <div className="flex h-40 items-end gap-px" role="img" aria-label={`Daily listing views over the last ${days} days, peaking at ${max}`}>
                            {stats.daily_views.map((d) => (
                                <div key={d.date} className="group relative flex h-full flex-1 items-end">
                                    <div className="w-full rounded-t bg-navy-500 transition-colors group-hover:bg-accent-500" style={{ height: `${Math.max(2, (d.views / max) * 100)}%`, minHeight: d.views ? 4 : 1 }} />
                                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-white group-hover:block">
                                        {formatDate(d.date)}: {d.views}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-stone-500">
                            <span>{formatDate(stats.daily_views[0]?.date)}</span>
                            <span>Today</span>
                        </div>
                    </Panel>
                    <p className="text-xs text-stone-500">Counts cover activity on DoonPortal only, not on Google, social media or other sites.</p>
                </>
            )}
        </div>
    );
}

export default function ManageBusiness() {
    const { id } = useParams();
    const [params, setParams] = useSearchParams();
    const tab = TABS.some(([t]) => t === params.get('tab')) ? params.get('tab') : 'details';
    const [version, setVersion] = useState(0);
    const [notice, setNotice] = useState(null);
    const { data, loading, error } = useApi(`/me/businesses/${id}`, { v: version || undefined });

    if (loading && !data) {
        return <PageLoading />;
    }
    if (error) {
        return <ErrorState error={error} />;
    }
    const business = data.data;

    return (
        <div className="space-y-5">
            <div>
                <Link to="/account/businesses" className="text-sm font-semibold text-navy-700">
                    ← My businesses
                </Link>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-2xl font-bold">{business.name}</h2>
                    <VerifiedBadge show={business.is_verified} />
                    {business.pending_edit && <StatusPill status="PENDING" />}
                </div>
                <Link to={`/business/${business.slug}`} className="mt-1 inline-flex items-center gap-1 text-sm text-stone-600 hover:text-navy-700">
                    View public listing <Icon name="external" size={14} />
                </Link>
            </div>
            <div className="flex gap-1 overflow-x-auto border-b border-stone-200" role="tablist">
                {TABS.map(([value, label, icon]) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={tab === value}
                        onClick={() => setParams(value === 'details' ? {} : { tab: value })}
                        className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold ${tab === value ? 'border-accent-500 text-navy-700' : 'border-transparent text-stone-600 hover:text-navy-700'}`}
                    >
                        <Icon name={icon} size={16} /> {label}
                    </button>
                ))}
            </div>
            {notice && <Message message={{ type: 'success', text: notice }} />}
            {tab === 'details' && (
                <DetailsTab
                    key={`${business.id}-${version}`}
                    business={business}
                    onSubmitted={(text) => {
                        setNotice(text);
                        setVersion((v) => v + 1);
                    }}
                />
            )}
            {tab === 'reviews' && <ReviewsTab business={business} />}
            {tab === 'stats' && <StatsTab business={business} />}
        </div>
    );
}
