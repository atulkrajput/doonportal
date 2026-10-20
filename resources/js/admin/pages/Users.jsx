import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api, errorMessage, fieldErrors } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useStaff } from '../StaffContext';
import { ErrorState, PageLoading } from '../../components/States';
import { Pagination, useAdminFilters } from './ResourceList';
import { formatDateTime, humanize, isSuperAdmin } from '../lib';

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'MODERATOR'];
const MEMBER_ROLES = ['USER', 'BUSINESS_OWNER', 'CONTRIBUTOR'];
const PRIVILEGED = ['SUPER_ADMIN', 'ADMIN'];
const ROLE_HELP = {
    SUPER_ADMIN: 'Everything, including managing administrators.',
    ADMIN: 'Everything except managing administrators.',
    EDITOR: 'Directory, events, stories, collections, SEO and analytics.',
    MODERATOR: 'Ownership claims, submissions, reviews and reports.',
};

function Table({ columns, rows, empty, loading }) {
    return (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                        {columns.map((c) => (
                            <th key={c} className="px-3 py-2">
                                {c}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                    {loading && (
                        <tr>
                            <td colSpan={columns.length} className="px-3 py-6 text-center text-stone-500">
                                Loading…
                            </td>
                        </tr>
                    )}
                    {!loading && rows.length === 0 && (
                        <tr>
                            <td colSpan={columns.length} className="px-3 py-6 text-center text-stone-500">
                                {empty}
                            </td>
                        </tr>
                    )}
                    {!loading && rows}
                </tbody>
            </table>
        </div>
    );
}

function NewStaffForm({ onCreated, onCancel }) {
    const { user: me } = useStaff();
    const [roles, setRoles] = useState(['EDITOR']);
    const [errors, setErrors] = useState({});
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors({});
        setError(null);
        try {
            const values = Object.fromEntries(new FormData(e.currentTarget).entries());
            const { data } = await api.post('/admin/staff', { ...values, roles });
            onCreated(data.data);
        } catch (err) {
            setErrors(fieldErrors(err));
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };
    const input = (name, label, type = 'text', props = {}) => (
        <label className="block">
            <span className="text-sm font-medium text-stone-700">{label}</span>
            <input name={name} type={type} className="input mt-1" required {...props} />
            {errors[name] && <span className="mt-1 block text-sm text-red-700">{errors[name][0]}</span>}
        </label>
    );

    return (
        <form onSubmit={submit} className="mt-4 space-y-4 rounded-2xl border border-stone-200 bg-white p-4" noValidate>
            <h2 className="font-semibold">Add a staff member</h2>
            {error && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-800">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
                {input('name', 'Name', 'text', { autoComplete: 'off' })}
                {input('email', 'Work email', 'email', { autoComplete: 'off' })}
                {input('password', 'Temporary password', 'password', { autoComplete: 'new-password', minLength: 8 })}
                {input('password_confirmation', 'Repeat password', 'password', { autoComplete: 'new-password' })}
            </div>
            <fieldset>
                <legend className="text-sm font-medium text-stone-700">Roles</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {STAFF_ROLES.map((role) => {
                        const disabled = PRIVILEGED.includes(role) && !isSuperAdmin(me);
                        return (
                            <label key={role} className={`flex items-start gap-2 rounded-lg border border-stone-200 p-2 text-sm ${disabled ? 'opacity-50' : ''}`}>
                                <input
                                    type="checkbox"
                                    className="mt-0.5"
                                    disabled={disabled}
                                    checked={roles.includes(role)}
                                    onChange={() => setRoles((r) => (r.includes(role) ? r.filter((x) => x !== role) : [...r, role]))}
                                />
                                <span>
                                    <span className="font-semibold">{humanize(role)}</span>
                                    <span className="block text-xs text-stone-500">{ROLE_HELP[role]}</span>
                                </span>
                            </label>
                        );
                    })}
                </div>
                {errors.roles && <span className="mt-1 block text-sm text-red-700">{errors.roles[0]}</span>}
            </fieldset>
            <p className="text-xs text-stone-500">Share the temporary password privately (not by email); they can change it from My account after signing in at /admin/login.</p>
            <div className="flex gap-2">
                <button type="submit" className="btn-primary" disabled={busy || !roles.length}>
                    {busy ? 'Creating…' : 'Create staff account'}
                </button>
                <button type="button" className="btn-secondary" onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </form>
    );
}

export function StaffList() {
    const filters = useAdminFilters();
    const navigate = useNavigate();
    const [adding, setAdding] = useState(false);
    const { data, error, loading } = useApi('/admin/staff', filters.all);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-display text-2xl font-bold">Staff</h1>
                    <p className="text-sm text-stone-600">DoonPortal team accounts. They sign in at /admin/login, separately from member accounts.</p>
                </div>
                {!adding && (
                    <button type="button" className="btn-primary" onClick={() => setAdding(true)}>
                        + Add staff
                    </button>
                )}
            </div>
            {adding && <NewStaffForm onCancel={() => setAdding(false)} onCreated={(s) => navigate(`/admin/staff/${s.id}`)} />}
            <div className="mt-4 flex flex-wrap gap-2">
                <input className="input w-full sm:w-64" type="search" placeholder="Name or email…" value={filters.get('q')} onChange={(e) => filters.set('q', e.target.value)} aria-label="Search" />
                <select className="input w-auto" value={filters.get('role')} onChange={(e) => filters.set('role', e.target.value)} aria-label="Role">
                    <option value="">Any role</option>
                    {STAFF_ROLES.map((r) => (
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
                <Table
                    columns={['Name', 'Email', 'Roles', 'Status', 'Last sign-in']}
                    loading={loading}
                    empty="No staff match."
                    rows={(data?.data || []).map((s) => (
                        <tr key={s.id} className="hover:bg-stone-50">
                            <td className="px-3 py-2">
                                <Link to={`/admin/staff/${s.id}`} className="font-semibold text-navy-700 hover:underline">
                                    {s.name}
                                </Link>
                                {s.is_self && <span className="ml-2 text-xs text-stone-500">(you)</span>}
                            </td>
                            <td className="px-3 py-2">{s.email}</td>
                            <td className="px-3 py-2">{s.roles.map(humanize).join(', ')}</td>
                            <td className="px-3 py-2">{s.is_active ? 'Active' : <span className="font-semibold text-red-700">Deactivated</span>}</td>
                            <td className="whitespace-nowrap px-3 py-2">{s.last_login_at ? formatDateTime(s.last_login_at) : 'Never'}</td>
                        </tr>
                    ))}
                />
            )}
            <Pagination meta={data?.meta} onPage={(p) => filters.set('page', p)} />
        </div>
    );
}

function RoleEditor({ target, onSaved }) {
    const { user: me } = useStaff();
    const actorIsSuper = isSuperAdmin(me);
    const [roles, setRoles] = useState(() => new Set(target.roles));
    const [state, setState] = useState({ busy: false, error: null, saved: false });
    const targetIsPrivileged = target.roles.some((r) => PRIVILEGED.includes(r));

    // Mirrors the server rules (which are authoritative).
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
            const { data } = await api.put(`/admin/staff/${target.id}/roles`, { roles: [...roles] });
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
                {STAFF_ROLES.map((role) => {
                    const disabled = PRIVILEGED.includes(role) && !actorIsSuper;
                    return (
                        <label key={role} className={`flex items-start gap-2 text-sm ${disabled ? 'text-stone-400' : ''}`}>
                            <input type="checkbox" className="mt-0.5" checked={roles.has(role)} onChange={() => toggle(role)} disabled={disabled} />
                            <span>
                                {humanize(role)}
                                {disabled && <span className="text-xs"> (super admin only)</span>}
                                <span className="block text-xs text-stone-500">{ROLE_HELP[role]}</span>
                            </span>
                        </label>
                    );
                })}
            </fieldset>
            <div className="mt-4 flex items-center gap-3">
                <button type="button" className="btn-primary" onClick={save} disabled={Boolean(lockedReason) || state.busy || roles.size === 0}>
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

function AccessPanel({ target, onSaved }) {
    const [state, setState] = useState({ busy: false, error: null, message: null });
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    if (target.is_self) {
        return (
            <section className="rounded-2xl border border-stone-200 bg-white p-4 text-sm">
                <h2 className="font-semibold">Access</h2>
                <p className="mt-2 text-stone-600">
                    Change your own password from{' '}
                    <Link to="/admin/account" className="text-navy-700 underline">
                        My account
                    </Link>
                    .
                </p>
            </section>
        );
    }

    const run = async (request, message) => {
        setState({ busy: true, error: null, message: null });
        try {
            const { data } = await request();
            onSaved(data.data);
            setPassword('');
            setConfirm('');
            setState({ busy: false, error: null, message });
        } catch (e) {
            setState({ busy: false, error: fieldErrors(e).password?.[0] || errorMessage(e), message: null });
        }
    };

    return (
        <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm">
            <h2 className="font-semibold">Access</h2>
            {state.message && <p role="status" className="rounded-lg bg-emerald-50 p-2 text-emerald-800">{state.message}</p>}
            {state.error && <p role="alert" className="rounded-lg bg-red-50 p-2 text-red-800">{state.error}</p>}
            <div className="space-y-2">
                <p className="font-medium">Set a new password</p>
                <p className="text-xs text-stone-500">For a forgotten password. Signs them out everywhere.</p>
                <div className="flex flex-wrap gap-2">
                    <input className="input w-48" type="password" placeholder="New password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="New password" />
                    <input className="input w-48" type="password" placeholder="Repeat" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="Repeat new password" />
                    <button
                        type="button"
                        className="btn-secondary"
                        disabled={state.busy || !password}
                        onClick={() => run(() => api.put(`/admin/staff/${target.id}/password`, { password, password_confirmation: confirm }), 'Password set. Share it with them privately.')}
                    >
                        Set password
                    </button>
                </div>
            </div>
            <div className="border-t border-stone-100 pt-4">
                {target.is_active ? (
                    <button
                        type="button"
                        className="btn-secondary hover:!border-red-600 hover:!text-red-700"
                        disabled={state.busy}
                        onClick={() => window.confirm(`Deactivate ${target.name}? They will be signed out and unable to sign in.`) && run(() => api.put(`/admin/staff/${target.id}/active`, { is_active: false }), 'Account deactivated.')}
                    >
                        Deactivate account
                    </button>
                ) : (
                    <button type="button" className="btn-primary" disabled={state.busy} onClick={() => run(() => api.put(`/admin/staff/${target.id}/active`, { is_active: true }), 'Account reactivated.')}>
                        Reactivate account
                    </button>
                )}
            </div>
        </section>
    );
}

export function StaffDetail() {
    const { id } = useParams();
    const { data, error, loading } = useApi(`/admin/staff/${id}`);
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
                <Link to="/admin/staff" className="hover:underline">
                    Staff
                </Link>{' '}
                / {target.name}
            </nav>
            <h1 className="mb-4 mt-1 flex flex-wrap items-center gap-2 font-display text-2xl font-bold">
                {target.name}
                {!target.is_active && <span className="rounded-full bg-red-100 px-2 py-0.5 font-sans text-xs font-semibold text-red-800">Deactivated</span>}
            </h1>
            <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-stone-200 bg-white p-4 text-sm">
                    <dl className="grid grid-cols-[8rem_1fr] gap-y-2">
                        <dt className="text-stone-500">Email</dt>
                        <dd>{target.email}</dd>
                        <dt className="text-stone-500">Phone</dt>
                        <dd>{target.phone || '—'}</dd>
                        <dt className="text-stone-500">Last sign-in</dt>
                        <dd>{target.last_login_at ? formatDateTime(target.last_login_at) : 'Never'}</dd>
                        <dt className="text-stone-500">Added</dt>
                        <dd>{formatDateTime(target.created_at)}</dd>
                        <dt className="text-stone-500">Permissions</dt>
                        <dd>{target.permissions.length ? target.permissions.join(', ') : 'None'}</dd>
                    </dl>
                </section>
                <RoleEditor key={target.id} target={target} onSaved={setOverride} />
                <AccessPanel target={target} onSaved={setOverride} />
            </div>
        </div>
    );
}

export function MemberList() {
    const filters = useAdminFilters();
    const { data, error, loading } = useApi('/admin/members', filters.all);

    return (
        <div>
            <h1 className="font-display text-2xl font-bold">Members</h1>
            <p className="text-sm text-stone-600">People with a DoonPortal account. Business ownership comes from approved claims and listings.</p>
            <div className="mt-4 flex flex-wrap gap-2">
                <input className="input w-full sm:w-64" type="search" placeholder="Name, email or phone…" value={filters.get('q')} onChange={(e) => filters.set('q', e.target.value)} aria-label="Search" />
                <select className="input w-auto" value={filters.get('role')} onChange={(e) => filters.set('role', e.target.value)} aria-label="Role">
                    <option value="">Any role</option>
                    {MEMBER_ROLES.map((r) => (
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
                <Table
                    columns={['Name', 'Email', 'Phone', 'Businesses', 'Reviews', 'Joined']}
                    loading={loading}
                    empty="No members match."
                    rows={(data?.data || []).map((u) => (
                        <tr key={u.id} className="hover:bg-stone-50">
                            <td className="px-3 py-2">
                                <Link to={`/admin/members/${u.id}`} className="font-semibold text-navy-700 hover:underline">
                                    {u.name}
                                </Link>
                                {u.roles.includes('BUSINESS_OWNER') && <span className="ml-2 rounded-full bg-accent-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">Owner</span>}
                            </td>
                            <td className="px-3 py-2">{u.email}</td>
                            <td className="px-3 py-2">{u.phone || '—'}</td>
                            <td className="px-3 py-2 tabular-nums">{u.owned_businesses ?? 0}</td>
                            <td className="px-3 py-2 tabular-nums">{u.reviews ?? 0}</td>
                            <td className="whitespace-nowrap px-3 py-2">{formatDateTime(u.created_at)}</td>
                        </tr>
                    ))}
                />
            )}
            <Pagination meta={data?.meta} onPage={(p) => filters.set('page', p)} />
        </div>
    );
}

export function MemberDetail() {
    const { id } = useParams();
    const { data, error, loading } = useApi(`/admin/members/${id}`);

    if (error) {
        return <ErrorState error={error} />;
    }
    if (loading || !data) {
        return <PageLoading />;
    }
    const m = data.data;

    return (
        <div>
            <nav className="text-sm text-stone-500">
                <Link to="/admin/members" className="hover:underline">
                    Members
                </Link>{' '}
                / {m.name}
            </nav>
            <h1 className="mb-4 mt-1 font-display text-2xl font-bold">{m.name}</h1>
            <section className="max-w-xl rounded-2xl border border-stone-200 bg-white p-4 text-sm">
                <dl className="grid grid-cols-[9rem_1fr] gap-y-2">
                    <dt className="text-stone-500">Email</dt>
                    <dd>
                        {m.email} {!m.email_verified && <span className="text-xs text-stone-500">(unverified)</span>}
                    </dd>
                    <dt className="text-stone-500">Phone</dt>
                    <dd>{m.phone || '—'}</dd>
                    <dt className="text-stone-500">City</dt>
                    <dd>{m.city || '—'}</dd>
                    <dt className="text-stone-500">Sign-in</dt>
                    <dd>{m.google_linked ? 'Email and Google' : 'Email'}</dd>
                    <dt className="text-stone-500">Roles</dt>
                    <dd>{m.roles.map(humanize).join(', ')}</dd>
                    <dt className="text-stone-500">Businesses owned</dt>
                    <dd>{m.owned_businesses ?? 0}</dd>
                    <dt className="text-stone-500">Reviews</dt>
                    <dd>{m.reviews ?? 0}</dd>
                    <dt className="text-stone-500">Joined</dt>
                    <dd>{formatDateTime(m.created_at)}</dd>
                </dl>
            </section>
        </div>
    );
}
