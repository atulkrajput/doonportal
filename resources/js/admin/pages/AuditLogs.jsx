import { Fragment, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { ErrorState } from '../../components/States';
import { Pagination, useAdminFilters } from './ResourceList';
import { formatDateTime, humanize } from '../lib';

const TYPES = ['business', 'place', 'event', 'venue', 'organizer', 'story', 'collection', 'area', 'category', 'user', 'media', 'review'];

function Values({ values }) {
    if (!values || !Object.keys(values).length) {
        return <span className="text-stone-400">—</span>;
    }
    return <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-stone-50 p-2 text-xs">{JSON.stringify(values, null, 2)}</pre>;
}

export default function AuditLogs() {
    const filters = useAdminFilters();
    const { data, error, loading } = useApi('/admin/audit-logs', filters.all);
    const [open, setOpen] = useState(null);

    return (
        <div>
            <h1 className="mb-1 font-display text-2xl font-bold">Audit log</h1>
            <p className="mb-4 text-sm text-stone-600">Every admin change, newest first. Read-only. Dates are in IST.</p>
            <div className="flex flex-wrap gap-2">
                <input
                    className="input w-full sm:w-56"
                    placeholder="Action, e.g. business. or event.rescheduled"
                    value={filters.get('action')}
                    onChange={(e) => filters.set('action', e.target.value.trim().toLowerCase())}
                    aria-label="Action"
                />
                <select className="input w-auto" value={filters.get('auditable_type')} onChange={(e) => filters.set('auditable_type', e.target.value)} aria-label="Record type">
                    <option value="">Any record type</option>
                    {TYPES.map((t) => (
                        <option key={t} value={t}>
                            {humanize(t)}
                        </option>
                    ))}
                </select>
                <label className="flex items-center gap-1 text-sm">
                    From <input type="date" className="input w-auto" value={filters.get('from')} onChange={(e) => filters.set('from', e.target.value)} />
                </label>
                <label className="flex items-center gap-1 text-sm">
                    To <input type="date" className="input w-auto" value={filters.get('to')} onChange={(e) => filters.set('to', e.target.value)} />
                </label>
                {filters.get('auditable_id') && (
                    <button type="button" className="chip" onClick={() => filters.set('auditable_id', '')}>
                        Record {filters.get('auditable_id').slice(-6)} ✕
                    </button>
                )}
            </div>
            {error ? (
                <div className="mt-4">
                    <ErrorState error={error} />
                </div>
            ) : (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                            <tr>
                                <th className="px-3 py-2">When</th>
                                <th className="px-3 py-2">Who</th>
                                <th className="px-3 py-2">Action</th>
                                <th className="px-3 py-2">Record</th>
                                <th className="px-3 py-2">
                                    <span className="sr-only">Details</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {loading && (
                                <tr>
                                    <td colSpan={5} className="px-3 py-6 text-center text-stone-500">
                                        Loading…
                                    </td>
                                </tr>
                            )}
                            {!loading && data?.data?.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-3 py-6 text-center text-stone-500">
                                        No entries match.
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                data?.data?.map((log) => (
                                    <Fragment key={log.id}>
                                        <tr className="align-top">
                                            <td className="whitespace-nowrap px-3 py-2">{formatDateTime(log.created_at)}</td>
                                            <td className="px-3 py-2">{log.actor ? log.actor.name : <span className="text-stone-500">System</span>}</td>
                                            <td className="px-3 py-2 font-mono text-xs">{log.action}</td>
                                            <td className="px-3 py-2 text-xs">
                                                {log.auditable_type ? (
                                                    <button type="button" className="text-navy-700 hover:underline" onClick={() => filters.set('auditable_id', log.auditable_id)}>
                                                        {log.auditable_type} …{log.auditable_id?.slice(-6)}
                                                    </button>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <button type="button" className="text-xs font-semibold text-navy-700 hover:underline" onClick={() => setOpen(open === log.id ? null : log.id)} aria-expanded={open === log.id}>
                                                    {open === log.id ? 'Hide' : 'Changes'}
                                                </button>
                                            </td>
                                        </tr>
                                        {open === log.id && (
                                            <tr>
                                                <td colSpan={5} className="bg-stone-50/50 px-3 py-3">
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <div>
                                                            <p className="mb-1 text-xs font-semibold uppercase text-stone-500">Before</p>
                                                            <Values values={log.old_values} />
                                                        </div>
                                                        <div>
                                                            <p className="mb-1 text-xs font-semibold uppercase text-stone-500">After</p>
                                                            <Values values={log.new_values} />
                                                        </div>
                                                    </div>
                                                    <p className="mt-2 text-xs text-stone-500">
                                                        IP {log.ip_address || '—'} · {log.actor?.email || ''}
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}
            <Pagination meta={data?.meta} onPage={(p) => filters.set('page', p)} />
        </div>
    );
}
