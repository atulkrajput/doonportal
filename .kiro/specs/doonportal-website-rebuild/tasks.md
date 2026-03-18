# Tasks: DoonPortal Website Rebuild

## Task 1: Project Setup and Configuration
- [x] 1.1 Initialize Next.js 14 project with App Router, TypeScript, TailwindCSS, and ESLint in the project root (outside Old-Web/)
- [x] 1.2 Configure tailwind.config.ts with brand colors, typography, spacing, and responsive breakpoints
- [x] 1.3 Create directory structure: src/components/{layouts,sections,ui,forms}, src/data, src/lib, src/types, src/styles, content/blog
- [x] 1.4 Install dependencies: framer-motion, react-hook-form, zod, @hookform/resolvers
- [x] 1.5 Set up global styles (fonts, base TailwindCSS layers) in src/styles/globals.css
- [x] 1.6 Copy logo (doonportal.png) and favicon (favicon.ico) from Old-Web/ to public/
- [x] 1.7 Configure next.config.ts with image optimization settings and any required redirects

## Task 2: TypeScript Types and Data Models
- [x] 2.1 Create src/types/index.ts with all shared interfaces: Product, Feature, BlogPost, SEOMetadata, NavLink, DemoFormData, ContactFormData
- [x] 2.2 Create src/lib/validation.ts with Zod schemas for DemoFormData and ContactFormData
- [x] 2.3 Create src/data/navigation.ts with navbar links, footer link groups, social links, and contact info
- [x] 2.4 Create src/data/products.ts with full product data for School Management, Inventory POS, and Dairy Management
- [x] 2.5 Create src/data/homepage.ts with homepage section content (industries, differentiators, founder info)
- [x] 2.6 Create src/data/about.ts with about page content (mission, vision, history, values, team)
- [x] 2.7 Create src/data/custom-automation.ts with custom automation page content (services, process)
- [x] 2.8 Create src/data/seo.ts with per-page SEO metadata including target keywords and JSON-LD templates

## Task 3: UI Base Components
- [x] 3.1 Create src/components/ui/Button.tsx with variants (primary, secondary, outline, ghost), sizes, Link support, and aria-label prop
- [x] 3.2 Create src/components/ui/Card.tsx with optional hover animation and className passthrough
- [x] 3.3 Create src/components/ui/Input.tsx with label, error display, required indicator, and htmlFor association
- [x] 3.4 Create src/components/ui/Badge.tsx for tags and category labels
- [x] 3.5 Create src/components/ui/SectionWrapper.tsx for consistent section padding, max-width, and semantic HTML (section element)

## Task 4: Layout Components (Navbar, Footer, PageLayout)
- [x] 4.1 Create src/components/layouts/Navbar.tsx with fixed positioning, logo, nav links, "Book Demo" CTA button, and scroll-triggered background transition
- [x] 4.2 Implement mobile hamburger menu in Navbar with animated drawer overlay, keyboard navigation (Tab, Enter, Escape to close)
- [x] 4.3 Create src/components/layouts/Footer.tsx with company info, link groups, contact details, and social media links
- [x] 4.4 Create src/app/layout.tsx as root layout rendering Navbar and Footer on every page
- [x] 4.5 Create src/components/layouts/PageLayout.tsx wrapper for per-page SEO metadata injection

## Task 5: Section Components
- [x] 5.1 Create src/components/sections/HeroSection.tsx with headline, subheadline, CTA buttons, background variants, and Framer Motion fade-in/slide-up animation
- [x] 5.2 Create src/components/sections/FeatureGrid.tsx with responsive grid (1→2→3-4 columns), scroll-triggered staggered reveal animation
- [x] 5.3 Create src/components/sections/ProductCard.tsx with icon, title, description, link, and hover scale/shadow animation
- [x] 5.4 Create src/components/sections/CTASection.tsx with headline, subheadline, CTA button, and variant styling (default, dark, gradient)
- [x] 5.5 Create src/components/sections/IndustrySection.tsx for homepage industries display
- [x] 5.6 Create src/components/sections/FounderSection.tsx for homepage founder information
- [x] 5.7 Create src/components/sections/ProblemsSection.tsx for product page problem descriptions
- [x] 5.8 Create src/components/sections/SolutionSection.tsx for product page solution descriptions
- [x] 5.9 Create src/components/sections/BenefitsSection.tsx for product page benefits
- [x] 5.10 Create src/components/sections/ScreenshotsSection.tsx for product page screenshots using Next.js Image component

## Task 6: Form Components and API Routes
- [x] 6.1 Create src/components/forms/DemoForm.tsx with react-hook-form, Zod validation, all 6 fields, required indicators, inline error messages, and success state
- [x] 6.2 Create src/components/forms/ContactForm.tsx with react-hook-form, Zod validation, 4 fields, inline error messages, and success state
- [x] 6.3 Create src/app/api/demo/route.ts API route to validate and process demo form submissions and send email notification
- [x] 6.4 Create src/app/api/contact/route.ts API route to validate and process contact form submissions
- [x] 6.5 Create src/lib/email.ts utility for sending email notifications (Resend or Nodemailer)

