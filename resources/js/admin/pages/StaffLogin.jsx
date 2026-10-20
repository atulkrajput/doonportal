import { useEffect } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { useStaff } from '../StaffContext';
import { Field, Message, useForm } from '../../components/Form';
import { Logo } from '../../components/Brand';
import { PageLoading } from '../../components/States';

/** Staff sign-in. Member accounts can't sign in here, and staff accounts can't sign in on the public site. */
export default function StaffLogin() {
    const { user, ready, login } = useStaff();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const next = params.get('next') || '';
    // Only paths inside the admin area.
    const target = /^\/admin(\/|$)/.test(next) && !next.startsWith('/admin/login') ? next : '/admin';
    const form = useForm(async (values) => {
        await login(values);
        navigate(target, { replace: true });
    });

    useEffect(() => {
        const robots = document.createElement('meta');
        robots.name = 'robots';
        robots.content = 'noindex,nofollow';
        document.head.appendChild(robots);
        document.title = 'Staff sign in | DoonPortal';
        return () => robots.remove();
    }, []);

    if (!ready) {
        return <PageLoading />;
    }
    if (user) {
        return <Navigate to={target} replace />;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4 py-12">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl sm:p-8">
                <div className="flex items-center gap-2">
                    <Logo to="/" label="DoonPortal home" />
                    <span className="ml-auto rounded bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Staff</span>
                </div>
                <h1 className="mt-6 font-display text-2xl font-bold">Staff sign in</h1>
                <p className="mt-1 text-sm text-stone-600">For the DoonPortal team. Members sign in on the main site.</p>
                <form onSubmit={form.onSubmit} noValidate className="mt-6 space-y-4">
                    <Message message={form.message} />
                    <Field label="Work email" name="email" type="email" autoComplete="username" required errors={form.errors} />
                    <Field label="Password" name="password" type="password" autoComplete="current-password" required errors={form.errors} />
                    <button type="submit" className="btn-primary w-full" disabled={form.busy}>
                        {form.busy ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>
                <p className="mt-6 text-center text-xs text-stone-500">
                    Forgot your password? Ask a super admin to reset it. ·{' '}
                    <Link to="/login" className="underline">
                        Member sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
