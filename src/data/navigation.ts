import type { NavLink } from '@/types';

export const logo = {
  src: '/doonportal.png',
  alt: 'DoonPortal',
};

export const mainLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Solutions',
    href: '/solutions',
    children: [
      { label: 'School Management', href: '/products/school-management' },
      { label: 'Inventory POS', href: '/products/inventory-pos' },
      { label: 'Dairy Management', href: '/products/dairy-management' },
      { label: 'Custom Automation', href: '/custom-automation' },
    ],
  },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

export const ctaButton = {
  label: 'Book Demo',
  href: '/book-demo',
};

export const footerLinkGroups = [
  {
    title: 'Products',
    links: [
      { label: 'School Management', href: '/products/school-management' },
      { label: 'Inventory POS', href: '/products/inventory-pos' },
      { label: 'Dairy Management', href: '/products/dairy-management' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Custom Automation', href: '/custom-automation' },
      { label: 'Solutions', href: '/solutions' },
    ],
  },
];

export const socialLinks = [
  {
    platform: 'LinkedIn',
    url: 'https://linkedin.com/company/doonportal',
    icon: 'linkedin',
  },
  {
    platform: 'Twitter',
    url: 'https://twitter.com/doonportal',
    icon: 'twitter',
  },
  {
    platform: 'Facebook',
    url: 'https://facebook.com/doonportal',
    icon: 'facebook',
  },
];

export const contactInfo = {
  email: 'info@doonportal.com',
  phone: '+91-XXXXXXXXXX',
  address: 'Dehradun, India',
};
