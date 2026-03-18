# Requirements Document

## Introduction

DoonPortal is an automation software company that builds platforms for schools, retail businesses, and dairy farms. This document defines the requirements for a complete website rebuild as a modern SaaS-style product marketing and lead generation site. The new website replaces the existing Old-Web site, built with Next.js, React, TypeScript, TailwindCSS, and Framer Motion. The site must showcase three core products (School Management System, Inventory POS System, Dairy Management System), offer custom automation services, and convert visitors into leads through demo request forms.

## Glossary

- **Website**: The DoonPortal public-facing Next.js web application serving all pages and components
- **Navbar**: The persistent top navigation bar displayed across all pages
- **Footer**: The persistent bottom section displayed across all pages containing links, contact info, and branding
- **Hero_Section**: The prominent top section of a page containing headline, subheadline, and call-to-action buttons
- **Product_Card**: A reusable card component displaying a product summary with title, description, icon, and CTA link
- **Feature_Grid**: A grid layout component displaying product features as individual cards or tiles
- **CTA_Section**: A call-to-action section prompting visitors to take a specific action such as booking a demo
- **Demo_Form**: The lead generation form collecting visitor information for demo requests
- **Lead**: A visitor submission containing name, organization, city, phone, email, and message
- **Old_Web**: The existing website files stored in the Old-Web/ directory, which are read-only and must not be modified
- **Lighthouse_Score**: Google Lighthouse performance audit score ranging from 0 to 100
- **Schema_Markup**: Structured data in JSON-LD format embedded in pages for search engine understanding
- **Visitor**: A person browsing the DoonPortal website

## Requirements

### Requirement 1: Project Structure and Repository Rules

**User Story:** As a developer, I want the new website to coexist with the old website files without conflicts, so that the legacy site is preserved while the new site is built.

#### Acceptance Criteria

1. THE Website SHALL place all new source code outside the Old-Web/ directory
2. THE Website SHALL never modify, delete, or rename any file inside the Old-Web/ directory
3. THE Website SHALL place all documentation files inside the /docs directory
4. THE Website SHALL not generate any markdown files outside the /docs directory, except for the root README.md
5. THE Website SHALL use Next.js with React, TypeScript, and TailwindCSS as the technology stack
6. THE Website SHALL organize components under src/components/ with subdirectories for sections/, layouts/, pages/, styles/, and utils/


### Requirement 2: Navigation and Layout

**User Story:** As a visitor, I want consistent navigation and layout across all pages, so that I can easily find and access any section of the website.

#### Acceptance Criteria

1. THE Navbar SHALL display the DoonPortal logo, links to Home, Solutions, About, Blog, Contact, and a "Book Demo" CTA button
2. THE Navbar SHALL remain fixed at the top of the viewport during scrolling
3. WHEN the viewport width is less than 768px, THE Navbar SHALL collapse navigation links into a mobile hamburger menu
4. WHEN a visitor clicks the hamburger menu icon, THE Navbar SHALL display the navigation links in a mobile-friendly overlay or drawer
5. THE Footer SHALL display company information, navigation links, contact details, and social media links
6. THE Website SHALL render the Navbar and Footer on every page using a shared layout component

### Requirement 3: Homepage

**User Story:** As a visitor, I want to immediately understand what DoonPortal offers when I land on the homepage, so that I can decide whether the products are relevant to my needs.

#### Acceptance Criteria

1. THE Hero_Section SHALL display a headline communicating DoonPortal's value proposition as an automation software company
2. THE Hero_Section SHALL display a subheadline elaborating on the industries served (schools, retail, dairy farms)
3. THE Hero_Section SHALL display two CTA buttons: "Explore Solutions" linking to the Solutions page and "Book a Demo" linking to the Demo_Form
4. THE Homepage SHALL display a Products Section containing three Product_Card components, one for each core product (School Management System, Inventory POS System, Dairy Management System)
5. WHEN a visitor clicks a Product_Card, THE Website SHALL navigate the visitor to the corresponding product detail page
6. THE Homepage SHALL display an Industries Section highlighting four industries: Education, Retail, Agriculture, and Small Businesses
7. THE Homepage SHALL display a "Why Choose DoonPortal" section listing differentiators: 15+ years expertise, industry-specific solutions, scalable architecture, customizable platforms, and long-term support
8. THE Homepage SHALL display a Founder Section with founder information
9. THE Homepage SHALL display a CTA_Section prompting visitors to book a demo or contact sales

### Requirement 4: Product Pages — School Management System

**User Story:** As a school administrator, I want to learn about the School Management System's features and benefits, so that I can evaluate whether it meets my institution's needs.

#### Acceptance Criteria

1. THE School_Management_Page SHALL display a Hero_Section with the product name, tagline, and a "Request Demo" CTA button
2. THE School_Management_Page SHALL display a Problems section describing common school administration challenges
3. THE School_Management_Page SHALL display a Solution section explaining how the product addresses those challenges
4. THE School_Management_Page SHALL display a Feature_Grid listing features: student management, attendance tracking, fee management, accounting, library management, transport management, exam management, report card generation, parent app, notifications, and analytics
5. THE School_Management_Page SHALL display a Screenshots section with product interface images
6. THE School_Management_Page SHALL display a Benefits section summarizing key advantages
7. THE School_Management_Page SHALL display a CTA_Section with a "Request Demo" button linking to the Demo_Form

