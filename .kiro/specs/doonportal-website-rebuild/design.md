# Design Document: DoonPortal Website Rebuild

## Overview

This design describes the complete rebuild of the DoonPortal website as a modern SaaS-style marketing and lead generation site. The new site replaces a legacy PHP/WordPress site (preserved read-only in `Old-Web/`) with a Next.js 14 App Router application using React, TypeScript, TailwindCSS, and Framer Motion.

The website serves as the primary digital presence for DoonPortal, an automation software company with 15+ years of experience building platforms for schools, retail businesses, and dairy farms. The site must:

- Showcase three core products (School Management, Inventory POS, Dairy Management)
- Offer custom automation services
- Convert visitors into leads via demo request and contact forms
- Achieve Lighthouse performance scores ≥ 90
- Meet WCAG 2.1 AA accessibility standards

The visual style targets modern SaaS aesthetics inspired by Stripe, Notion, Linear, and Vercel — minimal, professional, with micro-animations.

## Architecture

### Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 14 (App Router) | SSG/SSR, file-based routing, image optimization, SEO |
| UI | React 18 + TypeScript | Type safety, component model |
| Styling | TailwindCSS 3 | Utility-first, co-located styles, design consistency |
| Animation | Framer Motion 11 | Declarative animations, scroll-triggered reveals, page transitions |
| Forms | React Hook Form + Zod | Lightweight validation, type-safe schemas |
| Email | Resend or Nodemailer | Transactional email for lead notifications |
| Blog | MDX (local files) or headless CMS | Static blog content with rich formatting |
| Deployment | Vercel | Native Next.js hosting, edge functions, analytics |

### Routing Structure (App Router)

```
src/app/
├── layout.tsx              # Root layout (Navbar + Footer)
├── page.tsx                # Homepage
├── solutions/
│   └── page.tsx            # Solutions overview
├── products/
│   ├── school-management/
│   │   └── page.tsx        # School Management product page
│   ├── inventory-pos/
│   │   └── page.tsx        # Inventory POS product page
│   └── dairy-management/
│       └── page.tsx        # Dairy Management product page
├── custom-automation/
│   └── page.tsx            # Custom Automation services
├── about/
│   └── page.tsx            # About page
├── blog/
│   ├── page.tsx            # Blog listing
│   └── [slug]/
│       └── page.tsx        # Individual blog post
├── contact/
│   └── page.tsx            # Contact page
├── book-demo/
│   └── page.tsx            # Book Demo / Lead form
├── sitemap.ts              # Dynamic sitemap generation
└── robots.ts               # Robots.txt generation
```

### Rendering Strategy

| Page | Strategy | Rationale |
|------|----------|-----------|
| Homepage, Solutions, Products, About, Custom Automation | SSG (Static) | Content is static, maximum performance |
| Blog listing | SSG with ISR (revalidate: 3600) | New posts appear within 1 hour |
| Blog post `[slug]` | SSG with `generateStaticParams` | Pre-render all posts at build |
| Contact, Book Demo | SSG (form submission via API route) | Static shell, client-side form |
| API routes (`/api/contact`, `/api/demo`) | Server-side | Handle form submissions |


### Directory Structure

