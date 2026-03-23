'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Booking {
  id: number;
  scheduledDate: string;
  scheduledTime: string;
  meetingLink: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  lead: { name: string; email: string; phone: string | null; organization: string | null };
}

export default function DemosPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = filter !== 'all' ? `?status=${filter}` : '';
    fetch(`/api/demo${params}`)
      .then(r => r.json())
      .then(data => setBookings(data.bookings || []))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['all', 'scheduled', 'completed', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
              filter === s ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Lead</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Organization</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Date</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Time</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">Loading...</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No demo bookings found</td></tr>
            ) : bookings.map(b => (
              <tr key={b.id} className="border-b border-neutral-100">
                <td className="px-4 py-3">
                  <div className="font-medium text-neutral-900">{b.lead.name}</div>
                  <div className="text-xs text-neutral-400">{b.lead.email}</div>
                </td>
                <td className="px-4 py-3 text-neutral-600">{b.lead.organization || '—'}</td>
                <td className="px-4 py-3 text-neutral-600">{b.scheduledDate}</td>
                <td className="px-4 py-3 text-neutral-600">{b.scheduledTime}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    b.status === 'completed' ? 'bg-green-100 text-green-700' :
                    b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>{b.status}</span>
                </td>
                <td className="px-4 py-3 text-neutral-500 max-w-[200px] truncate">{b.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
