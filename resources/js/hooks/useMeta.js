import { useEffect } from 'react';

const SITE = 'DoonPortal';
const DEFAULT_DESCRIPTION = 'Discover. Connect. Belong. Businesses, places, events and stories from Dehradun.';

function setMeta(selector, attr, key, value) {
    let el = document.head.querySelector(selector);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', value);
}

/**
 * Per-page title, description, canonical URL and optional JSON-LD.
 * JSON-LD must only be built from fields the API actually returned.
 */
export function useMeta({ title, description, jsonLd } = {}) {
    const ld = jsonLd ? JSON.stringify(jsonLd) : null;

    useEffect(() => {
        const fullTitle = title ? `${title} | ${SITE}` : `${SITE} — All Things Doon`;
        const desc = description || DEFAULT_DESCRIPTION;
        document.title = fullTitle;
        setMeta('meta[name="description"]', 'name', 'description', desc);
        setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
        setMeta('meta[property="og:description"]', 'property', 'og:description', desc);

        let canonical = document.head.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = `${window.location.origin}${window.location.pathname}`;

        let script = document.getElementById('page-jsonld');
        if (ld) {
            if (!script) {
                script = document.createElement('script');
                script.type = 'application/ld+json';
                script.id = 'page-jsonld';
                document.head.appendChild(script);
            }
            script.textContent = ld;
        } else if (script) {
            script.remove();
        }
    }, [title, description, ld]);
}
