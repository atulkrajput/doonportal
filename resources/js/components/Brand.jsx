import { Link } from 'react-router';

/** Arch + rising sun + mountains: the DoonPortal mark. */
export function LogoMark({ size = 36, className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden="true">
            <path d="M8 42V22a16 16 0 0 1 32 0v20" fill="none" stroke="#1b3461" strokeWidth="3.2" />
            <path d="M13.5 42V23a10.5 10.5 0 0 1 21 0v19" fill="none" stroke="#1b3461" strokeWidth="2.4" />
            <circle cx="24" cy="27" r="5" fill="#f07c1e" />
            <path d="M13.5 42l7-10 4.5 5.5 3.5-4.5 6 9z" fill="#1b3461" />
            <path d="M20.5 32l1.6 2.2 1.4-.8z" fill="#fff" />
            <path d="M7 45h34" stroke="#1b3461" strokeWidth="2.4" />
        </svg>
    );
}

export function Wordmark({ className = '', light = false }) {
    return (
        <span className={`font-sans font-bold lowercase tracking-tight ${className}`}>
            <span className={light ? 'text-white' : 'text-navy-700'}>doon</span>
            <span className="text-accent-500">portal</span>
        </span>
    );
}

export function Logo({ to = '/', light = false, tagline = false, label = 'DoonPortal home' }) {
    return (
        <Link to={to} className="flex shrink-0 items-center gap-2" aria-label={label}>
            {light ? (
                <span className="rounded-lg bg-cream p-0.5">
                    <LogoMark size={32} />
                </span>
            ) : (
                <LogoMark size={34} />
            )}
            <span className="flex flex-col leading-none">
                <Wordmark className="text-xl sm:text-2xl" light={light} />
                {tagline && (
                    <span className={`mt-1 hidden text-[0.55rem] font-semibold uppercase tracking-[0.18em] sm:block ${light ? 'text-navy-100' : 'text-navy-700'}`}>
                        Discover. Connect. Belong.
                    </span>
                )}
            </span>
        </Link>
    );
}

/**
 * Decorative Doon valley illustration (sky, snow peaks, town, clock tower).
 * Drawn shapes only — not a photo of a real place.
 */
export function DoonScene({ className = '' }) {
    return (
        <svg viewBox="0 0 600 520" className={className} role="img" aria-label="Illustration of the Doon valley with Himalayan peaks and a clock tower" preserveAspectRatio="xMidYMid slice">
            <defs>
                <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#3f73c4" />
                    <stop offset="0.6" stopColor="#8db4e6" />
                    <stop offset="1" stopColor="#d7e6f6" />
                </linearGradient>
                <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#5f7f9e" />
                    <stop offset="1" stopColor="#3e5a78" />
                </linearGradient>
                <linearGradient id="green" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#4f8a3c" />
                    <stop offset="1" stopColor="#2f5f2a" />
                </linearGradient>
            </defs>
            <rect width="600" height="520" fill="url(#sky)" />
            <g fill="#fff" opacity="0.85">
                <ellipse cx="420" cy="70" rx="90" ry="10" />
                <ellipse cx="500" cy="95" rx="60" ry="7" />
                <ellipse cx="170" cy="110" rx="70" ry="8" />
            </g>
            {/* Snow peaks */}
            <path d="M0 250 L70 190 L120 215 L190 140 L250 200 L320 120 L380 185 L440 130 L520 200 L600 160 V300 H0Z" fill="#9fb3c9" />
            <path d="M190 140 L210 165 L196 162 L180 175 L172 158Z M320 120 L345 150 L328 146 L312 162 L300 140Z M440 130 L462 158 L448 154 L432 168 L424 148Z" fill="#fff" />
            <path d="M0 300 L90 245 L170 280 L260 230 L360 270 L450 235 L600 280 V340 H0Z" fill="url(#hill)" />
            {/* Town */}
            <path d="M0 330 Q150 300 300 325 T600 320 V400 H0Z" fill="#c9b9a8" />
            <g fill="#e9e1d6">
                <rect x="40" y="320" width="26" height="16" />
                <rect x="90" y="314" width="20" height="18" />
                <rect x="150" y="318" width="30" height="14" />
                <rect x="210" y="322" width="22" height="14" />
                <rect x="470" y="316" width="28" height="16" />
                <rect x="530" y="320" width="24" height="14" />
            </g>
            {/* Trees */}
            <path d="M0 360 Q60 330 120 352 Q170 325 230 350 Q290 330 340 356 V520 H0Z" fill="url(#green)" />
            <path d="M420 360 Q480 335 540 352 Q575 340 600 348 V520 H400Z" fill="url(#green)" />
            {/* Clock tower */}
            <g>
                <rect x="345" y="210" width="62" height="310" fill="#a84f2e" />
                <rect x="338" y="200" width="76" height="14" fill="#efe7da" />
                <rect x="338" y="300" width="76" height="10" fill="#efe7da" />
                <rect x="338" y="400" width="76" height="10" fill="#efe7da" />
                <path d="M342 200 L376 120 L410 200Z" fill="#8f3b22" />
                <path d="M376 120 V96" stroke="#3b2a22" strokeWidth="3" />
                <circle cx="376" cy="245" r="20" fill="#fff" stroke="#3b2a22" strokeWidth="3" />
                <path d="M376 245 V231 M376 245 L386 250" stroke="#16213a" strokeWidth="2.5" strokeLinecap="round" />
                <g fill="#5a2a1a">
                    <rect x="362" y="320" width="8" height="60" rx="4" />
                    <rect x="382" y="320" width="8" height="60" rx="4" />
                    <rect x="362" y="425" width="8" height="60" rx="4" />
                    <rect x="382" y="425" width="8" height="60" rx="4" />
                </g>
            </g>
            <path d="M330 520 Q380 470 430 520Z" fill="#2f5f2a" />
        </svg>
    );
}
