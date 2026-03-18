export interface Product {
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

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  featuredImage: string;
  content: string;
  tags?: string[];
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  jsonLd?: Record<string, unknown>[];
}

export interface NavLink {
  label: string;
  href: string;
  children?: NavLink[];
}

export interface DemoFormData {
  name: string;
  organization: string;
  city: string;
  phone: string;
  email: string;
  message: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}
