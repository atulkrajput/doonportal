import type { Feature } from '@/types';

export const heroContent = {
  headline: 'Custom Automation Solutions for Your Business',
  subheadline:
    'Need something beyond our standard products? We build tailored automation platforms designed around your unique workflows and requirements.',
  ctaButton: { label: 'Contact Us', href: '/contact' },
};

export const services: Feature[] = [
  {
    icon: '⚙️',
    title: 'Business Process Automation',
    description:
      'Automate repetitive tasks, approvals, and workflows to save time and reduce human error across your organization.',
  },
  {
    icon: '🏗️',
    title: 'Custom ERP Development',
    description:
      'Purpose-built ERP systems that integrate all your business functions — finance, HR, operations, and more — into one platform.',
  },
  {
    icon: '🔄',
    title: 'Workflow Automation',
    description:
      'Design and implement automated workflows that connect your teams, tools, and data for seamless operations.',
  },
  {
    icon: '🔗',
    title: 'System Integrations',
    description:
      'Connect your existing tools and platforms with custom integrations, APIs, and data synchronization solutions.',
  },
  {
    icon: '🛠️',
    title: 'Enterprise Tools',
    description:
      'Build custom dashboards, reporting tools, and management platforms tailored to your enterprise needs.',
  },
];

export const process = [
  {
    step: 1,
    title: 'Discovery',
    description:
      'We start by understanding your business, workflows, pain points, and goals through detailed consultations.',
  },
  {
    step: 2,
    title: 'Planning',
    description:
      'Our team designs a solution architecture, defines milestones, and creates a detailed project roadmap.',
  },
  {
    step: 3,
    title: 'Development',
    description:
      'We build your solution using modern technologies with regular demos and feedback cycles to ensure alignment.',
  },
  {
    step: 4,
    title: 'Testing & Launch',
    description:
      'Rigorous testing, user training, and a smooth deployment process to get your team up and running.',
  },
  {
    step: 5,
    title: 'Support & Iteration',
    description:
      'Ongoing support, maintenance, and iterative improvements based on real-world usage and feedback.',
  },
];

export const ctaContent = {
  headline: 'Have a Unique Challenge?',
  subheadline:
    'Tell us about your business needs and we\'ll design a custom automation solution that fits perfectly.',
  ctaButton: { label: 'Book a Consultation', href: '/book-demo' },
};
