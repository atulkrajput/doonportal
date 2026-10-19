import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { api, errorMessage } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { ErrorState, PageLoading } from '../../components/States';
import { Pagination, useAdminFilters } from './ResourceList';
import { formatDateTime, humanize, isSuperAdmin } from '../lib';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'MODERATOR', 'BUSINESS_OWNER', 'CONTRIBUTOR', 'USER'];
const PRIVILEGED = ['SUPER_ADMIN', 'ADMIN'];

export function UserList() {
    const filters = useAdminFilters();
    const { data, error, loading } = useApi('/admin/users', filters.all);

    return (
        <div>
            <h1 className="mb-4 font-display text-2xl font-bold">Users</h1>
            <div className="flex flex-wrap gap-2">
                <input className="input w-full sm:w-64" type="search" placeholder="Name or email…" value={filters.get('q')} onChange={(e) => filters.set('q', e.target.value)} aria-label="Search" />
                <select className="input w-auto" value={filters.get('role')} onChange={(e) => filters.set('role', e.target.value)} aria-label="Role">
                    <option value="">Any role</option>
                    {ROLES.map((r) => (
                        <option key={r} value={r}>
                            {humanize(r)}
                        </option>
                    ))}
                </select>
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
                                <th className="px-3 py-2">Name</th>
                                <th className="px-3 py-2">Email</th>
                                <th className="px-3 py-2">Roles</th>
                                <th className="px-3 py-2">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {loading && (
                                <tr>
                                    <td colSpan={4} className="px-3 py-6 text-center text-stone-500">
                                        Loading…
                                    </td>
                                </tr>
                            )}
                            {!loading && data?.data?.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-3 py-6 text-center text-stone-500">
                                        No users match.
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                data?.data?.map((u) => (
                                    <tr key={u.id} className="hover:bg-stone-50">
                                        <td className="px-3 py-2">
                                            <Link to={`/admin/users/${u.id}`} className="font-semibold text-navy-700 hover:underline">
                                                {u.name}
                                            </Link>
                                            {u.is_self && <span className="ml-2 text-xs text-stone-500">(you)</span>}
                                        </td>
                                        <td className="px-3 py-2">{u.email}</td>
                                        <td className="px-3 py-2">{u.roles.filter((r) => r !== 'USER').map(humanize).join(', ') || '—'}</td>
                                        <td className="whitespace-nowrap px-3 py-2">{formatDateTime(u.created_at)}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}
            <Pagination meta={data?.meta} onPage={(p) => filters.set('page', p)} />
        </div>
    );
}

function RoleEditor({ target, onSaved }) {
    const { user: me } = useAuth();
    const actorIsSuper = isSuperAdmin(me);
    const [roles, setRoles] = useState(() => new Set(target.roles));
    const [state, setState] = useState({ busy: false, error: null, saved: false });
    const targetIsPrivileged = target.roles.some((r) => PRIVILEGED.includes(r));

    // Mirrors the server rules (which are authoritative): never your own roles;
    // only a super admin may touch ADMIN/SUPER_ADMIN or an administrator's account.
    const lockedReason = target.is_self
        ? 'You cannot change your own roles.'
        : targetIsPrivileged && !actorIsSuper
          ? 'Only a super admin can change an administrator’s roles.'
          : null;

    const toggle = (role) => {
        const next = new Set(roles);
        if (next.has(role)) {
            next.delete(role);
        } else {
            next.add(role);
        }
        setRoles(next);
    };

    const save = async () => {
        setState({ busy: true, error: null, saved: false });
        try {
            const { data } = await api.put(`/admin/users/${target.id}/roles`, { roles: [...roles] });
            setRoles(new Set(data.data.roles));
            onSaved(data.data);
            setState({ busy: false, error: null, saved: true });
        } catch (e) {
            setState({ busy: false, error: errorMessage(e), saved: false });
        }
    };

    return (
        <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <h2 className="font-semibold">Roles</h2>
            {lockedReason && <p className="mt-2 rounded-lg bg-stone-100 p-2 text-sm text-stone-700">{lockedReason}</p>}
            <fieldset className="mt-3 space-y-2" disabled={Boolean(lockedReason) || state.busy}>
                <legend className="sr-only">Roles</legend>
                {ROLES.map((role) => {
                    const disabled = role === 'USER' || (PRIVILEGED.includes(role) && !actorIsSuper);
                    return (
                        <label key={role} className={`flex items-center gap-2 text-sm ${disabled ? 'text-stone-400' : ''}`}>
                            <input type="checkbox" checked={roles.has(role)} onChange={() => toggle(role)} disabled={disabled} />
                            {humanize(role)}
                            {role === 'USER' && <span className="text-xs">(always)</span>}
                            {PRIVILEGED.includes(role) && !actorIsSuper && <span className="text-xs">(super admin only)</span>}
                        </label>
                    );
                })}
            </fieldset>
            <div className="mt-4 flex items-center gap-3">
                <button type="button" className="btn-primary" onClick={save} disabled={Boolean(lockedReason) || state.busy}>
                    {state.busy ? 'Saving…' : 'Save roles'}
                </button>
                {state.saved && <span className="text-sm text-navy-700">Saved.</span>}
                {state.error && (
                    <span className="text-sm text-red-700" role="alert">
                        {state.error}
                    </span>
                )}
            </div>
        </section>
    );
}

export function UserDetail() {
    const { id } = useParams();
    const { data, error, loading } = useApi(`/admin/users/${id}`);
    const [override, setOverride] = useState(null);
    const target = override?.id === id ? override : data?.data;

    if (error) {
        return <ErrorState error={error} />;
    }
    if (loading || !target) {
        return <PageLoading />;
    }

    return (
        <div>
            <nav className="text-sm text-stone-500">
                <Link to="/admin/users" className="hover:underline">
                    Users
                </Link>{' '}
                / {target.name}
            </nav>
            <h1 className="mb-4 mt-1 font-display text-2xl font-bold">{target.name}</h1>
            <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-stone-200 bg-white p-4 text-sm">
                    <dl className="grid grid-cols-[8rem_1fr] gap-y-2">
                        <dt className="text-stone-500">Email</dt>
                        <dd>
                            {target.email} {target.email_verified ? '' : <span className="text-xs text-stone-500">(unverified)</span>}
                        </dd>
                        <dt className="text-stone-500">Phone</dt>
                        <dd>{target.phone || '—'}</dd>
                        <dt className="text-stone-500">Joined</dt>
                        <dd>{formatDateTime(target.created_at)}</dd>
                        <dt className="text-stone-500">Permissions</dt>
                        <dd>{target.permissions.length ? target.permissions.join(', ') : 'None'}</dd>
                    </dl>
                </section>
                <RoleEditor key={target.id} target={target} onSaved={setOverride} />
            </div>
        </div>
    );
}
