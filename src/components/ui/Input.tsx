'use client';

import { forwardRef } from 'react';

interface InputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  required?: boolean;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ label, name, type = 'text', required, error, placeholder, ...rest }, ref) => {
    const inputId = name;
    const baseInput =
      'w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-body text-neutral-900 placeholder:text-neutral-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500';
    const errorInput = error ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : '';

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-body-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-error-500 ml-0.5" aria-hidden="true">*</span>}
        </label>

        {type === 'textarea' ? (
          <textarea
            id={inputId}
            name={name}
            placeholder={placeholder}
            required={required}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={`${baseInput} ${errorInput} min-h-[120px] resize-y`}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            {...rest}
          />
        ) : (
          <input
            id={inputId}
            name={name}
            type={type}
            placeholder={placeholder}
            required={required}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={`${baseInput} ${errorInput}`}
            ref={ref as React.Ref<HTMLInputElement>}
            {...rest}
          />
        )}

        {error && (
          <p id={`${inputId}-error`} className="text-body-sm text-error-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
