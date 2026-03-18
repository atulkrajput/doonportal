import { describe, it, expect } from 'vitest';
import { demoFormSchema, contactFormSchema } from '@/lib/validation';

describe('demoFormSchema', () => {
  const validDemo = {
    name: 'John Doe',
    organization: 'Acme School',
    city: 'Dehradun',
    phone: '9876543210',
    email: 'john@example.com',
    message: 'Interested in school management',
  };

  it('accepts valid input with all fields', () => {
    const result = demoFormSchema.safeParse(validDemo);
    expect(result.success).toBe(true);
  });

  it('accepts valid input with optional fields omitted', () => {
    const { city, message, ...required } = validDemo;
    const result = demoFormSchema.safeParse(required);
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = demoFormSchema.safeParse({ ...validDemo, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true);
    }
  });

  it('rejects missing organization', () => {
    const result = demoFormSchema.safeParse({ ...validDemo, organization: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('organization'))).toBe(true);
    }
  });

  it('rejects invalid email format', () => {
    const result = demoFormSchema.safeParse({ ...validDemo, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('email'))).toBe(true);
    }
  });

  it('rejects non-numeric phone', () => {
    const result = demoFormSchema.safeParse({ ...validDemo, phone: 'abc1234567' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('phone'))).toBe(true);
    }
  });

  it('rejects phone with fewer than 10 digits', () => {
    const result = demoFormSchema.safeParse({ ...validDemo, phone: '12345' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('phone'))).toBe(true);
    }
  });

  it('accepts phone with exactly 10 digits', () => {
    const result = demoFormSchema.safeParse({ ...validDemo, phone: '1234567890' });
    expect(result.success).toBe(true);
  });
});

describe('contactFormSchema', () => {
  const validContact = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '9876543210',
    message: 'I have a question about your services.',
  };

  it('accepts valid input with all fields', () => {
    const result = contactFormSchema.safeParse(validContact);
    expect(result.success).toBe(true);
  });

  it('accepts valid input with optional phone omitted', () => {
    const { phone, ...required } = validContact;
    const result = contactFormSchema.safeParse(required);
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = contactFormSchema.safeParse({ ...validContact, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true);
    }
  });

  it('rejects invalid email format', () => {
    const result = contactFormSchema.safeParse({ ...validContact, email: 'bad-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('email'))).toBe(true);
    }
  });

  it('rejects missing message', () => {
    const result = contactFormSchema.safeParse({ ...validContact, message: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('message'))).toBe(true);
    }
  });
});
