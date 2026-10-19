const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function formatPaise(paise) {
    return paise == null ? null : rupees.format(paise / 100);
}

export function priceLabel({ is_free, min_paise, max_paise } = {}) {
    if (is_free) {
        return 'Free';
    }
    if (min_paise == null) {
        return null;
    }
    if (max_paise != null && max_paise !== min_paise) {
        return `${formatPaise(min_paise)} – ${formatPaise(max_paise)}`;
    }
    return `From ${formatPaise(min_paise)}`;
}

export function priceRange(level) {
    return level ? '₹'.repeat(level) : null;
}

/** Event times come as ISO strings with offset; display in the event's own zone. */
export function formatEventDate(iso, timeZone = 'Asia/Kolkata', withTime = true) {
    if (!iso) {
        return 'Date to be announced';
    }
    return new Intl.DateTimeFormat('en-IN', {
        timeZone,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    }).format(new Date(iso));
}

export function formatDate(iso) {
    if (!iso) {
        return null;
    }
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function telHref(phone) {
    return phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null;
}

export function whatsappHref(number) {
    return number ? `https://wa.me/${number.replace(/\D/g, '')}` : null;
}

export function directionsHref(location, label) {
    if (location) {
        return `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
    }
    return label ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${label}, Dehradun`)}` : null;
}
