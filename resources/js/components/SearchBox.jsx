import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from './Icons';

export default function SearchBox({ initial = '', large = false, autoFocus = false }) {
    const [q, setQ] = useState(initial);
    const inputId = useId();
    const navigate = useNavigate();

    const submit = (e) => {
        e.preventDefault();
        const term = q.trim();
        if (term) {
            navigate(`/search?q=${encodeURIComponent(term)}`);
        }
    };

    return (
        <form onSubmit={submit} role="search" className={`flex w-full items-center gap-2 rounded-full border border-stone-300 bg-white shadow-sm focus-within:border-forest-500 ${large ? 'p-2 pl-5' : 'p-1 pl-4'}`}>
            <Icon name="search" className="shrink-0 text-stone-400" />
            <label htmlFor={inputId} className="sr-only">
                Search businesses, places, events and stories
            </label>
            <input
                id={inputId}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cafes, waterfalls, events this weekend…"
                className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-stone-400 ${large ? 'text-base' : 'text-sm'}`}
                maxLength={100}
                autoFocus={autoFocus}
            />
            <button type="submit" className="btn-primary shrink-0">
                Search
            </button>
        </form>
    );
}
