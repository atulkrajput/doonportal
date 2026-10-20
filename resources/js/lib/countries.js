import rows from '../../data/countries.json';

/**
 * Countries with dial codes, shared with the API's phone validation
 * (resources/data/countries.json). India first, as most members are here.
 */
export const DEFAULT_COUNTRY = 'IN';

export const COUNTRIES = rows.map(([code, name, dial]) => ({ code, name, dial }));

const BY_CODE = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

export const COUNTRY_OPTIONS = [BY_CODE[DEFAULT_COUNTRY], ...COUNTRIES.filter((c) => c.code !== DEFAULT_COUNTRY)];

export function country(code) {
    return BY_CODE[code] || null;
}

/** Flag emoji from an ISO code (regional indicator letters). */
export function flag(code) {
    return code ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '';
}

/** "+919876543210" → "98765 43210" for editing (strips the country's dial code). */
export function nationalNumber(e164, code) {
    const dial = country(code)?.dial;
    if (!e164) {
        return '';
    }
    return dial && e164.startsWith(`+${dial}`) ? e164.slice(dial.length + 1) : e164;
}

/** "+919876543210" → "+91 98765 43210" for display. */
export function formatPhone(e164, code) {
    const dial = country(code)?.dial;
    if (!e164 || !dial || !e164.startsWith(`+${dial}`)) {
        return e164 || '';
    }
    const rest = e164.slice(dial.length + 1);
    return `+${dial} ${rest.length === 10 ? `${rest.slice(0, 5)} ${rest.slice(5)}` : rest}`;
}
