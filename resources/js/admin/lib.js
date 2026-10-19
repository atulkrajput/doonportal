/**
 * Shared helpers for the admin area. Permissions come from /auth/me; the
 * server re-checks every request, so these only decide what to show.
 */

export const PERMISSIONS = {
    businesses: 'businesses.manage',
    places: 'places.manage',
    events: 'events.manage',
    stories: 'stories.manage',
    collections: 'collections.manage',
    taxonomy: 'taxonomy.manage',
    users: 'users.manage',
    audit: 'audit.view',
};

export const CONTENT_PERMISSIONS = [
    PERMISSIONS.businesses,
    PERMISSIONS.places,
    PERMISSIONS.events,
    PERMISSIONS.stories,
    PERMISSIONS.collections,
    PERMISSIONS.taxonomy,
];

export function isSuperAdmin(user) {
    return Boolean(user?.roles?.includes('SUPER_ADMIN'));
}

export function can(user, permission) {
    if (!user) {
        return false;
    }
    if (isSuperAdmin(user)) {
        return true;
    }
    const list = Array.isArray(permission) ? permission : [permission];
    return list.some((p) => user.permissions?.includes(p));
}

export function isStaff(user) {
    return Boolean(user && (isSuperAdmin(user) || user.permissions?.length));
}

/** Allowed status changes, mirroring the PHP enums (the server enforces them). */
export const TRANSITIONS = {
    business: {
        UNVERIFIED: ['SUBMITTED', 'UNDER_REVIEW', 'SUSPENDED', 'CLOSED'],
        SUBMITTED: ['UNDER_REVIEW', 'UNVERIFIED', 'SUSPENDED'],
        UNDER_REVIEW: ['VERIFIED', 'UNVERIFIED', 'SUSPENDED'],
        VERIFIED: ['CLAIMED', 'UNDER_REVIEW', 'UNVERIFIED', 'SUSPENDED', 'CLOSED'],
        CLAIMED: ['VERIFIED', 'UNDER_REVIEW', 'SUSPENDED', 'CLOSED'],
        SUSPENDED: ['UNDER_REVIEW', 'UNVERIFIED'],
        CLOSED: ['UNDER_REVIEW'],
    },
    event: {
        DRAFT: ['SUBMITTED', 'REVIEW'],
        SUBMITTED: ['REVIEW', 'DRAFT'],
        REVIEW: ['PUBLISHED', 'DRAFT'],
        PUBLISHED: ['CANCELLED', 'ARCHIVED', 'REVIEW'],
        CANCELLED: ['PUBLISHED', 'ARCHIVED'],
        ARCHIVED: [],
    },
    publication: {
        DRAFT: ['REVIEW', 'PUBLISHED', 'ARCHIVED'],
        REVIEW: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
        PUBLISHED: ['REVIEW', 'DRAFT', 'ARCHIVED'],
        ARCHIVED: ['DRAFT', 'REVIEW'],
    },
};

const STATUS_TONES = {
    PUBLISHED: 'bg-forest-100 text-forest-700',
    VERIFIED: 'bg-forest-100 text-forest-700',
    CLAIMED: 'bg-forest-100 text-forest-700',
    REVIEW: 'bg-saffron-100 text-amber-800',
    UNDER_REVIEW: 'bg-saffron-100 text-amber-800',
    SUBMITTED: 'bg-saffron-100 text-amber-800',
    CANCELLED: 'bg-red-100 text-red-800',
    SUSPENDED: 'bg-red-100 text-red-800',
    CLOSED: 'bg-stone-200 text-stone-700',
    ARCHIVED: 'bg-stone-200 text-stone-700',
};

export function statusTone(status) {
    return STATUS_TONES[status] || 'bg-stone-100 text-stone-700';
}

export function humanize(value) {
    return String(value ?? '')
        .replace(/[_.]/g, ' ')
        .toLowerCase()
        .replace(/^\w/, (c) => c.toUpperCase());
}

/** ISO instant → "YYYY-MM-DDTHH:mm" wall-clock time in `timeZone`, for datetime-local inputs. */
export function toLocalInput(iso, timeZone = 'Asia/Kolkata') {
    if (!iso) {
        return '';
    }
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        })
            .formatToParts(new Date(iso))
            .map((p) => [p.type, p.value]),
    );
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function formatDateTime(iso, timeZone = 'Asia/Kolkata') {
    if (!iso) {
        return '—';
    }
    return new Intl.DateTimeFormat('en-IN', { timeZone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}