```
project-root/
├── Old-Web/                    # READ-ONLY legacy site (never modify)
├── docs/                       # All documentation files
├── src/
│   ├── app/                    # Next.js App Router pages + API routes
│   │   └── api/
│   │       ├── contact/route.ts
│   │       └── demo/route.ts
│   ├── components/
│   │   ├── layouts/            # Layout components (Navbar, Footer, PageLayout)
│   │   ├── sections/           # Page section components (HeroSection, FeatureGrid, CTASection, etc.)
│   │   ├── ui/                 # Atomic UI components (Button, Card, Input, Badge)
│   │   └── forms/              # Form components (DemoForm, ContactForm)
│   ├── data/                   # Static content data (products, features, blog metadata)
│   ├── lib/                    # Utility functions (validation, email, SEO helpers)
│   ├── types/                  # TypeScript type definitions
│   └── styles/                 # Global styles (tailwind base, fonts)
├── public/
│   ├── images/                 # Product screenshots, icons, hero images
│   ├── fonts/                  # Self-hosted fonts
│   ├── doonportal.png          # Logo (copied from Old-Web reference)
│   └── favicon.ico             # Favicon (copied from Old-Web reference)
├── content/
│   └── blog/                   # MDX blog post files
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

### Architecture Diagram

```mermaid
graph TB
    subgraph "Client Browser"
        V[Visitor]
    end

    subgraph "Next.js Application"
        subgraph "App Router (SSG)"
            HP[Homepage]
            SP[Solutions Page]
            PP[Product Pages x3]
            CA[Custom Automation]
            AP[About Page]
            BP[Blog Pages]
            CP[Contact Page]
            DP[Book Demo Page]
        end

        subgraph "Shared Layout"
            NB[Navbar]
            FT[Footer]
        end

        subgraph "API Routes"
            API_C[/api/contact]
            API_D[/api/demo]
        end

        subgraph "Reusable Components"
            HS[HeroSection]
            FG[FeatureGrid]
            PC[ProductCard]
            CTA[CTASection]
            DF[DemoForm]
            CF[ContactForm]
        end
    end

    subgraph "External Services"
        EM[Email Service - Resend]
    end

    V --> NB
    NB --> HP & SP & PP & CA & AP & BP & CP & DP
    HP --> HS & PC & CTA
    PP --> HS & FG & CTA
    DP --> DF
    CP --> CF
    DF --> API_D
    CF --> API_C
    API_D --> EM
    API_C --> EM
```

## Components and Interfaces

### Layout Components

#### `Navbar`
```typescript
interface NavbarProps {
  logo: { src: string; alt: string };
  links: NavLink[];
  ctaButton: { label: string; href: string };
}

interface NavLink {
  label: string;
  href: string;
  children?: NavLink[]; // For dropdown menus (Solutions submenu)
}
```
- Fixed position (`sticky top-0 z-50`)
- Transparent → solid background on scroll (using `useScroll` from Framer Motion)
- Mobile hamburger menu at `< 768px` with animated drawer overlay
- Keyboard navigable (Tab, Enter, Escape to close mobile menu)

#### `Footer`
```typescript
interface FooterProps {
  companyInfo: { name: string; description: string; logo: string };
  linkGroups: { title: string; links: NavLink[] }[];
  contactInfo: { email: string; phone: string; address: string };
  socialLinks: { platform: string; url: string; icon: string }[];
}
```

#### `PageLayout`
```typescript
interface PageLayoutProps {
  children: React.ReactNode;
  seo: SEOMetadata;
}
```
Wraps every page with Navbar, Footer, and SEO metadata injection.

### Section Components

#### `HeroSection`
```typescript
interface HeroSectionProps {
  headline: string;
  subheadline: string;
  ctaButtons: { label: string; href: string; variant: 'primary' | 'secondary' }[];
  backgroundVariant?: 'gradient' | 'image' | 'pattern';
  image?: { src: string; alt: string };
}
```
- Framer Motion fade-in + slide-up animation on mount
- Responsive: stacked layout on mobile, side-by-side on desktop

#### `FeatureGrid`
```typescript
interface FeatureGridProps {
  features: Feature[];
  columns?: 2 | 3 | 4;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}
