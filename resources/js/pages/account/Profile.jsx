import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { CountrySelect, Field, Message, PhoneField, useForm } from '../../components/Form';
import { Panel } from './AccountLayout';

export default function Profile() {
    const { user, setUser } = useAuth();
    const form = useForm(async (values) => {
        const { data } = await api.patch('/me', values);
        setUser(data.data);
        form.setMessage({ type: 'success', text: 'Your profile has been saved.' });
    });
    const a = user.address || {};

    return (
        <form onSubmit={form.onSubmit} noValidate className="space-y-6">
            <Panel title="About you">
                <div className="space-y-4">
                    <Message message={form.message} />
                    <Field label="Full name" name="name" defaultValue={user.name} autoComplete="name" required errors={form.errors} />
                    <label className="block">
                        <span className="text-sm font-medium text-stone-700">Email</span>
                        <input className="input mt-1 bg-stone-50 text-stone-600" value={user.email} readOnly aria-describedby="email-help" />
                        <span id="email-help" className="mt-1 block text-xs text-stone-500">
                            {user.google_linked ? 'Linked to your Google account.' : 'Contact us if you need to change your email address.'}
                        </span>
                    </label>
                    <PhoneField value={user.phone} country={user.phone_country} optional errors={form.errors} help="Used for account and listing matters only. Never shown publicly." />
                    <Field label="About you" name="bio" type="textarea" defaultValue={user.bio ?? ''} maxLength={1000} optional errors={form.errors} help="Not shown publicly." />
                </div>
            </Panel>

            <Panel title="Address">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field className="sm:col-span-2" label="House / street" name="address_line1" defaultValue={a.line1 ?? ''} autoComplete="address-line1" optional errors={form.errors} />
                    <Field className="sm:col-span-2" label="Area / landmark" name="address_line2" defaultValue={a.line2 ?? ''} autoComplete="address-line2" optional errors={form.errors} />
                    <Field label="City" name="city" defaultValue={a.city ?? ''} autoComplete="address-level2" placeholder="Dehradun" optional errors={form.errors} />
                    <Field label="State" name="state" defaultValue={a.state ?? ''} autoComplete="address-level1" placeholder="Uttarakhand" optional errors={form.errors} />
                    <Field label="PIN / postal code" name="postal_code" defaultValue={a.postal_code ?? ''} autoComplete="postal-code" inputMode="numeric" optional errors={form.errors} />
                    <CountrySelect name="country" defaultValue={a.country ?? 'IN'} optional errors={form.errors} autoComplete="country" />
                </div>
                <p className="mt-4 text-xs text-stone-500">Private to you and never shown publicly.</p>
            </Panel>

            <div className="flex justify-end">
                <button type="submit" className="btn-primary" disabled={form.busy}>
                    {form.busy ? 'Saving…' : 'Save profile'}
                </button>
            </div>
        </form>
    );
}
