import { useEffect, useId, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { OPEN_SETTINGS_EVENT, applyConsent, consentConfig, hasOptionalTools, readConsent, saveConsent } from '../lib/consent';

const CATEGORIES = [
    ['analytics', 'Analytics', 'Help us understand how the site is used so we can improve it.'],
    ['marketing', 'Marketing', 'Measure our adverts on other platforms.'],
];

/**
 * Cookie consent banner. Optional third-party tools stay off until the visitor
 * chooses; "Reject all" is as easy as "Accept all". Reopened from the footer.
 */
export default function CookieBanner() {
    const { pathname } = useLocation();
    const headingId = useId();
    const [visible, setVisible] = useState(() => hasOptionalTools() && readConsent() === null);
    const [customising, setCustomising] = useState(false);
    const [choice, setChoice] = useState(() => readConsent() ?? { analytics: false, marketing: false });

    // Returning visitors: load what they already agreed to.
    useEffect(() => {
        applyConsent(readConsent());
    }, []);

    useEffect(() => {
        const open = () => {
            setChoice(readConsent() ?? { analytics: false, marketing: false });
            setCustomising(true);
            setVisible(true);
        };
        window.addEventListener(OPEN_SETTINGS_EVENT, open);
        return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open);
    }, []);

    if (!visible || pathname.startsWith('/admin')) {
        return null;
    }

    const { tools } = consentConfig();
    const decide = (value) => {
        saveConsent(value);
        setVisible(false);
        setCustomising(false);
    };

    return (
        <section
            role="dialog"
            aria-modal="false"
            aria-labelledby={headingId}
            className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-2xl rounded-2xl border border-navy-200 bg-white p-4 shadow-2xl shadow-navy-900/20 sm:bottom-4 sm:p-5"
        >
            <h2 id={headingId} className="font-display text-lg font-semibold text-navy-700">
                {customising ? 'Cookie settings' : 'Your privacy, your choice'}
            </h2>
            {!customising ? (
                <p className="mt-1 text-sm text-stone-700">
                    We use essential storage to run the site. With your permission we’d also like to use optional tools to understand how DoonPortal is used{tools.marketing.length ? ' and measure our adverts' : ''}. Nothing optional loads until you choose. Read our{' '}
                    <Link to="/cookies" className="font-semibold text-navy-700 underline">
                        Cookie policy
                    </Link>
                    .
                </p>
            ) : (
                <div className="mt-3 space-y-2">
                    <div className="rounded-xl bg-stone-50 p-3 text-sm">
                        <p className="font-semibold">Strictly necessary · always on</p>
                        <p className="text-stone-600">Signing in and remembering these choices. Our own visit statistics use no cookies.</p>
                    </div>
                    {CATEGORIES.map(([key, label, help]) => {
                        const available = tools[key].length > 0;
                        return (
                            <label key={key} className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${available ? 'border-stone-200' : 'border-dashed border-stone-200 text-stone-400'}`}>
                                <input
                                    type="checkbox"
                                    className="mt-1"
                                    checked={available && Boolean(choice[key])}
                                    disabled={!available}
                                    onChange={(e) => setChoice((c) => ({ ...c, [key]: e.target.checked }))}
                                />
                                <span>
                                    <span className="font-semibold">{label}</span>
                                    <span className="block text-stone-600">{available ? help : 'Not in use on this site.'}</span>
                                    {available && <span className="mt-1 block text-xs text-stone-500">{tools[key].map((t) => t.name).join(', ')}</span>}
                                </span>
                            </label>
                        );
                    })}
                </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn-secondary flex-1 whitespace-nowrap sm:flex-none" onClick={() => decide({ analytics: false, marketing: false })}>
                    Reject all
                </button>
                {customising ? (
                    <button type="button" className="btn-secondary flex-1 whitespace-nowrap sm:flex-none" onClick={() => decide(choice)}>
                        Save choices
                    </button>
                ) : (
                    <button type="button" className="btn-secondary flex-1 whitespace-nowrap sm:flex-none" onClick={() => setCustomising(true)}>
                        Choose
                    </button>
                )}
                <button type="button" className="btn-primary flex-1 whitespace-nowrap sm:flex-none" onClick={() => decide({ analytics: true, marketing: true })}>
                    Accept all
                </button>
                {customising && readConsent() !== null && (
                    <button type="button" className="ml-auto text-sm text-stone-600 hover:underline" onClick={() => setVisible(false)}>
                        Close
                    </button>
                )}
            </div>
        </section>
    );
}
