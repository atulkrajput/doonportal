'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Campaign {
  id: number;
  name: string;
  type: string;
  product: string;
  status: string;
  createdAt: string;
  _count: { campaignLeads: number };
}

const TYPE_OPTIONS = ['all', 'email', 'whatsapp', 'ads', 'manual'];
const STATUS_OPTIONS = ['all', 'active', 'paused', 'completed'];
const PRODUCT_OPTIONS = ['school', 'inventory', 'dairy'];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-neutral-100 text-neutral-600',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'email', product: 'school', status: 'active' });
  const [saving, setSaving] = useState(false);

  const fetchCampaigns = async () => {
    const params = new URLSearchParams();
    if (filterType !== 'all') params.set('type', filterType);
    if (filterStatus !== 'all') params.set('status', filterStatus);
    const res = await fetch(`/api/campaigns?${params}`);
    const data = await res.json();
    setCampaigns(data.campaigns || []);
  };

  useEffect(() => { fetchCampaigns(); }, [filterType, filterStatus]);

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ name: '', type: 'email', product: 'school', status: 'active' });
    setShowCreate(false);
    await fetchCampaigns();
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" aria-label="Filter by type">
            {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" aria-label="Filter by status">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>)}
          </select>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          + New Campaign
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createCampaign} className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
          <input type="text" placeholder="Campaign name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <div className="flex gap-3">
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" aria-label="Campaign type">
              {['email', 'whatsapp', 'ads', 'manual'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" aria-label="Product">
              {PRODUCT_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving || !form.name.trim()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            Create Campaign
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Type</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Product</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Leads</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Created</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No campaigns found</td></tr>
            ) : campaigns.map(c => (
              <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/campaigns/${c.id}`} className="font-medium text-brand-600 hover:underline">{c.name}</Link>
                </td>
                <td className="px-4 py-3 capitalize text-neutral-600">{c.type}</td>
                <td className="px-4 py-3 capitalize text-neutral-600">{c.product}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[c.status] || ''}`}>{c.status}</span>
                </td>
                <td className="px-4 py-3 text-neutral-600">{c._count.campaignLeads}</td>
                <td className="px-4 py-3 text-neutral-400">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
