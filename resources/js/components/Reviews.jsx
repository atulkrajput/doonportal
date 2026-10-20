import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { track } from '../lib/analytics';
import { formatDate } from '../lib/format';
import { Field, Message, StatusPill, useForm } from './Form';
import { EmptyState } from './States';

export function Stars({ rating, size = 'text-base' }) {
    return (
        <span className={`${size} tracking-tight text-accent-500`} role="img" aria-label={`${rating} out of 5 stars`}>
            {'★'.repeat(rating)}
            <span className="text-stone-300">{'★'.repeat(5 - rating)}</span>
        </span>
    );
}

const RATING_LABELS = ['', 'Poor', 'Below average', 'Good', 'Very good', 'Excellent'];

/** Accessible 1–5 star picker (radio group), submitted as `rating`. */
function StarInput({ defaultValue = 0, error }) {
    const [value, setValue] = useState(defaultValue);
    const [hover, setHover] = useState(0);
    const shown = hover || value;
    return (
        <fieldset>
            <legend className="text-sm font-medium text-stone-700">Your rating</legend>
            <div className="mt-1 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                    <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
                        <input type="radio" name="rating" value={n} checked={value === n} onChange={() => setValue(n)} className="peer sr-only" />
                        <span className={`block text-3xl leading-none transition-colors peer-focus-visible:rounded peer-focus-visible:outline-2 peer-focus-visible:outline-navy-500 ${n <= shown ? 'text-accent-500' : 'text-stone-300'}`} aria-hidden="true">
                            ★
                        </span>
                        <span className="sr-only">
                            {n} star{n > 1 ? 's' : ''}: {RATING_LABELS[n]}
                        </span>
                    </label>
                ))}
                <span className="ml-2 text-sm text-stone-600">{RATING_LABELS[shown]}</span>
            </div>
            {error && <span className="mt-1 block text-sm text-red-700">{error}</span>}
        </fieldset>
    );
}

/** Write (slug) or edit (review) a review. */
export function ReviewForm({ slug, review, onSaved, onCancel }) {
    const form = useForm(async (values) => {
        const payload = { ...values, rating: Number(values.rating) || undefined, visited_on: values.visited_on || null };
        const { data } = review ? await api.patch(`/me/reviews/${review.id}`, payload) : await api.post(`/businesses/${slug}/reviews`, payload);
        if (!review) {
            track('review_submitted', { type: 'business', id: data.data.listing?.id });
        }
        onSaved?.(data.data);
    });
    const today = new Date().toISOString().slice(0, 10);

    return (
        <form onSubmit={form.onSubmit} noValidate className="space-y-4">
            <Message message={form.message} />
            <StarInput defaultValue={review?.rating ?? 0} error={form.errors.rating?.[0]} />
            <Field label="Headline" name="title" defaultValue={review?.title ?? ''} maxLength={120} optional errors={form.errors} placeholder="Sum it up in a few words" />
            <Field
                label="Your review"
                name="body"
                type="textarea"
                defaultValue={review?.body ?? ''}
                maxLength={3000}
                required
                errors={form.errors}
                help="What did you like or not? Be specific and kind. No personal details or offensive language."
            />
            <Field label="When did you visit?" name="visited_on" type="date" max={today} defaultValue={review?.visited_on ?? ''} optional errors={form.errors} />
            <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn-primary" disabled={form.busy}>
                    {form.busy ? 'Sending…' : review ? 'Save changes' : 'Submit review'}
                </button>
                {onCancel && (
                    <button type="button" className="btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                )}
            </div>
            <p className="text-xs text-stone-500">
                Reviews are checked against our{' '}
                <Link to="/community-guidelines" className="underline">
                    community guidelines
                </Link>{' '}
                before they appear{review ? '; editing sends yours for a fresh check' : ''}.
            </p>
        </form>
    );
}

function ReviewList({ slug }) {
    const { data, loading } = useApi(`/businesses/${slug}/reviews`, { per_page: 10 });
    if (loading) {
        return null;
    }
    if (!data?.data?.length) {
        return <EmptyState title="No reviews yet">Be the first to share your experience.</EmptyState>;
    }
    return (
        <ul className="space-y-4">
            {data.data.map((r) => (
                <li key={r.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">{r.author?.name ?? 'Member'}</p>
                        <Stars rating={r.rating} size="text-sm" />
                    </div>
                    {r.title && <p className="mt-1 font-medium">{r.title}</p>}
                    {r.body && <p className="mt-1 whitespace-pre-line text-sm text-stone-700">{r.body}</p>}
                    <p className="mt-2 text-xs text-stone-500">
                        {formatDate(r.created_at)}
                        {r.visited_on && <> · Visited {formatDate(r.visited_on)}</>}
                    </p>
                    {r.owner_reply && (
                        <div className="mt-3 border-l-4 border-navy-200 bg-navy-50/60 py-2 pl-3 pr-2 text-sm">
                            <p className="font-semibold text-navy-700">Response from the owner</p>
                            <p className="mt-1 whitespace-pre-line text-stone-700">{r.owner_reply.body}</p>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
}

/** Reviews section of a business page: the member's own review or a form, then published reviews. */
export function BusinessReviews({ business, isOwner }) {
    const { user } = useAuth();
    const location = useLocation();
    const [writing, setWriting] = useState(false);
    const [version, setVersion] = useState(0);
    const mine = useApi(user && !isOwner ? `/businesses/${business.slug}/my-review` : null, { v: version || undefined });
    const myReview = mine.data?.data;

    let header;
    if (isOwner) {
        header = (
            <p className="text-sm text-stone-600">
                You manage this business.{' '}
                <Link to={`/account/businesses/${business.id}?tab=reviews`} className="font-semibold text-navy-700 underline">
                    Reply to reviews
                </Link>
            </p>
        );
    } else if (!user) {
        header = (
            <Link to={`/login?next=${encodeURIComponent(location.pathname)}`} className="btn-secondary">
                Sign in to write a review
            </Link>
        );
    } else if (myReview) {
        header = (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-cream p-3 text-sm">
                <span>You reviewed this business.</span>
                <StatusPill status={myReview.status} />
                <Link to="/account/reviews" className="font-semibold text-navy-700 underline">
                    Edit in your account
                </Link>
            </div>
        );
    } else if (writing) {
        header = (
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <ReviewForm
                    slug={business.slug}
                    onCancel={() => setWriting(false)}
                    onSaved={() => {
                        setWriting(false);
                        setVersion((v) => v + 1);
                    }}
                />
            </div>
        );
    } else if (!mine.loading) {
        header = (
            <button type="button" className="btn-primary" onClick={() => setWriting(true)}>
                Write a review
            </button>
        );
    }

    return (
        <div className="space-y-4">
            {header}
            {version > 0 && !writing && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Thanks! Your review will appear once our team has checked it.</p>}
            <ReviewList slug={business.slug} />
        </div>
    );
}
