import { Icon } from './Icons';

export function DemoBadge({ show }) {
    if (!show) {
        return null;
    }
    return (
        <span
            className="inline-flex items-center rounded-full bg-saffron-100 px-2 py-0.5 text-xs font-semibold text-amber-900"
            title="Fictional sample content for development. Not a real listing."
        >
            Demo data
        </span>
    );
}

export function VerifiedBadge({ show }) {
    if (!show) {
        return null;
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-forest-100 px-2 py-0.5 text-xs font-semibold text-forest-700" title="Details confirmed by the DoonPortal team">
            <Icon name="check" size={14} /> Verified
        </span>
    );
}

export function OpenBadge({ open }) {
    if (open == null) {
        return null;
    }
    return open ? (
        <span className="text-xs font-semibold text-forest-600">Open now</span>
    ) : (
        <span className="text-xs font-semibold text-stone-500">Closed now</span>
    );
}

export function Rating({ rating }) {
    if (!rating || !rating.count) {
        return <span className="text-xs text-stone-500">No reviews yet</span>;
    }
    return (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-stone-800">
            <Icon name="star" size={15} className="fill-saffron-400 text-saffron-500" />
            {rating.average.toFixed(1)}
            <span className="font-normal text-stone-500">({rating.count})</span>
        </span>
    );
}
