import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { track } from '../lib/analytics';
import { Checkbox, Field, Message, PhoneField, Select, useForm } from './Form';
import { Icon } from './Icons';

/**
 * "Own this business?" panel on a listing. Members send an ownership claim
 * with contact details and evidence; staff verify it before handing over.
 */
export default function ClaimListing({ business, isOwner }) {
    const { user } = useAuth();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [sent, setSent] = useState(false);
    const form = useForm(async (values) => {
        const evidence_links = [values.link1, values.link2].filter(Boolean);
        await api.post(`/businesses/${business.slug}/claim`, { ...values, evidence_links });
        track('business_claimed', { type: 'business', id: business.id });
        setSent(true);
    });

    if (isOwner) {
        return (
            <Link to={`/account/businesses/${business.id}`} className="btn-primary w-full">
                <Icon name="settings" size={16} /> Manage this listing
            </Link>
        );
    }
    if (business.is_claimed) {
        return (
            <p className="flex items-center gap-1.5 text-sm text-stone-600">
                <Icon name="check" size={16} /> Managed by the business owner
            </p>
        );
    }
    if (sent) {
        return (
            <div role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                <p className="font-semibold">Claim sent</p>
                <p className="mt-1">We’ll check your details and get back to you, usually within 2 working days. Track it in <Link to="/account/businesses" className="underline">My businesses</Link>.</p>
            </div>
        );
    }
    if (!open) {
        return (
            <div>
                <p className="font-semibold">Own this business?</p>
                <p className="mt-1 text-stone-600">Claim it for free to update details, reply to reviews and see how people find you.</p>
                {user ? (
                    <button type="button" className="btn-secondary mt-3" onClick={() => setOpen(true)}>
                        Claim this listing
                    </button>
                ) : (
                    <Link to={`/login?next=${encodeURIComponent(location.pathname)}`} className="btn-secondary mt-3">
                        Sign in to claim
                    </Link>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={form.onSubmit} noValidate className="space-y-3">
            <p className="font-semibold">Claim {business.name}</p>
            <Message message={form.message} />
            {form.errors.business && <p className="text-sm text-red-700">{form.errors.business[0]}</p>}
            <Select label="Your role" name="claimant_role" defaultValue="owner" errors={form.errors}>
                <option value="owner">Owner</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
                <option value="agency">Agency acting for the owner</option>
            </Select>
            <PhoneField label="Your mobile number" name="contact_phone" countryName="contact_phone_country" value={user.phone} country={user.phone_country} required errors={form.errors} />
            <Field label="Your email" name="contact_email" type="email" defaultValue={user.email} required errors={form.errors} />
            <Field
                label="How can we confirm you run it?"
                name="message"
                type="textarea"
                optional
                maxLength={2000}
                errors={form.errors}
                help="For example: your name on the GST certificate, shop licence or Google Business Profile. We may call the business number to check."
            />
            <Field label="Proof link" name="link1" type="url" optional placeholder="https://" errors={{ link1: form.errors['evidence_links.0'] }} help="Your website, social page or a shared document." />
            <Field label="Another link" name="link2" type="url" optional placeholder="https://" errors={{ link2: form.errors['evidence_links.1'] }} />
            <Checkbox name="confirm" errors={form.errors}>
                I’m authorised to manage this business, and the details above are true.
            </Checkbox>
            <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn-primary" disabled={form.busy}>
                    {form.busy ? 'Sending…' : 'Send claim'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                    Cancel
                </button>
            </div>
        </form>
    );
}
