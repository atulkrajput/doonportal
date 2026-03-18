'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { demoFormSchema, type DemoFormSchema } from '@/lib/validation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface DemoFormProps {
  productContext?: string;
}

export default function DemoForm({ productContext }: DemoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DemoFormSchema>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      name: '',
      organization: '',
      city: '',
      phone: '',
      email: '',
      message: productContext ? `Interested in: ${productContext}` : '',
    },
  });

  const onSubmit = async (data: DemoFormSchema) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Something went wrong. Please try again.');
      }

      setIsSuccess(true);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'Network error. Please check your connection.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center" role="status">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-green-800">Demo Request Submitted!</h3>
        <p className="mt-2 text-green-700">
          Thank you for your interest. Our team will get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-body-sm text-error-700" role="alert">
          {serverError}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Name"
          type="text"
          required
          placeholder="Your full name"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Organization"
          type="text"
          required
          placeholder="Company or institution"
          error={errors.organization?.message}
          {...register('organization')}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="City"
          type="text"
          placeholder="Your city"
          error={errors.city?.message}
          {...register('city')}
        />
        <Input
          label="Phone"
          type="tel"
          required
          placeholder="10+ digit phone number"
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>

      <Input
        label="Email"
        type="email"
        required
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Message"
        type="textarea"
        placeholder="Tell us about your requirements..."
        error={errors.message?.message}
        {...register('message')}
      />

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting...' : 'Request a Demo'}
      </Button>
    </form>
  );
}
