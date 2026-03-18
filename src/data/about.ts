import type { Feature } from '@/types';

export const mission = {
  title: 'Our Mission',
  description:
    'To empower businesses of all sizes with affordable, industry-specific automation software that simplifies operations, reduces costs, and drives growth.',
};

export const vision = {
  title: 'Our Vision',
  description:
    'To become India\'s most trusted automation software partner, enabling every school, retailer, and farm to operate at peak efficiency through technology.',
};

export const history = {
  title: 'Our Story',
  description:
    'DoonPortal was founded over 15 years ago in Dehradun, India, with a clear purpose — to bridge the technology gap for businesses that needed powerful automation but lacked access to enterprise-grade solutions. What started as custom software projects for local schools has grown into a full product suite serving education, retail, and agriculture sectors. Over the years, we have built deep domain expertise, refined our platforms through real-world feedback, and earned the trust of hundreds of organizations across India.',
  milestones: [
    { year: '2008', event: 'Founded in Dehradun with a focus on school automation' },
    { year: '2012', event: 'Launched the first version of School Management System' },
    { year: '2016', event: 'Expanded into retail with Inventory POS System' },
    { year: '2013', event: 'Introduced Dairy Management System for agriculture sector' },
    { year: '2025', event: 'Serving 50+ organizations across India' },
  ],
};

export const values: Feature[] = [
  {
    icon: '💡',
    title: 'Innovation',
    description: 'We continuously improve our platforms with the latest technology to deliver better solutions.',
  },
  {
    icon: '🤝',
    title: 'Trust',
    description: 'We build long-term relationships with our clients based on transparency, reliability, and results.',
  },
  {
    icon: '🎯',
    title: 'Simplicity',
    description: 'We design software that is powerful yet easy to use, so teams can adopt it without friction.',
  },
  {
    icon: '🌱',
    title: 'Impact',
    description: 'We measure success by the real-world impact our software has on our clients\' operations and growth.',
  },
];

export const team = {
  founder: {
    name: 'Founder Name',
    title: 'Founder & CEO',
    description:
      'A seasoned software engineer and entrepreneur with 15+ years of experience in building automation platforms. Passionate about using technology to solve real business problems.',
    image: '/images/team/founder.png',
  },
  description:
    'Our team combines deep technical expertise with industry knowledge. From developers and designers to support specialists, every member of the DoonPortal team is committed to delivering exceptional software and service.',
};

export const ctaContent = {
  headline: 'Want to Learn More?',
  subheadline: 'Get in touch with our team or explore our solutions to see how DoonPortal can help your organization.',
  ctaButton: { label: 'Contact Us', href: '/contact' },
};
