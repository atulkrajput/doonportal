import { useState } from 'react';
import { Link } from 'react-router';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { Checkbox, Field, Message, PhoneField, Select, useForm } from '../../components/Form';
import { Icon } from '../../components/Icons';
import { Panel } from './AccountLayout';

export default function AddBusiness() {
    const { user } = useAuth();
    const { data: categories } = useApi('/categories', { type: 'business' });
    const { data: areas } = useApi('/areas');
    const [done, setDone] = useState(null);
    const form = useForm(async (values) => {
        const { data } = await api.post('/me/submissions/business', values);
        setDone(data.data);
        window.scrollTo(0, 0);
    });

    if (done) {
        return (
            <Panel>
                <div className="py-6 text-center">
                    <span className="icon-badge icon-badge-accent">
                        <Icon name="check" />
                    </span>
                    <h2 className="mt-3 font-display text-2xl font-bold">Thanks! {done.payload?.name} is with our team</h2>
                    <p className="mx-auto mt-2 max-w-md text-stone-600">
                        We check every new listing, usually within 2 working days. Once it’s approved it goes live and appears under My businesses, where you can add hours, services and more.
                    </p>
                    <Link to="/account/businesses" className="btn-primary mt-5">
                        Back to my businesses
                    </Link>
                </div>
            </Panel>
        );
    }

    return (
        <form onSubmit={form.onSubmit} noValidate className="space-y-6">
            <div>
                <Link to="/account/businesses" className="text-sm font-semibold text-navy-700">
                    ← My businesses
                </Link>
                <h2 className="mt-2 font-display text-2xl font-bold">Add your business</h2>
                <p className="mt-1 text-stone-600">
                    Free, and takes two minutes. Already listed?{' '}
                    <Link to="/businesses" className="font-semibold text-navy-700 underline">
                        Claim it instead
                    </Link>
                    .
                </p>
            </div>
            <Message message={form.message} />

            <Panel title="The basics">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field className="sm:col-span-2" label="Business name" name="name" required maxLength={255} errors={form.errors} />
                    <Select label="Category" name="category_id" required defaultValue="" errors={form.errors}>
                        <option value="" disabled>
                            Choose a category
                        </option>
                        {(categories?.data || []).map((parent) => (
                            <optgroup key={parent.id} label={parent.name}>
                                <option value={parent.id}>{parent.name} (general)</option>
                                {(parent.children || []).map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </Select>
                    <Select label="Area" name="area_id" defaultValue="" optional errors={form.errors}>
                        <option value="">Choose an area</option>
                        {(areas?.data || []).map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </Select>
                    <Field className="sm:col-span-2" label="Tagline" name="tagline" maxLength={255} optional placeholder="e.g. Wood-fired sourdough on Old Survey Road" errors={form.errors} />
                    <Field className="sm:col-span-2" label="About the business" name="description" type="textarea" maxLength={5000} optional errors={form.errors} />
                </div>
            </Panel>

            <Panel title="Where and how to reach you">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field className="sm:col-span-2" label="Address" name="address_line" required maxLength={255} placeholder="Shop no., building, street" errors={form.errors} />
                    <Field label="Locality / landmark" name="locality" optional maxLength={255} errors={form.errors} />
                    <Field label="PIN code" name="pincode" inputMode="numeric" maxLength={6} optional placeholder="248001" errors={form.errors} />
                    <PhoneField label="Business phone" value={user.phone} country={user.phone_country} required errors={form.errors} help="Shown on your listing so customers can call you." />
                    <Field label="WhatsApp number" name="whatsapp" type="tel" optional errors={form.errors} help="Same country code as the phone. Leave blank if none." />
                    <Field label="Business email" name="email" type="email" optional errors={form.errors} />
                    <Field label="Website" name="website" type="url" optional placeholder="https://" errors={form.errors} />
                </div>
            </Panel>

            <Panel title="About you">
                <div className="space-y-4">
                    <Select label="Your role" name="relationship" required defaultValue="owner" errors={form.errors}>
                        <option value="owner">I’m the owner</option>
                        <option value="manager">I’m the manager</option>
                        <option value="employee">I work there</option>
                        <option value="agency">I’m an agency acting for the owner</option>
                    </Select>
                    <Checkbox name="confirm" errors={form.errors}>
                        I’m authorised to list this business and the details are accurate. I agree to the{' '}
                        <Link to="/terms" className="underline">
                            Terms of use
                        </Link>
                        .
                    </Checkbox>
                </div>
            </Panel>

            <div className="flex justify-end">
                <button type="submit" className="btn-primary" disabled={form.busy}>
                    {form.busy ? 'Sending…' : 'Send for review'}
                </button>
            </div>
        </form>
    );
}
