'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Activity {
  id: number;
  type: string;
  notes: string | null;
  createdAt: string;
}

interface DemoBooking {
  id: number;
  scheduledDate: string;
  scheduledTime: string;
  meetingLink: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

interface Tag {
  id: number;
  tagName: string;
}

interface WhatsappLog {
  id: number;
  message: string;
  status: string;
  createdAt: string;
}

interface LeadDetail {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  city: string | null;
  state: string | null;
  message: string | null;
  productInterest: string;
  status: string;
  source: string;
  score: number;
  nextFollowupDate: string | null;
  followupStatus: string | null;
  createdAt: string;
  updatedAt: string;
  activities: Activity[];
  demoBookings: DemoBooking[];
  tags: Tag[];
  whatsappLogs: WhatsappLog[];
}

const STATUSES = ['new', 'contacted', 'demo_scheduled', 'converted', 'lost'];
const ACTIVITY_TYPES = ['call', 'email', 'whatsapp', 'meeting'];
const TAG_PRESETS = ['hot', 'warm', 'cold', 'follow-up', 'not-interested'];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  demo_scheduled: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

const SCORE_ACTIONS = [
  { label: 'Filled demo form', delta: 10 },
  { label: 'Opened email', delta: 5 },
  { label: 'Scheduled demo', delta: 15 },
  { label: 'No response', delta: -5 },
];

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [activityType, setActivityType] = useState('call');
  const [activityNotes, setActivityNotes] = useState('');
  const [newTag, setNewTag] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLead = async () => {
    const res = await fetch(`/api/leads/${id}`);
    if (res.ok) setLead(await res.json());
  };

  useEffect(() => { fetchLead(); }, [id]);

