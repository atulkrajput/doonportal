import { useId, useState } from 'react';
import { errorMessage, fieldErrors } from '../api/client';
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY, flag, nationalNumber } from '../lib/countries';

/** First error for a field; nested keys ("hours.0.opens_at") are matched exactly. */
function firstError(errors, name) {
    return errors?.[name]?.[0];
}

function Help({ id, error, help }) {
    if (error) {
        return (
            <span id={id} className="mt-1 block text-sm text-red-700">
                {error}
            </span>
        );
    }
    return help ? (
        <span id={id} className="mt-1 block text-xs text-stone-500">
            {help}
        </span>
    ) : null;
}

export function Field({ label, name, type = 'text', errors, help, optional, className = '', ...props }) {
    const id = useId();
    const error = firstError(errors, name);
    const Tag = type === 'textarea' ? 'textarea' : 'input';
    return (
        <label className={`block ${className}`}>
            <span className="text-sm font-medium text-stone-700">
                {label}
                {optional && <span className="font-normal text-stone-500"> (optional)</span>}
            </span>
            <Tag
                name={name}
                type={type === 'textarea' ? undefined : type}
                className="input mt-1"
                aria-invalid={Boolean(error)}
                aria-describedby={error || help ? id : undefined}
                rows={type === 'textarea' ? 4 : undefined}
                {...props}
            />
            <Help id={id} error={error} help={help} />
        </label>
    );
}

export function Select({ label, name, errors, help, optional, children, className = '', ...props }) {
    const id = useId();
    const error = firstError(errors, name);
    return (
        <label className={`block ${className}`}>
            <span className="text-sm font-medium text-stone-700">
                {label}
                {optional && <span className="font-normal text-stone-500"> (optional)</span>}
            </span>
            <select name={name} className="input mt-1" aria-invalid={Boolean(error)} aria-describedby={error || help ? id : undefined} {...props}>
                {children}
            </select>
            <Help id={id} error={error} help={help} />
        </label>
    );
}

export function CountrySelect({ name, defaultValue, label = 'Country', errors, optional, ...props }) {
    return (
        <Select label={label} name={name} errors={errors} optional={optional} defaultValue={defaultValue || ''} {...props}>
            {optional && <option value="">Select a country</option>}
            {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                    {c.name}
                </option>
            ))}
        </Select>
    );
}

/**
 * Mobile number with a country-code picker. Submits two fields: `name`
 * (the number as typed) and `countryName` (ISO code); the API validates the
 * number for that country and stores it in international format.
 */
export function PhoneField({ label = 'Mobile number', name = 'phone', countryName = 'phone_country', value, country, errors, help, optional, required }) {
    const id = useId();
    const [code, setCode] = useState(country || DEFAULT_COUNTRY);
    const error = firstError(errors, name) || firstError(errors, countryName);
    const selected = COUNTRY_OPTIONS.find((c) => c.code === code);
    return (
        <div>
            <label htmlFor={`${id}-number`} className="text-sm font-medium text-stone-700">
                {label}
                {optional && <span className="font-normal text-stone-500"> (optional)</span>}
            </label>
            <div className="mt-1 flex gap-2">
                <div className="relative w-28 shrink-0 rounded-xl focus-within:ring-2 focus-within:ring-navy-500">
                    <select
                        name={countryName}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        aria-label="Country code"
                        className="input absolute inset-0 cursor-pointer opacity-0"
                    >
                        {COUNTRY_OPTIONS.map((c) => (
                            <option key={c.code} value={c.code}>
                                {c.name} (+{c.dial})
                            </option>
                        ))}
                    </select>
                    <div className="input pointer-events-none flex items-center gap-1.5" aria-hidden="true">
                        <span>{flag(code)}</span>
                        <span className="font-medium">+{selected?.dial}</span>
                        <span className="ml-auto text-stone-400">▾</span>
                    </div>
                </div>
                <input
                    id={`${id}-number`}
                    name={name}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    defaultValue={nationalNumber(value, country)}
                    required={required}
                    placeholder={code === 'IN' ? '98765 43210' : ''}
                    className="input min-w-0 flex-1"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error || help ? id : undefined}
                />
            </div>
            <Help id={id} error={error} help={help} />
        </div>
    );
}

export function Checkbox({ name, children, errors, ...props }) {
    const error = firstError(errors, name);
    return (
        <div>
            <label className="flex items-start gap-2 text-sm text-stone-700">
                <input type="checkbox" name={name} value="1" className="mt-0.5 h-4 w-4 rounded border-stone-300 accent-navy-600" {...props} />
                <span>{children}</span>
            </label>
            {error && <span className="mt-1 block text-sm text-red-700">{error}</span>}
        </div>
    );
}

export function Message({ message }) {
    if (!message) {
        return null;
    }
    return (
        <p role={message.type === 'error' ? 'alert' : 'status'} className={`rounded-xl p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
            {message.text}
        </p>
    );
}

/**
 * Submit handler with busy / field errors / message state. `submit` receives
 * the form's values (FormData entries) and the form element.
 */
export function useForm(submit) {
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [busy, setBusy] = useState(false);
    const onSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setBusy(true);
        setErrors({});
        setMessage(null);
        try {
            await submit(Object.fromEntries(new FormData(form).entries()), form);
        } catch (err) {
            setErrors(fieldErrors(err));
            setMessage({ type: 'error', text: errorMessage(err) });
        } finally {
            setBusy(false);
        }
    };
    return { errors, setErrors, message, setMessage, busy, onSubmit };
}

/** Status pill for claims, submissions and reviews. */
const STATUS_STYLE = {
    PENDING: ['bg-amber-100 text-amber-900', 'In review'],
    NEEDS_INFO: ['bg-amber-100 text-amber-900', 'Needs info'],
    APPROVED: ['bg-emerald-100 text-emerald-900', 'Approved'],
    PUBLISHED: ['bg-emerald-100 text-emerald-900', 'Published'],
    REJECTED: ['bg-red-100 text-red-800', 'Not approved'],
    HIDDEN: ['bg-stone-200 text-stone-700', 'Hidden'],
    CANCELLED: ['bg-stone-200 text-stone-700', 'Cancelled'],
};

export function StatusPill({ status }) {
    const [style, label] = STATUS_STYLE[status] || ['bg-stone-100 text-stone-700', status];
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>{label}</span>;
}