## Task 7: Homepage
- [x] 7.1 Create src/app/page.tsx with HeroSection (value proposition headline, subheadline, "Explore Solutions" and "Book a Demo" CTAs)
- [x] 7.2 Add Products Section with three ProductCard components linking to respective product pages
- [x] 7.3 Add Industries Section highlighting Education, Retail, Agriculture, and Small Businesses
- [x] 7.4 Add "Why Choose DoonPortal" section with differentiators
- [x] 7.5 Add Founder Section with founder information
- [x] 7.6 Add CTA Section prompting demo booking or contact
- [x] 7.7 Add generateMetadata export with homepage SEO metadata and Organization JSON-LD

## Task 8: Product Pages
- [x] 8.1 Create src/app/products/school-management/page.tsx with HeroSection, ProblemsSection, SolutionSection, FeatureGrid, ScreenshotsSection, BenefitsSection, and CTASection
- [x] 8.2 Create src/app/products/inventory-pos/page.tsx with same structure using Inventory POS product data
- [x] 8.3 Create src/app/products/dairy-management/page.tsx with same structure using Dairy Management product data
- [x] 8.4 Add generateMetadata exports with Product JSON-LD and BreadcrumbList JSON-LD on each product page
- [x] 8.5 Ensure target keywords ("school management software", "inventory POS software", "dairy management software") appear in meta tags and page content

## Task 9: Solutions, Custom Automation, and About Pages
- [x] 9.1 Create src/app/solutions/page.tsx with overview section, three ProductCards, Custom Automation section with link, and BreadcrumbList JSON-LD
- [x] 9.2 Create src/app/custom-automation/page.tsx with HeroSection, services list, process/workflow section, and CTASection
- [x] 9.3 Create src/app/about/page.tsx with mission/vision, history, founder/team info, values, CTASection, and Organization JSON-LD

## Task 10: Blog Pages
- [x] 10.1 Create content/blog/ directory with sample MDX blog posts (at least 2-3 sample posts)
- [x] 10.2 Create src/lib/blog.ts utility to read and parse MDX blog posts with frontmatter
- [x] 10.3 Create src/app/blog/page.tsx with blog post card listing (title, excerpt, date, image) and pagination when posts > 9
- [x] 10.4 Create src/app/blog/[slug]/page.tsx with full article rendering (title, author, date, body) and BlogPosting JSON-LD
- [x] 10.5 Add generateStaticParams to pre-render all blog post pages at build time

## Task 11: Contact and Book Demo Pages
- [x] 11.1 Create src/app/contact/page.tsx with ContactForm and company contact information display
- [x] 11.2 Create src/app/book-demo/page.tsx with DemoForm and optional product context pre-fill

## Task 12: SEO, Sitemap, and Accessibility
- [x] 12.1 Create src/app/sitemap.ts to generate sitemap.xml with all public routes
- [x] 12.2 Create src/app/robots.ts to generate robots.txt allowing crawling of all public pages
- [x] 12.3 Verify all pages have unique meta title and description via generateMetadata
- [x] 12.4 Verify structured heading hierarchy (single H1 per page) across all pages
- [x] 12.5 Add JSON-LD Schema_Markup: Organization (homepage, about), Product (product pages), BreadcrumbList (inner pages), BlogPosting (blog posts)
- [x] 12.6 Audit all interactive elements for keyboard navigation (Tab, Enter, Escape)
- [x] 12.7 Add visible focus indicators (focus-visible ring styles) to all interactive elements
- [x] 12.8 Verify all images use Next.js Image component with appropriate alt text

## Task 13: Performance and Animations
- [x] 13.1 Configure Framer Motion page transitions in root layout (AnimatePresence wrapper)
- [x] 13.2 Add scroll-triggered reveal animations to section components using Framer Motion useInView
- [x] 13.3 Add hover micro-animations to ProductCard, Button, and Card components
- [x] 13.4 Preload critical fonts and above-the-fold assets in root layout head
- [x] 13.5 Verify Lighthouse performance score ≥ 90 on desktop for homepage

## Task 14: Error Handling and 404 Page
- [x] 14.1 Create src/app/not-found.tsx custom 404 page with navigation back to home
- [x] 14.2 Create src/components/ErrorBoundary.tsx React error boundary with friendly fallback UI
- [x] 14.3 Add error handling to API routes (validation errors return 400, server errors return 500 with logging)
- [x] 14.4 Add image fallback handling using Next.js Image onError callback

## Task 15: Testing Setup and Tests
- [x] 15.1 Install and configure Vitest, React Testing Library, fast-check, and jsdom environment
- [x] 15.2 Write unit tests for Zod validation schemas (DemoFormData, ContactFormData) with valid and invalid inputs
- [x] 15.3 Write unit tests for reusable components (Navbar, Footer, HeroSection, FeatureGrid, ProductCard, CTASection, DemoForm, ContactForm)
- [x] 15.4 Write property-based tests with fast-check for Properties 1-14 from the design document (minimum 100 iterations each)
- [x] 15.5 Write Playwright e2e tests for critical flows: homepage→product→demo, form submission, mobile navigation, blog navigation