### Requirement 5: Product Pages — Inventory POS System

**User Story:** As a retail business owner, I want to learn about the Inventory POS System's features and benefits, so that I can evaluate whether it fits my business operations.

#### Acceptance Criteria

1. THE Inventory_POS_Page SHALL display a Hero_Section with the product name, tagline, and a "Request Demo" CTA button
2. THE Inventory_POS_Page SHALL display a Problems section describing common retail inventory and billing challenges
3. THE Inventory_POS_Page SHALL display a Solution section explaining how the product addresses those challenges
4. THE Inventory_POS_Page SHALL display a Feature_Grid listing features: POS billing, inventory tracking, purchase management, supplier management, barcode scanning, stock alerts, customer records, and sales reports
5. THE Inventory_POS_Page SHALL display a Screenshots section with product interface images
6. THE Inventory_POS_Page SHALL display a Benefits section summarizing key advantages
7. THE Inventory_POS_Page SHALL display a CTA_Section with a "Request Demo" button linking to the Demo_Form


### Requirement 6: Product Pages — Dairy Management System

**User Story:** As a dairy farm operator, I want to learn about the Dairy Management System's features and benefits, so that I can evaluate whether it suits my farm operations.

#### Acceptance Criteria

1. THE Dairy_Management_Page SHALL display a Hero_Section with the product name, tagline, and a "Request Demo" CTA button
2. THE Dairy_Management_Page SHALL display a Problems section describing common dairy farm management challenges
3. THE Dairy_Management_Page SHALL display a Solution section explaining how the product addresses those challenges
4. THE Dairy_Management_Page SHALL display a Feature_Grid listing features: cattle records, milk production tracking, feed management, vendor milk purchase, fat/SNF calculations, expense tracking, and financial reports
5. THE Dairy_Management_Page SHALL display a Screenshots section with product interface images
6. THE Dairy_Management_Page SHALL display a Benefits section summarizing key advantages
7. THE Dairy_Management_Page SHALL display a CTA_Section with a "Request Demo" button linking to the Demo_Form

### Requirement 7: Custom Automation Services Page

**User Story:** As a business owner with unique needs, I want to learn about DoonPortal's custom automation services, so that I can determine whether DoonPortal can build a tailored solution for my organization.

#### Acceptance Criteria

1. THE Custom_Automation_Page SHALL display a Hero_Section with a headline about custom automation solutions and a "Contact Us" CTA button
2. THE Custom_Automation_Page SHALL describe available services: business process automation, custom ERP development, workflow automation, system integrations, and enterprise tools
3. THE Custom_Automation_Page SHALL display a process or workflow section explaining how DoonPortal engages with custom clients
4. THE Custom_Automation_Page SHALL display a CTA_Section prompting visitors to contact DoonPortal or book a consultation

### Requirement 8: Solutions Overview Page

**User Story:** As a visitor, I want a single page that summarizes all DoonPortal products and services, so that I can quickly compare options and navigate to the one that fits my needs.

#### Acceptance Criteria

1. THE Solutions_Page SHALL display an overview section introducing DoonPortal's product portfolio
2. THE Solutions_Page SHALL display a Product_Card for each of the three core products with a link to the respective product detail page
3. THE Solutions_Page SHALL display a section for Custom Automation services with a link to the Custom_Automation_Page
4. WHEN a visitor clicks a Product_Card or Custom Automation link, THE Website SHALL navigate the visitor to the corresponding detail page

### Requirement 9: About Page

**User Story:** As a visitor, I want to learn about DoonPortal's history, mission, and team, so that I can build trust in the company before engaging with its products.

#### Acceptance Criteria

1. THE About_Page SHALL display the company mission and vision
2. THE About_Page SHALL describe DoonPortal's history and 15+ years of experience in automation
3. THE About_Page SHALL display founder and team information
4. THE About_Page SHALL display company values and differentiators
5. THE About_Page SHALL display a CTA_Section prompting visitors to contact DoonPortal or explore solutions

### Requirement 10: Blog Page

**User Story:** As a visitor, I want to read articles and insights from DoonPortal, so that I can learn about automation trends and the company's expertise.

#### Acceptance Criteria

1. THE Blog_Page SHALL display a list of blog post cards with title, excerpt, date, and featured image
2. WHEN a visitor clicks a blog post card, THE Website SHALL navigate the visitor to the full blog post page
3. THE Blog_Post_Page SHALL display the full article content with title, author, date, and body text
4. THE Blog_Page SHALL support pagination or infinite scroll when the number of posts exceeds 9

### Requirement 11: Contact Page

**User Story:** As a visitor, I want to contact DoonPortal directly, so that I can ask questions or discuss my requirements.

#### Acceptance Criteria

