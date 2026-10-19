import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { api, errorMessage, fieldErrors } from '../api/client';
import { useAuth } from '../context/AuthContext';

function Field({ label, name, type = 'text', errors, ...props }) {
    const error = errors?.[name]?.[0];
    return (
        <label className="block">
            <span className="text-sm font-medium text-stone-700">{label}</span>
            <input name={name} type={type} className="input mt-1" aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} {...props} />
            {error && (
                <span id={`${name}-error`} className="mt-1 block text-sm text-red-700">
                    {error}
                </span>
            )}
        </label>
    );
}

function AuthCard({ title, children, footer }) {
    return (
        <div className="container-page flex justify-center py-12">
            <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
                <h1 className="font-display text-2xl font-bold">{title}</h1>
                <div className="mt-6">{children}</div>
                {footer && <div className="mt-6 text-center text-sm text-stone-600">{footer}</div>}
            </div>
        </div>
    );
}

function useForm(submit) {
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [busy, setBusy] = useState(false);
    const onSubmit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors({});
        setMessage(null);
        try {
            await submit(Object.fromEntries(new FormData(e.currentTarget).entries()));
        } catch (err) {
            setErrors(fieldErrors(err));
            setMessage({ type: 'error', text: errorMessage(err) });
        } finally {
            setBusy(false);
        }
    };
    return { errors, message, setMessage, busy, onSubmit };
}

function Message({ message }) {
    if (!message) {
        return null;
    }
    return (
        <p role={message.type === 'error' ? 'alert' : 'status'} className={`rounded-xl p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-navy-50 text-navy-700'}`}>
            {message.text}
        </p>
    );
}

export function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    // Only same-site paths: "//host" or "/\host" would be an open redirect.
    const next = searchParams.get('next') || '';
    const target = /^\/(?![/\\])/.test(next) ? next : '/saved';
    const form = useForm(async (values) => {
        await login(values);
        navigate(target);
    });

    return (
        <AuthCard title="Sign in" footer={<>New here? <Link to="/register" className="font-semibold text-navy-700">Create an account</Link></>}>
            <form onSubmit={form.onSubmit} className="space-y-4" noValidate>
                <Message message={form.message} />
                <Field label="Email" name="email" type="email" autoComplete="email" required errors={form.errors} />
                <Field label="Password" name="password" type="password" autoComplete="current-password" required errors={form.errors} />
                <button type="submit" className="btn-primary w-full" disabled={form.busy}>
                    {form.busy ? 'Signing in…' : 'Sign in'}
                </button>
                <Link to="/forgot-password" className="block text-center text-sm text-stone-600 hover:text-navy-700">
                    Forgot your password?
                </Link>
            </form>
        </AuthCard>
    );
}

export function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const form = useForm(async (values) => {
        await register(values);
        navigate('/saved');
    });

    return (
        <AuthCard title="Join DoonPortal" footer={<>Already a member? <Link to="/login" className="font-semibold text-navy-700">Sign in</Link></>}>
            <form onSubmit={form.onSubmit} className="space-y-4" noValidate>
                <Message message={form.message} />
                <Field label="Name" name="name" autoComplete="name" required errors={form.errors} />
                <Field label="Email" name="email" type="email" autoComplete="email" required errors={form.errors} />
                <Field label="Password" name="password" type="password" autoComplete="new-password" required errors={form.errors} />
                <Field label="Confirm password" name="password_confirmation" type="password" autoComplete="new-password" required errors={form.errors} />
                <p className="text-xs text-stone-600">
                    By creating an account you agree to our{' '}
                    <Link to="/terms" className="font-semibold text-navy-700 underline">
                        Terms of use
                    </Link>{' '}
                    and confirm you have read our{' '}
                    <Link to="/privacy" className="font-semibold text-navy-700 underline">
                        Privacy policy
                    </Link>
                    . You must be 18 or older.
                </p>
                <button type="submit" className="btn-primary w-full" disabled={form.busy}>
                    {form.busy ? 'Creating account…' : 'Create account'}
                </button>
            </form>
        </AuthCard>
    );
}

export function ForgotPassword() {
    const form = useForm(async (values) => {
        const { data } = await api.post('/auth/forgot-password', values);
        form.setMessage({ type: 'success', text: data.message });
    });

    return (
        <AuthCard title="Reset your password" footer={<Link to="/login" className="font-semibold text-navy-700">Back to sign in</Link>}>
            <form onSubmit={form.onSubmit} className="space-y-4" noValidate>
                <Message message={form.message} />
                <Field label="Email" name="email" type="email" autoComplete="email" required errors={form.errors} />
                <button type="submit" className="btn-primary w-full" disabled={form.busy}>
                    Send reset link
                </button>
            </form>
        </AuthCard>
    );
}

export function ResetPassword() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const form = useForm(async (values) => {
        await api.post('/auth/reset-password', { ...values, token: params.get('token'), email: params.get('email') });
        navigate('/login');
    });

    return (
        <AuthCard title="Choose a new password">
            <form onSubmit={form.onSubmit} className="space-y-4" noValidate>
                <Message message={form.message} />
                <Field label="New password" name="password" type="password" autoComplete="new-password" required errors={form.errors} />
                <Field label="Confirm password" name="password_confirmation" type="password" autoComplete="new-password" required errors={form.errors} />
                <button type="submit" className="btn-primary w-full" disabled={form.busy}>
                    Update password
                </button>
            </form>
        </AuthCard>
    );
}
