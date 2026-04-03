'use client';

import { useState } from 'react';
import ContactForm from '@/components/forms/ContactForm';
import DemoForm from '@/components/forms/DemoForm';

const tabs = [
  { id: 'contact', label: 'Send Us a Message' },
  { id: 'demo', label: 'Request a Demo' },
];

export default function ContactTabs() {
  const [active, setActive] = useState('contact');

  return (
    <div className="mx-auto max-w-2xl">
      {/* Tab buttons */}
      <div className="flex border-b border-neutral-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors focus:outline-none ${
              active === tab.id
                ? 'border-b-2 border-brand-600 text-brand-600'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-8">
        {active === 'contact' && <ContactForm />}
        {active === 'demo' && (
          <>
            <p className="mb-6 text-neutral-600">
              Interested in seeing our software in action? Fill out the demo request form and we&apos;ll schedule a personalized walkthrough.
            </p>
            <DemoForm />
          </>
        )}
      </div>
    </div>
  );
}
