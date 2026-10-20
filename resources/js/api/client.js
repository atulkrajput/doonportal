import axios from 'axios';

const TOKEN_KEY = 'doonportal.token';
// Staff sign in separately; their token is only sent to /admin endpoints.
const ADMIN_TOKEN_KEY = 'doonportal.admin-token';

export const api = axios.create({
    baseURL: '/api/v1',
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    timeout: 15000,
});

api.interceptors.request.use((config) => {
    const token = String(config.url || '').startsWith('/admin/') ? getAdminToken() : getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export function getToken() {
    try {
        return window.localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

export function setToken(token) {
    try {
        if (token) {
            window.localStorage.setItem(TOKEN_KEY, token);
        } else {
            window.localStorage.removeItem(TOKEN_KEY);
        }
    } catch {
        // Storage unavailable (private mode); the session simply won't persist.
    }
}

function readKey(key) {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeKey(key, value) {
    try {
        if (value) {
            window.localStorage.setItem(key, value);
        } else {
            window.localStorage.removeItem(key);
        }
    } catch {
        // Storage unavailable (private mode); the session simply won't persist.
    }
}

export function getAdminToken() {
    return readKey(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token) {
    writeKey(ADMIN_TOKEN_KEY, token);
}

export function errorMessage(error) {
    if (error?.response?.status === 429) {
        return 'Too many requests. Please wait a moment and try again.';
    }
    return error?.response?.data?.message || 'Something went wrong. Please try again.';
}

export function fieldErrors(error) {
    return error?.response?.data?.errors || {};
}

/** Drop empty values so URLs stay clean and the API sees only real filters. */
export function cleanParams(params = {}) {
    return Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false),
    );
}
