import { useEffect, useState } from 'react';
import { api, errorMessage, fieldErrors } from '../../api/client';
import { ErrorState, PageLoading } from '../../components/States';
import { MediaField } from '../components/Fields';
import { Counter } from '../components/SeoBits';

export function PageIntro({ title, children }) {
    return (
        <div className="mb-5">
            <h1 className="font-display text-2xl font-bold">{title}</h1>
            {children && <div className="mt-1 max-w-3xl text-sm text-stone-600">{children}</div>}
        </div>
    );
}

/**
 * Loads GET /admin/settings/{group}, edits the given fields and saves the whole
 * group with PUT. Fields: {name, label, type: text|url|textarea|checkbox|media, help, placeholder, limit}.
 */
export function SettingsForm({ group, sections, onSaved }) {
    const [values, setValues] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [errors, setErrors] = useState({});
    const [state, setState] = useState({ busy: false, message: null, tone: 'ok' });

    useEffect(() => {
        const controller = new AbortController();
        api.get(`/admin/settings/${group}`, { signal: controller.signal })
            .then((r) => setValues(r.data.data))
            .catch((e) => setLoadError(e));
        return () => controller.abort();
    }, [group]);

    if (loadError) {
        return <ErrorState error={loadError} />;
    }
    if (!values) {
        return <PageLoading />;
    }

    const set = (name, v) => setValues((prev) => ({ ...prev, [name]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setErrors({});
        setState({ busy: true, message: null, tone: 'ok' });
        const payload = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === '' ? null : v]));
        try {
            const { data } = await api.put(`/admin/settings/${group}`, payload);
            setValues(data.data);
            setState({ busy: false, message: 'Saved.', tone: 'ok' });
            onSaved?.(data.data);
        } catch (err) {
            setErrors(fieldErrors(err));
            setState({ busy: false, message: errorMessage(err), tone: 'error' });
        }
    };

    return (
        <form onSubmit={submit} noValidate className="space-y-4">
            {sections.map((section) => (
                <section key={section.title} className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
                    <h2 className="font-semibold">{section.title}</h2>
                    {section.help && <p className="mt-1 text-sm text-stone-600">{section.help}</p>}
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {section.fields.map((f) => (
                            <div key={f.name} className={f.type === 'textarea' || f.full ? 'sm:col-span-2' : ''}>
                                {f.type === 'checkbox' ? (
                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <input type="checkbox" checked={Boolean(values[f.name])} onChange={(e) => set(f.name, e.target.checked)} />
                                        {f.label}
                                    </label>
                                ) : (
                                    <>
                                        <div className="mb-1 flex items-center justify-between gap-2">
                                            <label htmlFor={`s-${f.name}`} className="text-sm font-medium text-stone-800">
                                                {f.label}
                                            </label>
                                            {f.limit && <Counter value={values[f.name]} limit={f.limit} />}
                                        </div>
                                        {f.type === 'textarea' ? (
                                            <textarea id={`s-${f.name}`} className="input min-h-20" value={values[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)} />
                                        ) : f.type === 'media' ? (
                                            <MediaField id={`s-${f.name}`} value={values[f.name]} onChange={(v) => set(f.name, v)} />
                                        ) : (
                                            <input
                                                id={`s-${f.name}`}
                                                type={f.type === 'url' ? 'url' : 'text'}
                                                className="input font-mono text-sm"
                                                placeholder={f.placeholder}
                                                value={values[f.name] ?? ''}
                                                onChange={(e) => set(f.name, e.target.value)}
                                                spellCheck={false}
                                                autoComplete="off"
                                            />
                                        )}
                                    </>
                                )}
                                {f.help && <p className="mt-1 text-xs text-stone-500">{f.help}</p>}
                                {errors[f.name] && (
                                    <p className="mt-1 text-xs text-red-700" role="alert">
                                        {errors[f.name][0]}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            ))}
            <div className="sticky bottom-0 flex items-center gap-3 rounded-2xl border border-stone-200 bg-white/95 px-4 py-3">
                <button type="submit" className="btn-primary" disabled={state.busy}>
                    {state.busy ? 'Saving…' : 'Save changes'}
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

export function SocialSettings() {
    return (
        <div>
            <PageIntro title="Social media">
                Official DoonPortal profiles. They appear as “Follow us” icons in the site footer and as <code>sameAs</code> links in the homepage structured data, which helps search engines connect the profiles to the site. Leave a field empty to hide it.
            </PageIntro>
            <SettingsForm
                group="social"
                sections={[
                    {
                        title: 'Profiles',
                        fields: [
                            { name: 'instagram_url', label: 'Instagram', type: 'url', placeholder: 'https://www.instagram.com/…' },
                            { name: 'facebook_url', label: 'Facebook', type: 'url', placeholder: 'https://www.facebook.com/…' },
                            { name: 'x_url', label: 'X (Twitter)', type: 'url', placeholder: 'https://x.com/…' },
                            { name: 'youtube_url', label: 'YouTube', type: 'url', placeholder: 'https://www.youtube.com/@…' },
                            { name: 'linkedin_url', label: 'LinkedIn', type: 'url', placeholder: 'https://www.linkedin.com/company/…' },
                            { name: 'whatsapp_url', label: 'WhatsApp', type: 'url', placeholder: 'https://wa.me/…', help: 'A wa.me link or WhatsApp channel/community link.' },
                        ],
                    },
                    {
                        title: 'Sharing',
                        fields: [{ name: 'x_handle', label: 'X handle', placeholder: '@doonportal', help: 'Used for twitter:site on shared links.' }],
                    },
                ]}
            />
        </div>
    );
}

export function LegalSettings() {
    return (
        <div>
            <PageIntro title="Legal details">
                Who operates DoonPortal and how people can reach you. These details fill the placeholders in the Privacy policy, Terms, Contact and other site pages. Until a field is filled in, those pages show “(to be published)” — never a made-up value. Indian law (IT Rules 2021 and the DPDP Act 2023) expects a reachable grievance officer.
            </PageIntro>
            <SettingsForm
                group="legal"
                sections={[
                    {
                        title: 'Operator',
                        fields: [
                            { name: 'operator_name', label: 'Legal name of the operator', placeholder: 'Company, firm or individual', help: 'The person or business legally responsible for the site.' },
                            { name: 'jurisdiction_city', label: 'Courts at (city)', help: 'Used in the Terms (governing law and courts).' },
                            { name: 'postal_address', label: 'Postal address', type: 'textarea' },
                        ],
                    },
                    {
                        title: 'Contact',
                        fields: [
                            { name: 'contact_email', label: 'Contact email', placeholder: 'hello@…' },
                            { name: 'contact_phone', label: 'Contact phone (optional)', placeholder: '+91 …' },
                        ],
                    },
                    {
                        title: 'Grievance officer',
                        help: 'Complaints about content or personal data go here. Under the IT Rules 2021, complaints must be acknowledged within 24 hours and resolved within 15 days.',
                        fields: [
                            { name: 'grievance_officer_name', label: 'Name' },
                            { name: 'grievance_officer_email', label: 'Email' },
                        ],
                    },
                ]}
            />
        </div>
    );
}

export function TrackingSettings() {
    return (
        <div>
            <PageIntro title="Tracking codes">
                Paste only the ID — DoonPortal adds the official snippet for you, on every public page (never inside the admin). Arbitrary scripts are not accepted, so a mistyped or malicious value cannot run on the site. Leave a field empty to switch that tool off. Tools load only for visitors who accept them in the cookie banner (Analytics: GA4, Tag Manager, Clarity · Marketing: Meta Pixel), and the Cookie policy lists them automatically.
            </PageIntro>
            <SettingsForm
                group="tracking"
                sections={[
                    {
                        title: 'Analytics & tags',
                        fields: [
                            { name: 'ga4_measurement_id', label: 'Google Analytics 4 measurement ID', placeholder: 'G-XXXXXXXXXX' },
                            { name: 'gtm_container_id', label: 'Google Tag Manager container ID', placeholder: 'GTM-XXXXXXX', help: 'Use either GTM or GA4 directly, not both for the same property, to avoid double counting.' },
                            { name: 'meta_pixel_id', label: 'Meta (Facebook) Pixel ID', placeholder: '123456789012345' },
                            { name: 'clarity_project_id', label: 'Microsoft Clarity project ID', placeholder: 'abcd1234ef' },
                        ],
                    },
                    {
                        title: 'Search engine verification',
                        help: 'The content value of the verification meta tag (not the whole tag).',
                        fields: [
                            { name: 'google_site_verification', label: 'Google Search Console', placeholder: 'abc123…' },
                            { name: 'bing_site_verification', label: 'Bing Webmaster Tools', placeholder: '0123456789ABCDEF…' },
                        ],
                    },
                ]}
            />
        </div>
    );
}
