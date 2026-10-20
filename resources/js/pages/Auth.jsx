import { Link, useNavigate, useSearchParams } from 'react-router';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Field, Message, PhoneField, useForm } from '../components/Form';
import GoogleButton, { OrDivider, googleSignInEnabled } from '../components/GoogleButton';

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

/** Where to go after signing in: ?next= when it is a same-site path, else the account. */
function useNextPath() {
    const [searchParams] = useSearchParams();
    // Only same-site paths: "//host" or "/\host" would be an open redirect.
    const next = searchParams.get('next') || '';
    return /^\/(?![/\\])/.test(next) ? next : '/account';
}

/** Carry ?next= across the sign-in / sign-up switch. */
function useNextQuery() {
    const [searchParams] = useSearchParams();
    const next = searchParams.get('next');
    return next ? `?next=${encodeURIComponent(next)}` : '';
}

function GoogleSignIn({ text }) {
    const { loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const target = useNextPath();
    if (!googleSignInEnabled()) {
        return null;
    }
    return (
        <>
            <GoogleButton
                text={text}
                onCredential={async (credential) => {
                    await loginWithGoogle(credential);
                    navigate(target);
                }}
            />
            <OrDivider />
        </>
    );
}

export function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const target = useNextPath();
    const nextQuery = useNextQuery();
    const form = useForm(async (values) => {
        await login(values);
        navigate(target);
    });

    return (
        <AuthCard title="Sign in" footer={<>New here? <Link to={`/register${nextQuery}`} className="font-semibold text-navy-700">Create an account</Link></>}>
            <GoogleSignIn text="signin_with" />
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
    const target = useNextPath();
    const nextQuery = useNextQuery();
    const form = useForm(async (values) => {
        await register(values);
        navigate(target);
    });

    return (
        <AuthCard title="Join DoonPortal" footer={<>Already a member? <Link to={`/login${nextQuery}`} className="font-semibold text-navy-700">Sign in</Link></>}>
            <GoogleSignIn text="signup_with" />
            <form onSubmit={form.onSubmit} className="space-y-4" noValidate>
                <Message message={form.message} />
                <Field label="Name" name="name" autoComplete="name" required errors={form.errors} />
                <Field label="Email" name="email" type="email" autoComplete="email" required errors={form.errors} />
                <PhoneField optional errors={form.errors} help="Only used to contact you about your account or listings. Never shown publicly." />
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
                    . You must be 18 or older.{googleSignInEnabled() && ' Signing up with Google means the same.'}
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
