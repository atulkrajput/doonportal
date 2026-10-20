import { useState } from 'react';
import { Link } from 'react-router';
import { api, errorMessage } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { formatDate } from '../../lib/format';
import { EmptyState, ErrorState, PageLoading } from '../../components/States';
import { StatusPill } from '../../components/Form';
import { ReviewForm, Stars } from '../../components/Reviews';

function ReviewItem({ review, onChanged }) {
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState(null);
    const listing = review.listing;

    const remove = async () => {
        if (!window.confirm('Delete this review? This can’t be undone.')) {
            return;
        }
        try {
            await api.delete(`/me/reviews/${review.id}`);
            onChanged();
        } catch (err) {
            setError(errorMessage(err));
        }
    };

    return (
        <li className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    {listing?.slug ? (
                        <Link to={`/${listing.type}/${listing.slug}`} className="font-semibold hover:text-navy-700">
                            {listing.name}
                        </Link>
                    ) : (
                        <p className="font-semibold text-stone-500">Listing no longer available</p>
                    )}
                    <p className="text-xs text-stone-500">Written {formatDate(review.created_at)}</p>
                </div>
                <StatusPill status={review.status} />
            </div>
            {editing ? (
                <div className="mt-4">
                    <ReviewForm
                        review={review}
                        onCancel={() => setEditing(false)}
                        onSaved={() => {
                            setEditing(false);
                            onChanged();
                        }}
                    />
                </div>
            ) : (
                <>
                    <div className="mt-3">
                        <Stars rating={review.rating} />
                    </div>
                    {review.title && <p className="mt-1 font-medium">{review.title}</p>}
                    <p className="mt-1 whitespace-pre-line text-sm text-stone-700">{review.body}</p>
                    {review.status === 'PENDING' && <p className="mt-3 text-xs text-stone-500">Our team checks every review against our community guidelines before it appears, usually within a day.</p>}
                    {review.status === 'REJECTED' && <p className="mt-3 text-xs text-red-700">This review didn’t meet our community guidelines. You can edit it and send it again.</p>}
                    {review.owner_reply && (
                        <div className="mt-3 rounded-xl bg-cream p-3 text-sm">
                            <p className="font-semibold">Reply from the owner</p>
                            <p className="mt-1 text-stone-700">{review.owner_reply}</p>
                        </div>
                    )}
                    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
                    <div className="mt-4 flex gap-2">
                        <button type="button" className="btn-secondary" onClick={() => setEditing(true)}>
                            Edit
                        </button>
                        <button type="button" className="btn-secondary hover:!border-red-600 hover:!text-red-700" onClick={remove}>
                            Delete
                        </button>
                    </div>
                </>
            )}
        </li>
    );
}

export default function Reviews() {
    const [version, setVersion] = useState(0);
    const { data, loading, error } = useApi('/me/reviews', { per_page: 50, v: version || undefined });

    if (loading && !data) {
        return <PageLoading />;
    }
    if (error) {
        return <ErrorState error={error} />;
    }
    if (!data?.data?.length) {
        return (
            <EmptyState title="You haven’t written any reviews yet" action={<Link to="/businesses" className="btn-primary">Find a business</Link>}>
                Been somewhere good (or not)? Your honest review helps others in Doon.
            </EmptyState>
        );
    }
    return (
        <ul className="space-y-4">
            {data.data.map((r) => (
                <ReviewItem key={r.id} review={r} onChanged={() => setVersion((v) => v + 1)} />
            ))}
        </ul>
    );
}
