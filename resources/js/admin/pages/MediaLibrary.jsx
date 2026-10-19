import { useState } from 'react';
import { api, errorMessage } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { ErrorState } from '../../components/States';
import { Pagination, useAdminFilters } from './ResourceList';
import { formatDateTime } from '../lib';

function UploadForm({ onUploaded }) {
    const [state, setState] = useState({ busy: false, error: null });

    const submit = async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setState({ busy: true, error: null });
        try {
            await api.post('/admin/media', form);
            e.target.reset();
            setState({ busy: false, error: null });
            onUploaded();
        } catch (err) {
            const errors = err?.response?.data?.errors;
            setState({ busy: false, error: errors ? Object.values(errors).flat()[0] : errorMessage(err) });
        }
    };

    return (
        <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
            <label className="text-sm font-medium sm:col-span-2">
                Image file (JPEG, PNG, WebP or GIF, max 5 MB)
                <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required className="mt-1 block w-full text-sm" />
            </label>
            <label className="text-sm font-medium">
                Alt text
                <input name="alt_text" className="input mt-1" maxLength={255} />
            </label>
            <label className="text-sm font-medium">
                Credit
                <input name="credit" className="input mt-1" maxLength={255} />
            </label>
            <label className="text-sm font-medium sm:col-span-2">
                Source URL
                <input name="source_url" type="url" className="input mt-1" />
            </label>
            <div className="flex items-center gap-3 sm:col-span-2">
                <button type="submit" className="btn-primary" disabled={state.busy}>
                    {state.busy ? 'Uploading…' : 'Upload'}
                </button>
                {state.error && (
                    <span className="text-sm text-red-700" role="alert">
                        {state.error}
                    </span>
                )}
            </div>
        </form>
    );
}

export default function MediaLibrary() {
    const filters = useAdminFilters();
    const [version, setVersion] = useState(0);
    const { data, error, loading } = useApi('/admin/media', { ...filters.all, v: version || undefined });

    return (
        <div>
            <h1 className="mb-4 font-display text-2xl font-bold">Media</h1>
            <UploadForm onUploaded={() => setVersion((v) => v + 1)} />
            <input className="input mt-4 w-full sm:w-64" type="search" placeholder="Search alt text or credit…" value={filters.get('q')} onChange={(e) => filters.set('q', e.target.value)} aria-label="Search media" />
            {error && (
                <div className="mt-4">
                    <ErrorState error={error} />
                </div>
            )}
            {loading && <p className="mt-4 text-sm text-stone-500">Loading…</p>}
            {!loading && data?.data?.length === 0 && <p className="mt-4 text-sm text-stone-500">No media yet.</p>}
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {data?.data?.map((m) => (
                    <li key={m.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white text-xs">
                        <div className="aspect-[4/3] bg-stone-100">{m.url && <img src={m.url} alt={m.alt_text || ''} className="h-full w-full object-cover" loading="lazy" />}</div>
                        <div className="space-y-0.5 p-2">
                            <p className="truncate font-medium">{m.alt_text || <span className="text-amber-700">No alt text</span>}</p>
                            <p className="text-stone-500">
                                {m.width}×{m.height} · {Math.round((m.size_bytes || 0) / 1024)} KB
                            </p>
                            <p className="text-stone-500">{formatDateTime(m.created_at)}</p>
                        </div>
                    </li>
                ))}
            </ul>
            <Pagination meta={data?.meta} onPage={(p) => filters.set('page', p)} />
        </div>
    );
}
