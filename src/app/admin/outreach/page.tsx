'use client';

import { useEffect, useState } from 'react';

interface Template {
  id: number;
  name: string;
  subject: string;
  body: string;
}

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  status: string;
  tags: { tagName: string }[];
}

type Tab = 'email' | 'whatsapp' | 'templates';

export default function OutreachPage() {
  const [tab, setTab] = useState<Tab>('email');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  // Email form
  const [emailTemplateId, setEmailTemplateId] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // WhatsApp form
  const [waMessage, setWaMessage] = useState('');

  // Template form
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [tplForm, setTplForm] = useState({ name: '', subject: '', body: '' });

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  const fetchTemplates = async () => {
    const res = await fetch('/api/email-templates');
    const data = await res.json();
    setTemplates(data.templates || []);
  };

  const fetchLeads = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (cityFilter) params.set('city', cityFilter);
    if (tagFilter) params.set('tag', tagFilter);
    params.set('limit', '200');
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads || []);
  };

  useEffect(() => { fetchTemplates(); }, []);
  useEffect(() => { fetchLeads(); }, [search, cityFilter, tagFilter]);

  const toggleLead = (id: number) => {
    setSelectedLeads(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedLeads.length === leads.length) setSelectedLeads([]);
    else setSelectedLeads(leads.map(l => l.id));
  };

  const sendEmails = async () => {
    if (selectedLeads.length === 0) return;
    setSending(true);
    setResult('');
    const res = await fetch('/api/outreach/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_ids: selectedLeads,
        template_id: emailTemplateId || undefined,
        subject: emailSubject || undefined,
        body: emailBody || undefined,
      }),
    });
    const data = await res.json();
    setResult(`Sent: ${data.sent}, Failed: ${data.failed || 0}`);
    setSending(false);
  };

  const sendWhatsApp = async () => {
    if (selectedLeads.length === 0 || !waMessage.trim()) return;
    setSending(true);
    setResult('');
    const res = await fetch('/api/outreach/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_ids: selectedLeads, message: waMessage }),
    });
    const data = await res.json();
    setResult(`WhatsApp sent: ${data.sent}`);
    setSending(false);
  };

  const createTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/email-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tplForm),
    });
    setTplForm({ name: '', subject: '', body: '' });
    setShowTemplateForm(false);
    await fetchTemplates();
  };

  const deleteTemplate = async (id: number) => {
    await fetch(`/api/email-templates/${id}`, { method: 'DELETE' });
    await fetchTemplates();
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1">
        {(['email', 'whatsapp', 'templates'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
            {t === 'whatsapp' ? 'WhatsApp' : t}
          </button>
        ))}
      </div>

      {result && <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{result}</div>}

      {/* Lead Selection (shared for email & whatsapp) */}
      {tab !== 'templates' && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-900">Select Leads ({selectedLeads.length} selected)</h3>
          <div className="flex flex-wrap gap-2">
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm" />
            <input type="text" placeholder="City..." value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm" />
            <input type="text" placeholder="Tag..." value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm" />
            <button onClick={selectAll} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm hover:bg-neutral-200">
              {selectedLeads.length === leads.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {leads.map(l => (
              <label key={l.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-neutral-50 cursor-pointer text-sm">
                <input type="checkbox" checked={selectedLeads.includes(l.id)} onChange={() => toggleLead(l.id)} />
                <span className="font-medium">{l.name}</span>
                <span className="text-neutral-400">{l.email}</span>
                {l.city && <span className="text-neutral-400">· {l.city}</span>}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Email Tab */}
      {tab === 'email' && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-900">Send Email</h3>
          <select value={emailTemplateId} onChange={e => {
            setEmailTemplateId(e.target.value);
            const tpl = templates.find(t => t.id === parseInt(e.target.value));
            if (tpl) { setEmailSubject(tpl.subject); setEmailBody(tpl.body); }
          }} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" aria-label="Select template">
            <option value="">Custom email (no template)</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input type="text" placeholder="Subject" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm" />
          <textarea placeholder="Body (HTML supported, use {{name}} and {{organization}} for personalization)" value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={5} className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm" />
          <button onClick={sendEmails} disabled={sending || selectedLeads.length === 0} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {sending ? 'Sending...' : `Send to ${selectedLeads.length} leads`}
          </button>
        </div>
      )}

      {/* WhatsApp Tab */}
      {tab === 'whatsapp' && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-900">Send WhatsApp Message</h3>
          <p className="text-xs text-neutral-400">Messages are logged and ready for WhatsApp API integration. Use {'{{name}}'} and {'{{organization}}'} for personalization.</p>
          <textarea placeholder="Message..." value={waMessage} onChange={e => setWaMessage(e.target.value)} rows={4} className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm" />
          <button onClick={sendWhatsApp} disabled={sending || selectedLeads.length === 0 || !waMessage.trim()} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
            {sending ? 'Sending...' : `Send to ${selectedLeads.length} leads`}
          </button>
        </div>
      )}

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <button onClick={() => setShowTemplateForm(!showTemplateForm)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            + New Template
          </button>
          {showTemplateForm && (
            <form onSubmit={createTemplate} className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
              <input type="text" placeholder="Template name" value={tplForm.name} onChange={e => setTplForm({ ...tplForm, name: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm" />
              <input type="text" placeholder="Subject" value={tplForm.subject} onChange={e => setTplForm({ ...tplForm, subject: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm" />
              <textarea placeholder="Body (HTML)" value={tplForm.body} onChange={e => setTplForm({ ...tplForm, body: e.target.value })} rows={5} className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm" />
              <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Save Template</button>
            </form>
          )}
          <div className="space-y-3">
            {templates.map(t => (
              <div key={t.id} className="rounded-xl border border-neutral-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-neutral-900">{t.name}</h4>
                    <p className="text-sm text-neutral-500">Subject: {t.subject}</p>
                  </div>
                  <button onClick={() => deleteTemplate(t.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
