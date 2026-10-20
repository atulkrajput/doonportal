import { useState } from 'react';
import { api, errorMessage, fieldErrors } from '../../api/client';
import { useStaff } from '../StaffContext';
import { humanize } from '../lib';

const EMPTY = { current_password: '', password: '', password_confirmation: '' };

function PasswordInput({ id, label, value, onChange, error, autoComplete, help }) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-stone-800">
                {label}
            </label>
            <input id={id} type="password" className="input" value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} required />
            {help && <p className="mt-1 text-xs text-stone-500">{help}</p>}
            {error && (
                <p className="mt-1 text-xs text-red-700" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

function ChangePasswordForm() {
    const [values, setValues] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [state, setState] = useState({ busy: false, message: null, tone: 'ok' });
    const set = (key) => (v) => setValues((prev) => ({ ...prev, [key]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setErrors({});
        if (values.password !== values.password_confirmation) {
            setErrors({ password_confirmation: ['The new passwords do not match.'] });
            return;
        }
        setState({ busy: true, message: null, tone: 'ok' });
        try {
            const { data } = await api.put('/admin/auth/password', values);
            setValues(EMPTY);
            setState({ busy: false, message: data.message, tone: 'ok' });
        } catch (err) {
            setErrors(fieldErrors(err));
            setState({ busy: false, message: errorMessage(err), tone: 'error' });
        }
    };

    return (
        <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
            <div>
                <h2 className="font-semibold">Change password</h2>
                <p className="mt-1 text-sm text-stone-600">After the change, every other device signed in to this account is signed out. This browser stays signed in.</p>
            </div>
            <PasswordInput id="current_password" label="Current password" value={values.current_password} onChange={set('current_password')} error={errors.current_password?.[0]} autoComplete="current-password" />
            <PasswordInput
                id="password"
                label="New password"
                value={values.password}
                onChange={set('password')}
                error={errors.password?.[0]}
                autoComplete="new-password"
                help="At least 8 characters, different from your current password."
            />
            <PasswordInput
                id="password_confirmation"
                label="Confirm new password"
                value={values.password_confirmation}
                onChange={set('password_confirmation')}
                error={errors.password_confirmation?.[0]}
                autoComplete="new-password"
            />
            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" className="btn-primary" disabled={state.busy || !values.current_password || !values.password}>
                    {state.busy ? 'Saving…' : 'Change password'}
                </button>
                {state.message && (
                    <span role={state.tone === 'error' ? 'alert' : 'status'} className={`text-sm ${state.tone === 'error' ? 'text-red-700' : 'text-navy-700'}`}>
                        {state.message}
                    </span>
                )}
            </div>
        </form>
    );
}

export default function Account() {
    const { user } = useStaff();

    return (
        <div className="max-w-2xl">
            <h1 className="mb-4 font-display text-2xl font-bold">My account</h1>
            <section className="mb-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm">
                <dl className="grid grid-cols-[7rem_1fr] gap-y-2">
                    <dt className="text-stone-500">Name</dt>
                    <dd>{user.name}</dd>
                    <dt className="text-stone-500">Email</dt>
                    <dd>{user.email}</dd>
                    <dt className="text-stone-500">Roles</dt>
                    <dd>{user.roles.map(humanize).join(', ')}</dd>
                </dl>
            </section>
            <ChangePasswordForm />
        </div>
    );
}
