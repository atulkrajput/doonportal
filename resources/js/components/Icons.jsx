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
};

export function Icon({ name, className = '', size = 20, label }) {
    return (
        <svg {...base} width={size} height={size} className={className} aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}>
            <path d={paths[name]} />
        </svg>
    );
}