1. THE Contact_Page SHALL display a contact form with fields: Name, Email, Phone, and Message
2. THE Contact_Page SHALL display company contact information including email address, phone number, and office address
3. WHEN a visitor submits the contact form with valid data, THE Website SHALL send the submission and display a success confirmation message
4. IF a visitor submits the contact form with missing or invalid required fields, THEN THE Website SHALL display inline validation error messages identifying each invalid field


### Requirement 12: Book Demo Page and Lead Generation Form

**User Story:** As a potential customer, I want to request a product demo through a form, so that I can see the product in action before making a decision.

#### Acceptance Criteria

1. THE Demo_Form SHALL display input fields for: Name, Organization, City, Phone, Email, and Message
2. THE Demo_Form SHALL mark Name, Organization, Phone, and Email as required fields
3. WHEN a visitor submits the Demo_Form with valid data, THE Website SHALL store the Lead data and send an email notification to the DoonPortal sales team
4. WHEN a visitor submits the Demo_Form with valid data, THE Website SHALL display a success confirmation message to the visitor
5. IF a visitor submits the Demo_Form with missing or invalid required fields, THEN THE Website SHALL display inline validation error messages for each invalid field without clearing the form
6. THE Demo_Form SHALL validate the Email field using a standard email format pattern
7. THE Demo_Form SHALL validate the Phone field to accept only numeric digits with a minimum length of 10 characters

### Requirement 13: Visual Design and UI Components

**User Story:** As a visitor, I want the website to look modern and professional, so that I perceive DoonPortal as a credible and high-quality software company.

#### Acceptance Criteria

1. THE Website SHALL use a modern SaaS visual style inspired by companies such as Stripe, Notion, Linear, and Vercel
2. THE Website SHALL use a minimal and professional design with grid layouts, card components, soft shadows, rounded corners, and clear typography
3. THE Website SHALL apply micro-animations using Framer Motion for page transitions, element reveals on scroll, and hover interactions
4. THE Website SHALL use consistent brand colors, typography, and spacing across all pages
5. THE Website SHALL render correctly on viewports from 320px to 2560px wide
6. THE Website SHALL use the DoonPortal logo sourced from the Old_Web assets (Old-Web/doonportal.png or Old-Web/favicon.ico)

### Requirement 14: SEO Optimization

**User Story:** As a marketing stakeholder, I want the website to be optimized for search engines, so that potential customers can discover DoonPortal through organic search.

#### Acceptance Criteria

1. THE Website SHALL render unique meta title and meta description tags for every page
2. THE Website SHALL use structured heading hierarchy (one H1 per page, followed by H2, H3 as needed) on every page
3. THE Website SHALL embed JSON-LD Schema_Markup for Organization, Product, and BreadcrumbList on relevant pages
4. THE Website SHALL target keywords including: "school management software", "school ERP", "inventory POS software", "dairy management software", and "business automation software" in page content and meta tags
5. THE Website SHALL generate a sitemap.xml file listing all public pages
6. THE Website SHALL include a robots.txt file allowing search engine crawling of all public pages
7. THE Website SHALL use semantic HTML elements (nav, main, article, section, aside, footer) for page structure

### Requirement 15: Performance Optimization

**User Story:** As a visitor, I want the website to load quickly, so that I have a smooth browsing experience without delays.

#### Acceptance Criteria

1. THE Website SHALL achieve a Google Lighthouse performance score of 90 or higher on desktop
2. THE Website SHALL use Next.js Image component for all images to enable automatic optimization, lazy loading, and responsive sizing
3. THE Website SHALL implement code splitting so that each page loads only the JavaScript required for that page
4. THE Website SHALL apply smooth page transitions using Framer Motion without blocking the main thread for more than 50ms
5. THE Website SHALL preload critical fonts and above-the-fold assets

### Requirement 16: Accessibility

**User Story:** As a visitor using assistive technology, I want the website to be accessible, so that I can navigate and interact with all content regardless of ability.

#### Acceptance Criteria

1. THE Website SHALL use semantic HTML elements and ARIA attributes where native semantics are insufficient
2. THE Website SHALL ensure all interactive elements (links, buttons, form inputs) are keyboard navigable using Tab, Enter, and Escape keys
3. THE Website SHALL provide visible focus indicators on all interactive elements
4. THE Website SHALL ensure text color contrast ratios meet WCAG 2.1 AA minimum requirements (4.5:1 for normal text, 3:1 for large text)
5. THE Website SHALL provide alt text for all informational images and empty alt attributes for decorative images
6. THE Demo_Form SHALL associate each input field with a visible label element using the "for" attribute

### Requirement 17: Reusable Component Architecture

**User Story:** As a developer, I want a modular component architecture, so that I can build and maintain pages efficiently with reusable building blocks.

#### Acceptance Criteria

1. THE Website SHALL implement reusable components for: Navbar, Footer, Hero_Section, Feature_Grid, Product_Card, CTA_Section, Testimonial, and Demo_Form
2. THE Website SHALL accept configuration props on each reusable component to customize content, styling, and behavior per page
3. THE Website SHALL co-locate component styles using TailwindCSS utility classes within component files
4. WHEN a reusable component is updated, THE Website SHALL reflect the update on all pages that use the component without requiring page-specific changes
