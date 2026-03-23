'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface CampaignLead {
  lead: { id: number; name: string; email: string; phone: string | null; status: string; city: string | null; organization: string | null };
}

interface CampaignDetail {
  id: number;
  name: string;
  type: string;
  product: string;
  status: string;
  createdAt: string;
  campaignLeads: CampaignLead[];
}

const STATUS_OPTIONS = ['active', 'paused', 'completed'];

export default function CampaignDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCampaign = async () => {
    const res = await fetch(`/api/campaigns/${id}`);
    if (res.ok) setCampaign(await res.json());
  };

  useEffect(() => { fetchCampaign(); }, [id]);

  const updateStatus = async (status: string) => {
    setSaving(true);
    await fetch(`/api/campaigns/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await fetchCampaign();
    setSaving(false);
  };

  const removeLead = async (leadId: number) => {
    await fetch(`/api/campaigns/${id}/leads`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: leadId }),
    });
    await fetchCampaign();
  };

  if (!campaign) return <div className="text-neutral-500">Loading campaign...</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => router.push('/admin/campaigns')} className="text-sm text-brand-600 hover:underline">← Back to Campaigns</button>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">{campaign.name}</h2>
            <p className="text-sm text-neutral-500 capitalize">{campaign.type} · {campaign.product}</p>
          </div>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => updateStatus(s)} disabled={saving || campaign.status === s}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${campaign.status === s ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'} disabled:opacity-50`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-sm text-neutral-400">{campaign.campaignLeads.length} leads assigned</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaign.campaignLeads.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">No leads assigned</td></tr>
            ) : campaign.campaignLeads.map(cl => (
              <tr key={cl.lead.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium text-neutral-900">{cl.lead.name}</td>
                <td className="px-4 py-3 text-neutral-600">{cl.lead.email}</td>
                <td className="px-4 py-3 text-neutral-600">{cl.lead.phone || '—'}</td>
                <td className="px-4 py-3 capitalize text-neutral-600">{cl.lead.status.replace('_', ' ')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => removeLead(cl.lead.id)} className="text-xs text-red-500 hover:underline">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
