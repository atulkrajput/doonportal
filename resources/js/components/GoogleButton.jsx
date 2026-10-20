import { useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/client';
import { siteConfig } from '../lib/site';

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise;

/** Load Google Identity Services once, only on pages that show the button. */
function loadGoogle() {
    if (window.google?.accounts?.id) {
        return Promise.resolve(window.google);
    }
    scriptPromise ??= new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = SCRIPT_SRC;
        script.async = true;
        script.onload = () => resolve(window.google);
        script.onerror = () => {
            scriptPromise = undefined;
            reject(new Error('Google sign-in could not load.'));
        };
        document.head.appendChild(script);
    });
    return scriptPromise;
}

export function googleSignInEnabled() {
    return Boolean(siteConfig().google_client_id);
}

/**
 * "Sign in with Google". Google hands the browser an ID token, which the API
 * verifies before signing the member in (or creating their account).
 */
export default function GoogleButton({ onCredential, text = 'continue_with' }) {
    const container = useRef(null);
    const callback = useRef(onCredential);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const clientId = siteConfig().google_client_id;

    useEffect(() => {
        callback.current = onCredential;
    });

    useEffect(() => {
        if (!clientId) {
            return undefined;
        }
        let cancelled = false;
        loadGoogle()
            .then((google) => {
                if (cancelled || !container.current) {
                    return;
                }
                google.accounts.id.initialize({
                    client_id: clientId,
                    ux_mode: 'popup',
                    callback: async ({ credential }) => {
                        setBusy(true);
                        setError(null);
                        try {
                            await callback.current(credential);
                        } catch (err) {
                            setError(errorMessage(err));
                        } finally {
                            setBusy(false);
                        }
                    },
                });
                google.accounts.id.renderButton(container.current, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    shape: 'pill',
                    text,
                    width: Math.min(container.current.offsetWidth || 320, 400),
                });
            })
            .catch((err) => !cancelled && setError(err.message));
        return () => {
            cancelled = true;
        };
    }, [clientId, text]);

    if (!clientId) {
        return null;
    }
    return (
        <div>
            <div ref={container} className="flex min-h-[44px] w-full justify-center" aria-busy={busy} />
            {busy && <p className="mt-2 text-center text-sm text-stone-600">Signing you in…</p>}
            {error && (
                <p role="alert" className="mt-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">
                    {error}
                </p>
            )}
        </div>
    );
}

export function OrDivider() {
    return (
        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-stone-500" aria-hidden="true">
            <span className="h-px flex-1 bg-stone-200" /> or <span className="h-px flex-1 bg-stone-200" />
        </div>
    );
}