```
- Scroll-triggered staggered reveal animation
- Responsive grid: 1 col mobile → 2 col tablet → 3-4 col desktop

#### `ProductCard`
```typescript
interface ProductCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  features?: string[];
}
```
- Hover: subtle scale + shadow elevation via Framer Motion
- Links to product detail page

#### `CTASection`
```typescript
interface CTASectionProps {
  headline: string;
  subheadline?: string;
  ctaButton: { label: string; href: string };
  variant?: 'default' | 'dark' | 'gradient';
}
```

#### `DemoForm`
```typescript
interface DemoFormProps {
  onSubmit: (data: DemoFormData) => Promise<void>;
  productContext?: string; // Pre-fill context when coming from a product page
}
```

#### `ContactForm`
```typescript
interface ContactFormProps {
  onSubmit: (data: ContactFormData) => Promise<void>;
}
```

### UI Components

#### `Button`
```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;       // Renders as <Link> if provided
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  ariaLabel?: string;
}
```

#### `Card`
```typescript
interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  className?: string;
}
```

#### `Input`
```typescript
interface InputProps {
  label: string;
  name: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  required?: boolean;
  error?: string;
  placeholder?: string;
}
```
- Visible `<label>` with `htmlFor` attribute
- Inline error message display
- Focus ring styling for accessibility


## Data Models

### Lead (Demo Request)

```typescript
interface DemoFormData {
  name: string;           // Required
  organization: string;   // Required
  city: string;           // Optional
  phone: string;          // Required, numeric, min 10 digits
  email: string;          // Required, valid email format
  message: string;        // Optional
}
```

Validation schema (Zod):
```typescript
const demoFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  organization: z.string().min(1, 'Organization is required'),
  city: z.string().optional(),
  phone: z.string()
    .regex(/^\d+$/, 'Phone must contain only digits')
    .min(10, 'Phone must be at least 10 digits'),
  email: z.string().email('Invalid email format'),
  message: z.string().optional(),
});
```

### Contact Form

```typescript
interface ContactFormData {
  name: string;    // Required
  email: string;   // Required, valid email format
  phone: string;   // Optional
  message: string; // Required
}
```

Validation schema (Zod):
```typescript
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
});
```

### Product Data

```typescript
interface Product {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  heroImage: string;
  problems: { title: string; description: string }[];
  solution: { title: string; description: string };
  features: Feature[];
  screenshots: { src: string; alt: string; caption?: string }[];
  benefits: { title: string; description: string }[];
  seo: SEOMetadata;
}
```

### Blog Post

```typescript
interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;           // ISO 8601
  featuredImage: string;
  content: string;         // MDX content
  tags?: string[];
}
```

### SEO Metadata

```typescript
interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  jsonLd?: Record<string, unknown>[]; // JSON-LD structured data
}
```

### Navigation Data

```typescript
interface SiteNavigation {
  logo: { src: string; alt: string };
  mainLinks: NavLink[];
  ctaButton: { label: string; href: string };
  footerLinkGroups: { title: string; links: NavLink[] }[];
  socialLinks: { platform: string; url: string; icon: string }[];
  contactInfo: { email: string; phone: string; address: string };
}
```

### Static Content Data Strategy

All product data, navigation data, and page content are stored as typed TypeScript objects in `src/data/`:

```
src/data/
├── products.ts        # Product definitions for all 3 products
├── navigation.ts      # Navbar links, footer links, social links
├── homepage.ts        # Homepage section content
├── about.ts           # About page content
├── seo.ts             # Per-page SEO metadata
└── custom-automation.ts # Custom automation page content
```

This approach avoids a database or CMS dependency for the initial build while keeping content easily editable and type-safe.

### SEO Implementation

Each page exports metadata using Next.js `generateMetadata`:

```typescript
// Example: src/app/products/school-management/page.tsx
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'School Management System | DoonPortal',
    description: 'Complete school ERP with student management, attendance, fees, exams, and parent app.',
    keywords: ['school management software', 'school ERP', 'student management system'],
    openGraph: { /* ... */ },
  };
}
```

JSON-LD structured data is injected via a `<script type="application/ld+json">` tag in each page's layout:

- **Organization** schema on Homepage and About
- **Product** schema on each product page
- **BreadcrumbList** schema on all inner pages
- **BlogPosting** schema on blog post pages

### Sitemap and Robots

Next.js App Router native `sitemap.ts` and `robots.ts` files generate these automatically at build time, listing all public routes.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: ProductCard links to correct detail page

*For any* ProductCard rendered with a product slug, the card's link href should equal `/products/{slug}`, ensuring visitors always navigate to the correct product detail page.

**Validates: Requirements 3.5, 8.4**

### Property 2: FeatureGrid renders all product features

*For any* product data object containing a list of features, the FeatureGrid component should render exactly one item for each feature in the list, with the feature's title and description visible in the output.

**Validates: Requirements 4.4, 5.4, 6.4**

### Property 3: Blog content renders all required fields

*For any* blog post object with title, excerpt, author, date, and featured image, the rendered blog card should contain the title, excerpt, date, and image, and the rendered blog post page should contain the title, author, date, and body text.

**Validates: Requirements 10.1, 10.3**

### Property 4: Blog card links to correct post

*For any* blog post with a given slug, the blog card's link href should equal `/blog/{slug}`.

**Validates: Requirements 10.2**

### Property 5: Form validation rejects invalid required fields with inline errors

*For any* combination of missing or invalid required fields submitted to the Demo Form or Contact Form, the form should display an inline error message for each invalid field and should not clear the existing form values.

**Validates: Requirements 11.4, 12.5**

### Property 6: Demo form field validation

*For any* string input, the email validation should accept strings matching standard email format and reject all others. The phone validation should accept strings of 10 or more numeric digits and reject strings containing non-digit characters or fewer than 10 digits.

**Validates: Requirements 12.6, 12.7**

### Property 7: Unique meta title and description per page

*For any* two distinct pages in the site, their meta title values should differ and their meta description values should differ.

**Validates: Requirements 14.1**

### Property 8: Single H1 per page

*For any* page in the site, the rendered HTML should contain exactly one `<h1>` element.

**Validates: Requirements 14.2**

### Property 9: Target keywords in product page metadata

*For any* product page, the meta title or meta description or page content should contain at least one of the target keywords associated with that product (e.g., "school management software" for the School Management page).

**Validates: Requirements 14.4**

### Property 10: Sitemap contains all public routes

*For any* public route defined in the application routing structure, the generated sitemap.xml should contain a URL entry for that route.

**Validates: Requirements 14.5**

### Property 11: Semantic HTML structure

*For any* page in the site, the rendered HTML should contain `<main>`, `<nav>`, and `<footer>` semantic elements.

**Validates: Requirements 14.7**

### Property 12: All images have appropriate alt text

*For any* image rendered on the site, informational images should have a non-empty `alt` attribute, and decorative images should have an empty `alt` attribute (`alt=""`).

**Validates: Requirements 16.5**

### Property 13: Form fields have associated labels

*For any* input field in the Demo Form or Contact Form, there should be a visible `<label>` element with a `htmlFor` attribute matching the input's `id`.

**Validates: Requirements 16.6**

### Property 14: Reusable components render different prop values

*For any* two distinct sets of valid props passed to a reusable component (HeroSection, FeatureGrid, ProductCard, CTASection), the rendered output should reflect the different prop values in its content.

**Validates: Requirements 17.2**

## Error Handling

### Form Submission Errors

| Scenario | Handling |
|----------|----------|
| Client-side validation failure | Display inline error messages per field. Do not clear form. Do not submit to API. |
| API route returns 4xx | Display user-friendly error message: "Something went wrong. Please try again." |
| API route returns 5xx | Display error message with retry suggestion. Log error server-side. |
| Email service failure | API returns 500. Log error. Queue for retry if possible. Display generic error to user. |
| Network timeout | Client-side catch. Display "Network error. Please check your connection." |

### Image Loading Errors

- Use Next.js Image `onError` callback to display a placeholder/fallback image
- Log broken image URLs in development

### Blog Content Errors

- If MDX parsing fails, display a fallback "Content unavailable" message
- If blog post slug doesn't match any content, return Next.js `notFound()` for proper 404

### Navigation Errors

- Invalid routes handled by Next.js `not-found.tsx` custom 404 page
- Broken anchor links: validate all internal links at build time via a link-checking script

### General Error Boundary

- Implement a React Error Boundary component wrapping the root layout
- Display a friendly error page with a "Return to Home" link
- Log errors to console in development; to an error tracking service in production

## Testing Strategy

### Testing Stack

| Tool | Purpose |
|------|---------|
| Vitest | Unit test runner (fast, Vite-native) |
| React Testing Library | Component rendering and interaction testing |
| fast-check | Property-based testing library for TypeScript |
| Playwright | End-to-end testing for critical user flows |

### Unit Tests (Vitest + React Testing Library)

Focus on specific examples, edge cases, and integration points:

- **Component rendering**: Verify each reusable component renders correctly with sample props
- **Form submission flow**: Test valid submission shows success, invalid shows errors
- **Navigation**: Verify Navbar renders all expected links, mobile menu toggles
- **Blog pagination**: Verify pagination appears when posts > 9
- **SEO metadata**: Verify JSON-LD script tags render on correct pages
- **Edge cases**: Empty blog list, missing product data, form with all fields empty

### Property-Based Tests (fast-check)

Each correctness property from the design is implemented as a single property-based test with minimum 100 iterations. Tests are tagged with the property reference.

```typescript
// Example: Property 6 — Demo form field validation
// Feature: doonportal-website-rebuild, Property 6: Demo form field validation
test.prop('email validation accepts valid emails and rejects invalid ones', [fc.emailAddress()], (email) => {
  expect(demoFormSchema.shape.email.safeParse(email).success).toBe(true);
});
```

Property test mapping:
- **Property 1**: Generate random product slugs → verify ProductCard href
- **Property 2**: Generate random feature arrays → verify FeatureGrid renders all
- **Property 3**: Generate random blog post objects → verify rendered output contains all fields
- **Property 4**: Generate random blog slugs → verify card href
- **Property 5**: Generate random invalid form submissions → verify error messages appear per field
- **Property 6**: Generate random strings → verify email/phone validation correctness
- **Property 7**: Collect all page metadata → verify uniqueness
- **Property 8**: Render each page → verify single H1
- **Property 9**: Generate product page metadata → verify keyword presence
- **Property 10**: Collect all routes → verify sitemap inclusion
- **Property 11**: Render each page → verify semantic elements
- **Property 12**: Render pages with images → verify alt attributes
- **Property 13**: Render forms → verify label-input association
- **Property 14**: Generate different prop sets → verify output differs

### End-to-End Tests (Playwright)

Critical user flows:
1. Homepage → click product card → arrive at product page → click "Request Demo" → arrive at demo form
2. Fill and submit demo form with valid data → see success message
3. Fill demo form with invalid data → see inline errors, form not cleared
4. Navigate all pages via Navbar links
5. Mobile: open hamburger menu → navigate to a page
6. Blog listing → click post → see full article

### Test Organization

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── components/       # Component unit tests
│   │   ├── validation/       # Schema validation tests
│   │   └── data/             # Data integrity tests
│   ├── property/
│   │   ├── form-validation.property.test.ts
│   │   ├── component-rendering.property.test.ts
│   │   ├── seo.property.test.ts
│   │   └── navigation.property.test.ts
│   └── e2e/
│       ├── demo-flow.spec.ts
│       ├── navigation.spec.ts
│       └── blog.spec.ts
```

### CI Integration

- Run unit + property tests on every PR
- Run e2e tests on merge to main
- Run Lighthouse CI on deployment preview
- Property tests configured for 100 iterations in CI, 1000 in nightly runs
