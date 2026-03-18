import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { demoFormSchema, contactFormSchema } from '@/lib/validation';

/**
 * Property 5: Form validation rejects invalid required fields with inline errors
 * For any combination of missing or invalid required fields submitted to the
 * Demo Form or Contact Form, the form should display an inline error message
 * for each invalid field.
 * **Validates: Requirements 11.4, 12.5**
 */
describe('Property 5: Form validation rejects invalid required fields', () => {
  it('demoFormSchema rejects when any required field is empty', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('name', 'organization', 'phone', 'email'),
        (field) => {
          const validData: Record<string, string> = {
            name: 'John',
            organization: 'Acme',
            phone: '9876543210',
            email: 'john@example.com',
          };
          validData[field] = '';
          const result = demoFormSchema.safeParse(validData);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues.some((i) => i.path.includes(field))).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('contactFormSchema rejects when any required field is empty', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('name', 'email', 'message'),
        (field) => {
          const validData: Record<string, string> = {
            name: 'Jane',
            email: 'jane@example.com',
            message: 'Hello',
          };
          validData[field] = '';
          const result = contactFormSchema.safeParse(validData);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues.some((i) => i.path.includes(field))).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 6: Demo form field validation
 * For any string input, the email validation should accept strings matching
 * standard email format and reject all others. The phone validation should
 * accept strings of 10 or more numeric digits and reject strings containing
 * non-digit characters or fewer than 10 digits.
 * **Validates: Requirements 12.6, 12.7**
 */
describe('Property 6: Demo form field validation', () => {
  // Generate emails that conform to standard format (no special chars in local part)
  const safeEmailArb = fc
    .tuple(
      fc.stringMatching(/^[a-z][a-z0-9]{1,10}$/),
      fc.stringMatching(/^[a-z][a-z0-9]{1,8}$/),
      fc.constantFrom('com', 'org', 'net', 'io', 'co')
    )
    .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

  it('email field accepts valid email addresses', () => {
    fc.assert(
      fc.property(safeEmailArb, (email) => {
        const result = demoFormSchema.shape.email.safeParse(email);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('email field rejects strings without @ symbol', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('@')),
        (notEmail) => {
          const result = demoFormSchema.shape.email.safeParse(notEmail);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Generate numeric strings using stringMatching
  it('phone field accepts numeric strings of 10+ digits', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[0-9]{10,15}$/),
        (phone) => {
          const result = demoFormSchema.shape.phone.safeParse(phone);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('phone field rejects strings with non-digit characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 20 }).filter((s) => /[^0-9]/.test(s)),
        (badPhone) => {
          const result = demoFormSchema.shape.phone.safeParse(badPhone);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('phone field rejects numeric strings shorter than 10 digits', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[0-9]{1,9}$/),
        (shortPhone) => {
          const result = demoFormSchema.shape.phone.safeParse(shortPhone);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
