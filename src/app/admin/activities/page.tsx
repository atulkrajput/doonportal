'use client';

import { useEffect, useState } from 'react';

interface Activity {
  id: number;
  type: string;
  notes: string | null;
  createdAt: string;
  lead: { id: number; name: string; email: string };
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/activities')
      .then(r => r.json())
      .then(data => setActivities(data.activities || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Type</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Lead</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Notes</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-400">Loading...</td></tr>
            ) : activities.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-400">No activities yet</td></tr>
            ) : activities.map(act => (
              <tr key={act.id} className="border-b border-neutral-100">
                <td className="px-4 py-3">
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium capitalize text-neutral-600">{act.type}</span>
                </td>
                <td className="px-4 py-3">
                  <a href={`/admin/leads/${act.lead.id}`} className="font-medium text-brand-600 hover:underline">{act.lead.name}</a>
                  <div className="text-xs text-neutral-400">{act.lead.email}</div>
                </td>
                <td className="px-4 py-3 text-neutral-600 max-w-[300px] truncate">{act.notes || '—'}</td>
                <td className="px-4 py-3 text-neutral-400">{new Date(act.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
