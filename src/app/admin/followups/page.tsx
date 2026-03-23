'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Followup {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  city: string | null;
  status: string;
  nextFollowupDate: string | null;
  followupStatus: string | null;
  score: number;
  tags: { tagName: string }[];
}

export default function FollowupsPage() {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const fetchFollowups = async () => {
    setLoading(true);
    const res = await fetch(`/api/followups?status=${filter}`);
    const data = await res.json();
    setFollowups(data.followups || []);
    setLoading(false);
  };

  useEffect(() => { fetchFollowups(); }, [filter]);

  const markCompleted = async (id: number) => {
    await fetch(`/api/leads/${id}/followup`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followup_status: 'completed' }),
    });
    await fetchFollowups();
  };

  const isOverdue = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['pending', 'completed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${filter === s ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Organization</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Follow-up Date</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Score</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Tags</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">Loading...</td></tr>
            ) : followups.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No follow-ups found</td></tr>
            ) : followups.map(f => (
              <tr key={f.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/leads/${f.id}`} className="font-medium text-brand-600 hover:underline">{f.name}</Link>
                </td>
                <td className="px-4 py-3 text-neutral-600">{f.organization || '—'}</td>
                <td className="px-4 py-3">
                  <span className={isOverdue(f.nextFollowupDate) ? 'text-red-600 font-medium' : 'text-neutral-600'}>
                    {f.nextFollowupDate ? new Date(f.nextFollowupDate).toLocaleDateString() : '—'}
                  </span>
                  {isOverdue(f.nextFollowupDate) && <span className="ml-1 text-xs text-red-500">Overdue</span>}
                </td>
                <td className="px-4 py-3 text-neutral-600">{f.score}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {f.tags.map(t => (
                      <span key={t.tagName} className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">{t.tagName}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {filter === 'pending' && (
                    <button onClick={() => markCompleted(f.id)} className="text-xs text-green-600 hover:underline">Mark Done</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
