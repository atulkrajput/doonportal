import { siteConfig } from './site';

/**
 * Cookie consent: optional third-party tools (configured in Admin → Tracking
 * codes) load only after the visitor accepts their category. Choices are kept
 * for 12 months and asked again when the set of tools changes.
 */
const KEY = 'doonportal.consent';
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
export const OPEN_SETTINGS_EVENT = 'doonportal:open-cookie-settings';

export function consentConfig() {
    const cfg = siteConfig();
    return {
        version: cfg.consent?.version ?? 'none',
        tools: cfg.consent?.tools ?? { analytics: [], marketing: [] },
        tracking: cfg.tracking ?? {},
    };
}

export function hasOptionalTools() {
    const { tools } = consentConfig();
    return tools.analytics.length + tools.marketing.length > 0;
}

/** The stored choice for the current tool set, or null if the visitor still has to decide. */
export function readConsent() {
    try {
        const stored = JSON.parse(window.localStorage.getItem(KEY) || 'null');
        if (!stored || stored.version !== consentConfig().version || Date.now() - stored.at > MAX_AGE_MS) {
            return null;
        }
        return stored;
    } catch {
        return null;
    }
}

export function saveConsent({ analytics, marketing }) {
    const previous = readConsent();
    const choice = { version: consentConfig().version, analytics: Boolean(analytics), marketing: Boolean(marketing), at: Date.now() };
    try {
        window.localStorage.setItem(KEY, JSON.stringify(choice));
    } catch {
        // Storage blocked: the choice applies to this page view only.
    }
    // Withdrawing consent: remove the tools' cookies and reload so their scripts are gone.
    if (previous && ((previous.analytics && !choice.analytics) || (previous.marketing && !choice.marketing))) {
        clearTrackerCookies();
        window.location.reload();
        return choice;
    }
    applyConsent(choice);
    return choice;
}

export function openCookieSettings() {
    window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}

const loaded = new Set();

function addScript(src, inline) {
    if (src) {
        const s = document.createElement('script');
        s.async = true;
        s.src = src;
        document.head.appendChild(s);
    }
    if (inline) {
        inline();
    }
}

const LOADERS = {
    ga4_measurement_id: (id) =>
        addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`, () => {
            window.dataLayer = window.dataLayer || [];
            window.gtag = function gtag() {
                window.dataLayer.push(arguments);
            };
            window.gtag('js', new Date());
            window.gtag('config', id);
        }),
    gtm_container_id: (id) => {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
        addScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`);
    },
    clarity_project_id: (id) => {
        window.clarity =
            window.clarity ||
            function clarity() {
                (window.clarity.q = window.clarity.q || []).push(arguments);
            };
        addScript(`https://www.clarity.ms/tag/${encodeURIComponent(id)}`);
    },
    meta_pixel_id: (id) => {
        if (!window.fbq) {
            const n = function fbq() {
                n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
            };
            n.push = n;
            n.loaded = true;
            n.version = '2.0';
            n.queue = [];
            window.fbq = n;
            window._fbq = n;
            addScript('https://connect.facebook.net/en_US/fbevents.js');
        }
        window.fbq('init', id);
        window.fbq('track', 'PageView');
    },
};

/** Load the tools the visitor agreed to (each at most once per page load). */
export function applyConsent(choice) {
    if (!choice) {
        return;
    }
    const { tools, tracking } = consentConfig();
    for (const category of ['analytics', 'marketing']) {
        if (!choice[category]) {
            continue;
        }
        for (const tool of tools[category]) {
            const id = tracking[tool.key];
            if (id && !loaded.has(tool.key) && LOADERS[tool.key]) {
                loaded.add(tool.key);
                LOADERS[tool.key](id);
            }
        }
    }
}

function clearTrackerCookies() {
    const host = window.location.hostname;
    const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`];
    for (const cookie of document.cookie.split(';')) {
        const name = cookie.split('=')[0].trim();
        if (/^(_ga|_gid|_gat|_gcl|_fbp|_fbc|_clck|_clsk|CLID|MUID)/.test(name)) {
            for (const domain of domains) {
                document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
            }
        }
    }
}
