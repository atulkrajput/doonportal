<?php

namespace Database\Seeders;

use App\Enums\PublicationStatus;
use App\Models\Page;
use App\Services\HtmlSanitizer;
use Illuminate\Database\Seeder;

/**
 * Starting text for the site's legal and information pages. Idempotent: an
 * existing page (by slug) is never overwritten, so staff edits are kept.
 *
 * The text describes what the code actually does (see docs/security-checklist.md).
 * Operator, contact and grievance details are {{tokens}} filled from
 * Admin → Legal details; nothing is invented. Have a lawyer review before launch.
 */
class SitePagesSeeder extends Seeder
{
    public function run(): void
    {
        $sanitizer = app(HtmlSanitizer::class);

        foreach ($this->pages() as $i => [$slug, $title, $summary, $body]) {
            if (Page::withTrashed()->where('slug', $slug)->exists()) {
                continue;
            }

            $page = new Page(['slug' => $slug, 'title' => $title, 'summary' => $summary, 'body' => $sanitizer->sanitize($body), 'sort_order' => $i]);
            $page->status = PublicationStatus::Published;
            $page->published_at = now();
            $page->save();
        }
    }

    /**
     * @return list<array{0: string, 1: string, 2: string, 3: string}>
     */
    private function pages(): array
    {
        return [
            ['about', 'About DoonPortal', 'DoonPortal is a local guide to Dehradun’s businesses, places, events, neighbourhoods and stories.', <<<'HTML'
<p>{{site_name}} is building a trusted, structured guide to Dehradun: local businesses, places to visit, events, neighbourhoods and stories.</p>
<h2>How we work</h2>
<ul>
<li><strong>Real information only.</strong> We never invent listings, reviews, opening hours or events. Sample listings used while the site is being built are clearly labelled “Demo data”.</li>
<li><strong>Verification is labelled.</strong> A “Verified” badge means our team checked the listing; everything else may be incomplete or out of date.</li>
<li><strong>Sources are shown.</strong> Where information comes from a public source, we say so on the page.</li>
</ul>
<h2>Who runs {{site_name}}</h2>
<p>{{site_name}} is operated by {{operator_name}}. See <a href="/contact">Contact</a> to reach us.</p>
HTML],

            ['contact', 'Contact us', 'How to reach the DoonPortal team, report a problem with a listing, or contact our grievance officer.', <<<'HTML'
<h2>General enquiries</h2>
<p>Email: {{contact_email}}<br>Phone: {{contact_phone}}</p>
<p>Postal address:<br>{{postal_address}}</p>
<h2>Business owners</h2>
<p>To add your business or claim an existing listing, visit <a href="/business-portal">List your business</a>.</p>
<h2>Report a problem</h2>
<p>If a listing is wrong, closed or inappropriate, email us with the page link and what needs to change.</p>
<h2>Grievance officer</h2>
<p>In line with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and the Digital Personal Data Protection Act, 2023, complaints can be sent to our grievance officer:</p>
<p>{{grievance_officer_name}}<br>Email: {{grievance_officer_email}}</p>
<p>We acknowledge complaints within 24 hours and aim to resolve them within 15 days.</p>
HTML],

            ['privacy', 'Privacy policy', 'What personal data DoonPortal collects, why, how long we keep it and your rights under Indian law.', <<<'HTML'
<p><strong>Last updated:</strong> {{last_updated}}</p>
<p>This policy explains how {{operator_name}} (“we”), which operates {{site_name}}, handles personal data. It is written to meet the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology Act, 2000 and rules made under it.</p>
<h2>1. What we collect</h2>
<ul>
<li><strong>Account details</strong> when you register: your name, email address and password (stored only as a secure hash). Optionally a phone number and a short bio.</li>
<li><strong>Sign-in token</strong>: after you sign in, a random token is kept in your browser’s local storage so you stay signed in. It is deleted when you sign out and expires after 30 days.</li>
<li><strong>Usage statistics</strong>: which pages and listings are viewed, which buttons (for example “Call” or “Directions”) are used, and search terms. These records are linked to a daily-changing anonymous code calculated from your network address and browser type; we do not store your IP address or browser details with them. If you are signed in, the event is linked to your account.</li>
<li><strong>Messages you send us</strong>, for example corrections or complaints.</li>
<li><strong>Optional third-party tools</strong>, only if you agree to them in the cookie banner (see our <a href="/cookies">Cookie policy</a>).</li>
</ul>
<h2>2. Why we use it</h2>
<ul>
<li>To provide your account and the features you use (purpose: providing the service you asked for).</li>
<li>To keep the site secure, prevent abuse and investigate misuse.</li>
<li>To understand which parts of the site are useful and improve them, using the anonymous statistics above.</li>
<li>To send you emails you request, such as password resets.</li>
</ul>
<p>We do not sell personal data, and we do not use it for automated decisions with legal effects.</p>
<h2>3. Who we share it with</h2>
<ul>
<li>Service providers who host the site and send emails for us, under contract and only to run the service.</li>
<li>Third-party analytics or advertising tools, only with your consent: {{optional_tools}}</li>
<li>Authorities, when required by Indian law.</li>
</ul>
<h2>4. How long we keep it</h2>
<p>Account data is kept while your account exists and deleted or anonymised after you close it, except where the law requires us to keep records longer. Anonymous usage statistics are kept to see trends over time. Security logs of staff actions are kept to protect the integrity of the site.</p>
<h2>5. Your rights</h2>
<p>Under the DPDP Act you can ask us to: access a summary of your personal data and how it is used; correct, complete or update it; erase it; withdraw consent you have given (for example through <em>Cookie settings</em> in the site footer); and nominate another person to exercise your rights if you die or become incapable. You can also raise a grievance with us, and if unresolved, with the Data Protection Board of India.</p>
<p>Write to {{contact_email}} or to our grievance officer, {{grievance_officer_name}} ({{grievance_officer_email}}).</p>
<h2>6. Children</h2>
<p>{{site_name}} is not intended for children under 18 to create accounts. We do not knowingly process children’s data for tracking or targeted advertising.</p>
<h2>7. Security</h2>
<p>Passwords are hashed, connections are encrypted in production, staff access is limited by role and every administrative change is logged. No system is perfectly secure; tell us at once if you suspect a problem.</p>
<h2>8. Changes</h2>
<p>We will post updates here and change the date above. Significant changes will be highlighted on the site.</p>
HTML],

            ['terms', 'Terms of use', 'The rules for using DoonPortal, including accounts, listings and liability.', <<<'HTML'
<p><strong>Last updated:</strong> {{last_updated}}</p>
<p>These terms apply to your use of {{site_name}}, operated by {{operator_name}}. By using the site you agree to them.</p>
<h2>1. The service</h2>
<p>{{site_name}} is a guide to businesses, places, events and stories in and around Dehradun. Listings may be incomplete or out of date: always confirm important details such as timings, prices and availability directly with the business or organiser. Listings marked “Demo data” are fictional examples.</p>
<h2>2. Accounts</h2>
<p>You must give accurate details, keep your password safe and be at least 18 years old to create an account. You are responsible for activity on your account. We may suspend accounts that break these terms.</p>
<h2>3. Content you submit</h2>
<p>When features such as reviews, photos, corrections or business listings are available, you keep ownership of what you submit but allow us to display, edit for length or format, and distribute it on {{site_name}}. Your content must be honest, based on your own experience and follow our <a href="/community-guidelines">Community guidelines</a>. We may remove content that does not.</p>
<h2>4. Business listings and paid plans</h2>
<p>Business owners must have authority to manage the business they claim. Paid listing plans are described at the time of purchase; featured placement does not mean we endorse a business.</p>
<h2>5. Acceptable use</h2>
<p>Do not misuse the site: no scraping or automated access beyond normal browsing, no attempts to break security, no unlawful, misleading, defamatory, obscene or infringing content, and no impersonation.</p>
<h2>6. Intellectual property</h2>
<p>The {{site_name}} name, logo, design and original editorial content belong to {{operator_name}} or its licensors. Business names and logos belong to their owners.</p>
<h2>7. Liability</h2>
<p>The site is provided “as is”. To the extent the law allows, we are not liable for losses arising from reliance on listings, events or third-party websites linked from {{site_name}}. Nothing in these terms limits rights you have under the Consumer Protection Act, 2019 or other law that cannot be excluded.</p>
<h2>8. Complaints</h2>
<p>Contact our grievance officer, {{grievance_officer_name}} ({{grievance_officer_email}}). See <a href="/contact">Contact</a>.</p>
<h2>9. Law and courts</h2>
<p>These terms are governed by the laws of India. Courts at {{jurisdiction_city}}, Uttarakhand have jurisdiction, subject to any rights you have to bring proceedings where you live.</p>
<h2>10. Changes</h2>
<p>We may update these terms; the date above shows the latest version. Continuing to use the site after a change means you accept it.</p>
HTML],

            ['cookies', 'Cookie policy', 'Which cookies and similar technologies DoonPortal uses and how to change your choices.', <<<'HTML'
<p><strong>Last updated:</strong> {{last_updated}}</p>
<p>Cookies and similar technologies (such as your browser’s local storage) let a website remember information on your device. This page explains what {{site_name}} uses. You can change your choices at any time with <em>Cookie settings</em> in the site footer.</p>
<h2>Strictly necessary (always on)</h2>
<ul>
<li><strong>Sign-in token</strong> (local storage, until you sign out or for up to 30 days): keeps you signed in.</li>
<li><strong>Your cookie choices</strong> (local storage, 12 months): remembers what you agreed to so we do not ask on every page.</li>
<li><strong>Interface preferences</strong> (local storage): for example which admin menu sections are open, for staff.</li>
</ul>
<h2>Our own statistics (no cookies)</h2>
<p>We count page views, searches and button clicks on our own servers without setting cookies. Records use a code that changes every day and do not contain your IP address. See the <a href="/privacy">Privacy policy</a>.</p>
<h2>Optional third-party tools (only with your consent)</h2>
<p>These load only if you choose “Accept” for their category in the cookie banner. They may set their own cookies and receive your IP address under their own privacy policies.</p>
{{optional_tools}}
<h2>Managing cookies</h2>
<p>Use <em>Cookie settings</em> in the footer to accept or reject optional tools; rejecting removes them on the next page load. You can also delete cookies and site data in your browser settings.</p>
HTML],

            ['disclaimer', 'Disclaimer', 'Information on DoonPortal is provided in good faith; please confirm details before you rely on them.', <<<'HTML'
<p>Information on {{site_name}} is collected from businesses, organisers, public sources and our own visits, and is provided in good faith. Details such as opening hours, prices, entry fees, event dates and contact numbers can change without notice.</p>
<ul>
<li>Please confirm important details directly before you travel or pay.</li>
<li>A “Verified” badge means our team checked the listing on the date shown; it is not a guarantee of quality or a recommendation.</li>
<li>Featured or sponsored placements are paid and labelled; they are not endorsements.</li>
<li>Links to other websites are provided for convenience; we are not responsible for their content.</li>
<li>Listings marked “Demo data” are fictional examples used while the site is being built.</li>
</ul>
<p>Spotted something wrong? <a href="/contact">Tell us</a> and we will correct it.</p>
HTML],

            ['community-guidelines', 'Community guidelines', 'What is and is not allowed in reviews, photos, corrections and other content shared on DoonPortal.', <<<'HTML'
<p>{{site_name}} works because locals share honest, useful information. When reviews, photos and corrections are open, please follow these rules.</p>
<h2>Do</h2>
<ul>
<li>Write about your own, first-hand experience.</li>
<li>Be specific and fair, and update your review if things change.</li>
<li>Share photos you took yourself.</li>
</ul>
<h2>Don’t</h2>
<ul>
<li>Post fake, paid or incentivised reviews, or review your own business or a competitor.</li>
<li>Share personal information about others, or hateful, abusive, obscene or threatening content.</li>
<li>Post spam, advertising, or content you do not have the rights to.</li>
<li>Post anything unlawful under Indian law.</li>
</ul>
<h2>Moderation</h2>
<p>Our moderators may hold, edit for format or remove content that breaks these rules, and suspend repeat offenders. To report content, use the report option on the page or <a href="/contact">contact us</a>.</p>
HTML],
        ];
    }
}
