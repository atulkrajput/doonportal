import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { api } from '../api/client';
import { track } from '../lib/analytics';

function setMeta(attr, key, value) {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!value) {
        el?.remove();
        return;
    }
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', value);
}

/** Apply metadata from GET /api/v1/seo (same resolver as the server-rendered shell). */
export function applySeo(seo) {
    document.title = seo.title;
    setMeta('name', 'description', seo.description);
    setMeta('name', 'robots', seo.robots);
    setMeta('property', 'og:title', seo.title);
    setMeta('property', 'og:description', seo.description);
    setMeta('property', 'og:url', seo.canonical);
    setMeta('property', 'og:type', seo.type);
    setMeta('property', 'og:image', seo.image);
    setMeta('name', 'twitter:card', seo.image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', seo.title);
    setMeta('name', 'twitter:description', seo.description);
    setMeta('name', 'twitter:image', seo.image);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
    }
    canonical.href = seo.canonical;

    let script = document.getElementById('page-jsonld');
    if (seo.json_ld) {
        if (!script) {
            script = document.createElement('script');
            script.type = 'application/ld+json';
            script.id = 'page-jsonld';
            document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(seo.json_ld);
    } else {
        script?.remove();
    }
}

/**
 * Keeps <head> in sync on client-side navigation and records a first-party
 * page view. The first page's tags were already rendered by the server.
 */
export default function SeoManager() {
    const { pathname, search } = useLocation();
    const serverPath = useRef(document.head.querySelector('meta[name="dp-seo-path"]')?.content ?? null);

    useEffect(() => {
        const path = pathname + search;
        if (pathname === '/admin' || pathname.startsWith('/admin/')) {
            return undefined;
        }
        track('page_view', null, { path: pathname });

        if (serverPath.current === path) {
            serverPath.current = null;
            return undefined;
        }
        serverPath.current = null;

        const controller = new AbortController();
        api.get('/seo', { params: { path }, signal: controller.signal })
            .then((r) => applySeo(r.data.data))
            .catch(() => {});
        return () => controller.abort();
    }, [pathname, search]);

    return null;
}
