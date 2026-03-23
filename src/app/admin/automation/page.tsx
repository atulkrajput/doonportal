'use client';

import { useEffect, useState } from 'react';

interface Rule {
  id: number;
  name: string;
  trigger: string;
  action: string;
  templateId: number | null;
  enabled: boolean;
  createdAt: string;
}

const TRIGGERS = [
  { value: 'new_lead', label: 'New lead created' },
  { value: 'no_contact_2days', label: 'Lead not contacted in 2 days' },
  { value: 'demo_completed', label: 'Demo completed' },
];

const ACTIONS = [
  { value: 'send_email', label: 'Send email' },
  { value: 'mark_followup', label: 'Mark for follow-up' },
  { value: 'send_whatsapp', label: 'Send WhatsApp message' },
];

export default function AutomationPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', trigger: 'new_lead', action: 'send_email', template_id: '' });
  const [saving, setSaving] = useState(false);

  const fetchRules = async () => {
    const res = await fetch('/api/automation');
    const data = await res.json();
    setRules(data.rules || []);
  };

  useEffect(() => { fetchRules(); }, []);

  const createRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch('/api/automation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ name: '', trigger: 'new_lead', action: 'send_email', template_id: '' });
    setShowCreate(false);
    await fetchRules();
    setSaving(false);
  };

  const toggleRule = async (id: number, enabled: boolean) => {
    await fetch(`/api/automation/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !enabled }),
    });
    await fetchRules();
  };

  const deleteRule = async (id: number) => {
    await fetch(`/api/automation/${id}`, { method: 'DELETE' });
    await fetchRules();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">Automation rules trigger actions when events occur in the lead pipeline.</p>
        <button onClick={() => setShowCreate(!showCreate)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          + New Rule
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createRule} className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
          <input type="text" placeholder="Rule name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm" />
          <div className="flex gap-3">
            <select value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })} className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm" aria-label="Trigger">
              {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm" aria-label="Action">
              {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving || !form.name.trim()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            Create Rule
          </button>
        </form>
      )}

      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-400">No automation rules yet</div>
        ) : rules.map(rule => (
          <div key={rule.id} className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-neutral-900">{rule.name}</h4>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rule.enabled ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                    {rule.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  When: {TRIGGERS.find(t => t.value === rule.trigger)?.label || rule.trigger} → {ACTIONS.find(a => a.value === rule.action)?.label || rule.action}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleRule(rule.id, rule.enabled)} className="text-xs text-brand-600 hover:underline">
                  {rule.enabled ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => deleteRule(rule.id)} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
