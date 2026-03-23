'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  city: string | null;
  productInterest: string;
  status: string;
  source: string;
  score: number;
  createdAt: string;
  _count: { demoBookings: number; activities: number };
  tags: { tagName: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  demo_scheduled: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

const STATUSES = ['all', 'new', 'contacted', 'demo_scheduled', 'converted', 'lost'];

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [cityFilter, setCityFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [importResult, setImportResult] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    if (search) params.set('search', search);
    if (cityFilter) params.set('city', cityFilter);
    if (tagFilter) params.set('tag', tagFilter);
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [status, search, cityFilter, tagFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    if (cityFilter) params.set('city', cityFilter);
    if (tagFilter) params.set('tag', tagFilter);
    window.open(`/api/leads/export?${params}`, '_blank');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) { setImportResult('File is empty or has no data rows'); return; }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const leads = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return {
        school_name: row['school_name'] || row['organization'] || row['school'] || '',
        contact_person: row['contact_person'] || row['name'] || row['contact'] || '',
        phone: row['phone'] || row['mobile'] || '',
        email: row['email'] || '',
        city: row['city'] || '',
        state: row['state'] || '',
        source: row['source'] || 'imported',
      };
    });

    const res = await fetch('/api/leads/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads }),
    });
    const data = await res.json();
    setImportResult(`Imported: ${data.imported}, Skipped: ${data.skipped}`);
    if (fileInputRef.current) fileInputRef.current.value = '';
    await fetchLeads();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input type="text" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <input type="text" placeholder="City..." value={cityFilter} onChange={e => setCityFilter(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-28" />
        <input type="text" placeholder="Tag..." value={tagFilter} onChange={e => setTagFilter(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-28" />
        <div className="flex gap-1">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${status === s ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setShowImport(!showImport)} className="rounded-lg bg-neutral-100 px-3 py-2 text-sm hover:bg-neutral-200">Import</button>
          <button onClick={handleExport} className="rounded-lg bg-neutral-100 px-3 py-2 text-sm hover:bg-neutral-200">Export CSV</button>
          <span className="flex items-center text-sm text-neutral-500">{total} leads</span>
        </div>
      </div>

      {/* Import Panel */}
      {showImport && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-2">
          <p className="text-sm text-neutral-600">Upload a CSV file with columns: school_name, contact_person, phone, email, city, state, source</p>
          <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleImport} className="text-sm" />
          {importResult && <p className="text-sm text-green-600">{importResult}</p>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Product</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Score</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Tags</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Source</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-neutral-400">Loading...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-neutral-400">No leads found</td></tr>
            ) : leads.map(lead => (
              <tr key={lead.id} onClick={() => router.push(`/admin/leads/${lead.id}`)}
                className="cursor-pointer border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3 font-medium text-neutral-900">{lead.name}</td>
                <td className="px-4 py-3 text-neutral-600">{lead.email}</td>
                <td className="px-4 py-3 text-neutral-600">{lead.phone || '—'}</td>
                <td className="px-4 py-3 text-neutral-600 capitalize">{lead.productInterest}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[lead.status] || 'bg-neutral-100 text-neutral-600'}`}>
                    {lead.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-600">{lead.score}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {lead.tags?.slice(0, 3).map(t => (
                      <span key={t.tagName} className="rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-600">{t.tagName}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-600 capitalize">{lead.source}</td>
                <td className="px-4 py-3 text-neutral-400">{new Date(lead.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
