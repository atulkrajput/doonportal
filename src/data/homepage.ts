import type { Feature } from '@/types';

export const heroContent = {
  headline: 'Automation Software That Powers Your Business',
  subheadline:
    'DoonPortal builds industry-specific platforms for schools, retail businesses, and dairy farms. Streamline operations, reduce costs, and grow with confidence.',
  ctaButtons: [
    { label: 'Explore Solutions', href: '/solutions', variant: 'primary' as const },
    { label: 'Book a Demo', href: '/book-demo', variant: 'secondary' as const },
  ],
};

export const industries: Feature[] = [
  {
    icon: '🎓',
    title: 'Education',
    description:
      'Complete school management with student records, attendance, fees, exams, and parent communication.',
  },
  {
    icon: '🛍️',
    title: 'Retail',
    description:
      'Smart POS billing and inventory management to streamline retail operations and boost sales.',
  },
  {
    icon: '🌾',
    title: 'Agriculture',
    description:
      'Dairy farm automation with cattle records, milk tracking, vendor management, and financial reporting.',
  },
  {
    icon: '🏢',
    title: 'Small Businesses',
    description:
      'Custom automation solutions tailored to your unique business processes and workflows.',
  },
];

export const differentiators: Feature[] = [
  {
    icon: '⏳',
    title: '15+ Years Expertise',
    description:
      'Over 15 years of experience building automation software for diverse industries across India.',
  },
  {
    icon: '🎯',
    title: 'Industry-Specific Solutions',
    description:
      'Purpose-built platforms designed for the unique needs of each industry we serve.',
  },
  {
    icon: '📐',
    title: 'Scalable Architecture',
    description:
      'Built to grow with your organization — from a single location to multi-branch operations.',
  },
  {
    icon: '🔧',
    title: 'Customizable Platforms',
    description:
      'Flexible configurations and modules that adapt to your specific workflows and requirements.',
  },
  {
    icon: '🤝',
    title: 'Long-Term Support',
    description:
      'Dedicated support team committed to your success with ongoing updates and assistance.',
  },
];

export const founderInfo = {
  name: 'Founder Name',
  title: 'Founder & CEO',
  description:
    'With over 15 years of experience in software development and business automation, our founder started DoonPortal with a simple mission — to make powerful automation accessible to businesses of all sizes. Based in Dehradun, India, DoonPortal has grown from a small team to a trusted technology partner for schools, retailers, and dairy farms across the country.',
  image: '/images/founder.png',
};

export const ctaContent = {
  headline: 'Ready to Automate Your Business?',
  subheadline:
    'Join hundreds of organizations that trust DoonPortal to streamline their operations. Book a free demo today.',
  ctaButton: { label: 'Book a Free Demo', href: '/book-demo' },
};
