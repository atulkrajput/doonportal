import { z } from 'zod';

export const demoFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  organization: z.string().min(1, 'Organization is required'),
  city: z.string().optional(),
  phone: z
    .string()
    .regex(/^\d+$/, 'Phone must contain only digits')
    .min(10, 'Phone must be at least 10 digits'),
  email: z.string().email('Invalid email format'),
  message: z.string().optional(),
});

export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
});

export type DemoFormSchema = z.infer<typeof demoFormSchema>;
export type ContactFormSchema = z.infer<typeof contactFormSchema>;
