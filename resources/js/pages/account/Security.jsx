import { useNavigate } from 'react-router';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Field, Message, useForm } from '../../components/Form';
import GoogleButton, { googleSignInEnabled } from '../../components/GoogleButton';
import { Icon } from '../../components/Icons';
import { Panel } from './AccountLayout';

export default function Security() {
    const { user, refresh, setUser, logout } = useAuth();
    const navigate = useNavigate();
    const hasPassword = user.has_password;
    const form = useForm(async (values, el) => {
        const { data } = await api.put('/me/password', values);
        el.reset();
        await refresh();
        form.setMessage({ type: 'success', text: data.message });
    });

    return (
        <div className="space-y-6">
            <Panel title={hasPassword ? 'Change password' : 'Set a password'}>
                {!hasPassword && <p className="mb-4 text-sm text-stone-600">You signed up with Google. Add a password to also sign in with your email address.</p>}
                <form onSubmit={form.onSubmit} noValidate className="max-w-md space-y-4">
                    <Message message={form.message} />
                    {hasPassword && <Field label="Current password" name="current_password" type="password" autoComplete="current-password" required errors={form.errors} />}
                    <Field label="New password" name="password" type="password" autoComplete="new-password" required errors={form.errors} help="At least 8 characters." />
                    <Field label="Confirm new password" name="password_confirmation" type="password" autoComplete="new-password" required errors={form.errors} />
                    <button type="submit" className="btn-primary" disabled={form.busy}>
                        {form.busy ? 'Saving…' : hasPassword ? 'Change password' : 'Set password'}
                    </button>
                    {hasPassword && <p className="text-xs text-stone-500">Changing your password signs you out on your other devices.</p>}
                </form>
            </Panel>

            {googleSignInEnabled() && (
                <Panel title="Google sign-in">
                    {user.google_linked ? (
                        <p className="flex items-center gap-2 text-sm text-emerald-800">
                            <Icon name="check" size={18} /> Your Google account is linked. You can sign in with Google.
                        </p>
                    ) : (
                        <div className="max-w-sm space-y-3">
                            <p className="text-sm text-stone-600">Link Google to sign in with one tap. It must use the same email address ({user.email}).</p>
                            <GoogleButton
                                text="continue_with"
                                onCredential={async (credential) => {
                                    const { data } = await api.post('/me/google', { credential });
                                    setUser(data.data);
                                }}
                            />
                        </div>
                    )}
                </Panel>
            )}

            <Panel title="Sign out">
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={async () => {
                        await logout();
                        navigate('/');
                    }}
                >
                    <Icon name="logout" size={16} /> Sign out of this device
                </button>
            </Panel>
        </div>
    );
}
