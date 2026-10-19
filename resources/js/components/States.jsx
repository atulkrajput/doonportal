import { errorMessage } from '../api/client';

export function SkeletonCards({ count = 4 }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Loading">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-stone-200 bg-white">
                    <div className="aspect-[4/3] bg-stone-200" />
                    <div className="space-y-2 p-4">
                        <div className="h-4 w-3/4 rounded bg-stone-200" />
                        <div className="h-3 w-1/2 rounded bg-stone-100" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function PageLoading() {
    return (
        <div className="container-page py-16" aria-busy="true">
            <div className="h-8 w-1/3 animate-pulse rounded bg-stone-200" />
            <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-stone-100" />
            <div className="mt-10">
                <SkeletonCards />
            </div>
        </div>
    );
}

export function EmptyState({ title = 'Nothing here yet', children, action }) {
    return (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-10 text-center">
            <p className="font-semibold text-stone-800">{title}</p>
            {children && <div className="mx-auto mt-2 max-w-md text-sm text-stone-600">{children}</div>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function ErrorState({ error, onRetry }) {
    return (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
            <p className="font-semibold text-red-800">We couldn’t load this right now.</p>
            <p className="mt-1 text-sm text-red-700">{errorMessage(error)}</p>
            {onRetry && (
                <button type="button" className="btn-secondary mt-4" onClick={onRetry}>
                    Try again
                </button>
            )}
        </div>
    );
}
