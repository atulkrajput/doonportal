import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <div ref={ref} {...props}>{children}</div>
    )),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useInView: () => true,
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => {
    const { fill, priority, ...rest } = props;
    return <img {...rest} />;
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

import DemoForm from '@/components/forms/DemoForm';
import ContactForm from '@/components/forms/ContactForm';

describe('DemoForm', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('renders all form fields', () => {
    render(<DemoForm />);
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Organization/)).toBeInTheDocument();
    expect(screen.getByLabelText(/City/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/)).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields on submit', async () => {
    const user = userEvent.setup();
    render(<DemoForm />);

    await user.click(screen.getByRole('button', { name: /Request a Demo/ }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('shows success message after valid submission', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const user = userEvent.setup();
    render(<DemoForm />);

    await user.type(screen.getByLabelText(/Name/), 'John Doe');
    await user.type(screen.getByLabelText(/Organization/), 'Acme School');
    await user.type(screen.getByLabelText(/Phone/), '9876543210');
    await user.type(screen.getByLabelText(/Email/), 'john@example.com');
    await user.click(screen.getByRole('button', { name: /Request a Demo/ }));

    await waitFor(() => {
      expect(screen.getByText(/Demo Request Submitted/)).toBeInTheDocument();
    });
  });

  it('pre-fills message with product context', () => {
    render(<DemoForm productContext="School Management" />);
    const textarea = screen.getByLabelText(/Message/) as HTMLTextAreaElement;
    expect(textarea.value).toContain('School Management');
  });
});

describe('ContactForm', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('renders all form fields', () => {
    render(<ContactForm />);
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/)).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields on submit', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByRole('button', { name: /Send Message/ }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('shows success message after valid submission', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText(/Name/), 'Jane Doe');
    await user.type(screen.getByLabelText(/Email/), 'jane@example.com');
    await user.type(screen.getByLabelText(/Message/), 'Hello, I have a question.');
    await user.click(screen.getByRole('button', { name: /Send Message/ }));

    await waitFor(() => {
      expect(screen.getByText(/Message Sent/)).toBeInTheDocument();
    });
  });
});
