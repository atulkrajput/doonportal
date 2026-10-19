/**
 * Public site settings rendered by the server into <script id="site-config">
 * (site name and official social profiles from Admin → Social media).
 */
let cached;

export function siteConfig() {
    if (cached === undefined) {
        try {
            cached = JSON.parse(document.getElementById('site-config')?.textContent || '{}');
        } catch {
            cached = {};
        }
    }
    return cached;
}

export const SOCIAL_PROFILES = [
    ['instagram_url', 'Instagram', 'instagram'],
    ['facebook_url', 'Facebook', 'facebook'],
    ['x_url', 'X', 'x'],
    ['youtube_url', 'YouTube', 'youtube'],
    ['linkedin_url', 'LinkedIn', 'linkedin'],
    ['whatsapp_url', 'WhatsApp', 'chat'],
];