  const updateStatus = async (newStatus: string) => {
    setSaving(true);
    await fetch(`/api/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    await fetchLead();
    setSaving(false);
  };

  const addActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityNotes.trim()) return;
    setSaving(true);
    await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: id, type: activityType, notes: activityNotes }),
    });
    setActivityNotes('');
    await fetchLead();
    setSaving(false);
  };

  const addTag = async (tagName: string) => {
    await fetch(`/api/leads/${id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_name: tagName }),
    });
    setNewTag('');
    await fetchLead();
  };

  const removeTag = async (tagName: string) => {
    await fetch(`/api/leads/${id}/tags`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_name: tagName }),
    });
    await fetchLead();
  };

  const adjustScore = async (delta: number, reason: string) => {
    await fetch(`/api/leads/${id}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta, reason }),
    });
    await fetchLead();
  };

  const setFollowup = async () => {
    if (!followupDate) return;
    await fetch(`/api/leads/${id}/followup`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ next_followup_date: followupDate, followup_status: 'pending' }),
    });
    setFollowupDate('');
    await fetchLead();
  };

  const markFollowupDone = async () => {
    await fetch(`/api/leads/${id}/followup`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followup_status: 'completed' }),
    });
    await fetchLead();
  };

  if (!lead) return <div className="text-neutral-500">Loading lead...</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => router.push('/admin/leads')} className="text-sm text-brand-600 hover:underline">← Back to Leads</button>

      {/* Lead Info Card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">{lead.name}</h2>
            <p className="text-sm text-neutral-500">{lead.organization || 'No organization'} · {lead.city || 'No city'}{lead.state ? `, ${lead.state}` : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">Score: {lead.score}</span>
            <span className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${STATUS_COLORS[lead.status] || ''}`}>
              {lead.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div><span className="text-xs text-neutral-400">Email</span><p className="text-sm">{lead.email}</p></div>
          <div><span className="text-xs text-neutral-400">Phone</span><p className="text-sm">{lead.phone || '—'}</p></div>
          <div><span className="text-xs text-neutral-400">Product Interest</span><p className="text-sm capitalize">{lead.productInterest}</p></div>
          <div><span className="text-xs text-neutral-400">Source</span><p className="text-sm capitalize">{lead.source}</p></div>
          <div><span className="text-xs text-neutral-400">Created</span><p className="text-sm">{new Date(lead.createdAt).toLocaleString()}</p></div>
          <div><span className="text-xs text-neutral-400">Updated</span><p className="text-sm">{new Date(lead.updatedAt).toLocaleString()}</p></div>
        </div>

        {lead.message && (
          <div className="mt-4 rounded-lg bg-neutral-50 p-3">
            <span className="text-xs text-neutral-400">Message</span>
            <p className="mt-1 text-sm text-neutral-700">{lead.message}</p>
          </div>
        )}

        {/* Pipeline Status Update */}
        <div className="mt-6">
          <span className="text-xs font-medium text-neutral-500">Update Pipeline Stage</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <button key={s} onClick={() => updateStatus(s)} disabled={saving || lead.status === s}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${lead.status === s ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'} disabled:opacity-50`}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-neutral-900">Tags</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {lead.tags.map(t => (
            <span key={t.tagName} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              {t.tagName}
              <button onClick={() => removeTag(t.tagName)} className="ml-1 text-brand-400 hover:text-red-500" aria-label={`Remove tag ${t.tagName}`}>×</button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {TAG_PRESETS.filter(t => !lead.tags.some(lt => lt.tagName === t)).map(t => (
            <button key={t} onClick={() => addTag(t)} className="rounded-full border border-dashed border-neutral-300 px-3 py-1 text-xs text-neutral-500 hover:border-brand-500 hover:text-brand-600">
              + {t}
            </button>
          ))}
          <div className="flex gap-1">
            <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Custom tag..." className="rounded-lg border border-neutral-300 px-2 py-1 text-xs w-24" />
            <button onClick={() => newTag.trim() && addTag(newTag.trim())} className="rounded-lg bg-neutral-100 px-2 py-1 text-xs hover:bg-neutral-200">Add</button>
          </div>
        </div>
      </div>

      {/* Lead Scoring */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-neutral-900">Lead Scoring (Current: {lead.score})</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {SCORE_ACTIONS.map(sa => (
            <button key={sa.label} onClick={() => adjustScore(sa.delta, sa.label)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${sa.delta > 0 ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
              {sa.delta > 0 ? '+' : ''}{sa.delta} {sa.label}
            </button>
          ))}
        </div>
      </div>

      {/* Follow-up */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-neutral-900">Follow-up</h3>
        {lead.nextFollowupDate && (
          <div className="mt-2 flex items-center gap-3">
            <span className="text-sm text-neutral-600">Next: {new Date(lead.nextFollowupDate).toLocaleDateString()}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${lead.followupStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {lead.followupStatus || 'pending'}
            </span>
            {lead.followupStatus !== 'completed' && (
              <button onClick={markFollowupDone} className="text-xs text-green-600 hover:underline">Mark Done</button>
            )}
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <input type="date" value={followupDate} onChange={e => setFollowupDate(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm" />
          <button onClick={setFollowup} disabled={!followupDate} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            Set Follow-up
          </button>
        </div>
      </div>

      {/* Demo Bookings */}
      {lead.demoBookings.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-neutral-900">Demo Bookings</h3>
          <div className="mt-3 space-y-2">
            {lead.demoBookings.map(demo => (
              <div key={demo.id} className="flex items-center justify-between rounded-lg bg-neutral-50 p-3">
                <div>
                  <span className="text-sm font-medium">{demo.scheduledDate} at {demo.scheduledTime}</span>
                  {demo.notes && <p className="text-xs text-neutral-500">{demo.notes}</p>}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  demo.status === 'completed' ? 'bg-green-100 text-green-700' :
                  demo.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-purple-100 text-purple-700'
                }`}>{demo.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Logs */}
      {lead.whatsappLogs && lead.whatsappLogs.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-neutral-900">WhatsApp Messages</h3>
          <div className="mt-3 space-y-2">
            {lead.whatsappLogs.map(log => (
              <div key={log.id} className="rounded-lg bg-green-50 p-3">
                <p className="text-sm text-neutral-700">{log.message}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-neutral-400">{new Date(log.createdAt).toLocaleString()}</span>
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">{log.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Activity */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-neutral-900">Add Activity</h3>
        <form onSubmit={addActivity} className="mt-3 flex flex-wrap gap-3">
          <select value={activityType} onChange={e => setActivityType(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" aria-label="Activity type">
            {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="text" value={activityNotes} onChange={e => setActivityNotes(e.target.value)} placeholder="Notes..."
            className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <button type="submit" disabled={saving || !activityNotes.trim()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            Add
          </button>
        </form>
      </div>

      {/* Activity Timeline */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-neutral-900">Activity Timeline</h3>
        {lead.activities.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-400">No activities yet</p>
        ) : (
          <div className="mt-3 space-y-3">
            {lead.activities.map(act => (
              <div key={act.id} className="flex gap-3 border-l-2 border-neutral-200 pl-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium capitalize text-neutral-600">{act.type}</span>
                    <span className="text-xs text-neutral-400">{new Date(act.createdAt).toLocaleString()}</span>
                  </div>
                  {act.notes && <p className="mt-1 text-sm text-neutral-700">{act.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
