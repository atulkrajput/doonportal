/* Minimal inline icon set (stroke icons, 24px grid). Decorative unless labelled. */
const base = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
};

const paths = {
    home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
    compass: 'M12 21a9 9 0 100-18 9 9 0 000 18zM15.5 8.5l-2 5-5 2 2-5 5-2z',
    search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
    calendar: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',
    heart: 'M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z',
    pin: 'M12 21s-6-5.5-6-11a6 6 0 1112 0c0 5.5-6 11-6 11zM12 12a2 2 0 100-4 2 2 0 000 4z',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
    chat: 'M4 20l1.5-4A8 8 0 1112 20a8 8 0 01-4-1l-4 1z',
    globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18',
    route: 'M6 19a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM6 15V9a4 4 0 014-4h6M18 9v6a4 4 0 01-4 4H8',
    mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
    check: 'M5 12l4 4 10-10',
    star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
    clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
    flag: 'M5 21V4h11l-2 4 2 4H5',
    menu: 'M4 7h16M4 12h16M4 17h16',
    close: 'M6 6l12 12M18 6L6 18',
    store: 'M4 9l1-5h14l1 5M4 9h16v11H4zM9 20v-6h6v6',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
    utensils: 'M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10M16 3c-2 1.5-2.5 4-2.5 7h2.5v11',
    bag: 'M5 8h14l-1 13H6zM9 8V6a3 3 0 016 0v2',
    users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 6.5M18 14a6 6 0 013.5 6',
    briefcase: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
    sparkles: 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z',
    car: 'M5 16V12l2-5h10l2 5v4M3 16h18v3H3zM7 19v1.5M17 19v1.5M5 12h14',
    cap: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6',
    medical: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
    bed: 'M3 7v13M3 14h18v6M21 14v-3a3 3 0 00-3-3h-8v6M7 11.5a1.5 1.5 0 100-.01',
    mountain: 'M2 20l7-12 4 6 3-4 6 10zM9 8l1.6 2.6L12 10',
    tag: 'M3 12V4h8l10 10-8 8zM7.5 8.5a1 1 0 100-.01',
    instagram: 'M4 8a4 4 0 014-4h8a4 4 0 014 4v8a4 4 0 01-4 4H8a4 4 0 01-4-4zM12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM17 7h.01',
    facebook: 'M14 21v-8h3l.5-3.5H14V7.5c0-1 .4-1.8 1.9-1.8H18V2.6c-.4 0-1.6-.1-2.9-.1-2.8 0-4.6 1.7-4.6 4.8v2.7H7.5V13h3v8',
    x: 'M4 4l16 16M20 4L4 20',
    youtube: 'M3 8.5c0-2 1.3-3 3-3.2C8 5 10 5 12 5s4 0 6 .3c1.7.2 3 1.2 3 3.2v7c0 2-1.3 3-3 3.2-2 .3-4 .3-6 .3s-4 0-6-.3c-1.7-.2-3-1.2-3-3.2zM10 9v6l5-3z',
    linkedin: 'M4 9h4v11H4zM6 4.5a2 2 0 100 4 2 2 0 000-4zM11 9h3.8v1.6c.6-1 1.9-1.9 3.7-1.9 3 0 3.5 2 3.5 4.6V20h-4v-5.8c0-1.4 0-3-1.9-3s-2.1 1.5-2.1 3V20h-3z',
    chart: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8M20 16v-3',
    rupee: 'M7 4h10M7 8h10M7 4c4 0 6 1.5 6 4s-2 4-6 4l7 8',
    settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
    code: 'M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14',
    share: 'M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
    image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9a1 1 0 100-.01',
    layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
    list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
    chevron: 'M9 6l6 6-6 6',
    logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
    external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
};

export function Icon({ name, className = '', size = 20, label, filled = false }) {
    return (
        <svg {...base} fill={filled ? 'currentColor' : 'none'} width={size} height={size} className={className} aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}>
            <path d={paths[name]} />
        </svg>
    );
}
