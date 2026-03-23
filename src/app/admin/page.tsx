'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalLeads: number;
  newLeads: number;
  contacted: number;
  demoScheduled: number;
  converted: number;
  lost: number;
  upcomingDemos: number;
  recentActivities: number;
  activeCampaigns: number;
  pendingFollowups: number;
  conversionRate: string;
  demoRate: string;
  responseRate: string;
  leadsBySource: { source: string; count: number }[];
  leadsByProduct: { product: string; count: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats);
  }, []);

  if (!stats) return <div className="text-neutral-500">Loading dashboard...</div>;

  const pipelineCards = [
    { label: 'Total Leads', value: stats.totalLeads, color: 'bg-brand-50 text-brand-700', href: '/admin/leads' },
    { label: 'New', value: stats.newLeads, color: 'bg-blue-50 text-blue-700', href: '/admin/leads?status=new' },
    { label: 'Contacted', value: stats.contacted, color: 'bg-yellow-50 text-yellow-700', href: '/admin/leads?status=contacted' },
    { label: 'Demo Scheduled', value: stats.demoScheduled, color: 'bg-purple-50 text-purple-700', href: '/admin/leads?status=demo_scheduled' },
    { label: 'Converted', value: stats.converted, color: 'bg-green-50 text-green-700', href: '/admin/leads?status=converted' },
    { label: 'Lost', value: stats.lost, color: 'bg-red-50 text-red-700', href: '/admin/leads?status=lost' },
    { label: 'Upcoming Demos', value: stats.upcomingDemos, color: 'bg-indigo-50 text-indigo-700', href: '/admin/demos' },
    { label: 'Activities', value: stats.recentActivities, color: 'bg-neutral-100 text-neutral-700', href: '/admin/activities' },
  ];

  return (
    <div className="space-y-6">
      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {pipelineCards.map(card => (
          <Link key={card.label} href={card.href} className={`rounded-xl p-5 ${card.color} transition-shadow hover:shadow-card`}>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="mt-1 text-sm opacity-80">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Conversion Metrics + Phase 4 Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="text-2xl font-bold text-green-600">{stats.conversionRate}%</div>
          <div className="mt-1 text-sm text-neutral-500">Conversion Rate</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="text-2xl font-bold text-purple-600">{stats.demoRate}%</div>
          <div className="mt-1 text-sm text-neutral-500">Demo Rate</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="text-2xl font-bold text-blue-600">{stats.responseRate}%</div>
          <div className="mt-1 text-sm text-neutral-500">Response Rate</div>
        </div>
        <Link href="/admin/campaigns" className="rounded-xl border border-neutral-200 bg-white p-5 hover:shadow-card transition-shadow">
          <div className="text-2xl font-bold text-orange-600">{stats.activeCampaigns}</div>
          <div className="mt-1 text-sm text-neutral-500">Active Campaigns</div>
        </Link>
        <Link href="/admin/followups" className="rounded-xl border border-neutral-200 bg-white p-5 hover:shadow-card transition-shadow">
          <div className="text-2xl font-bold text-red-600">{stats.pendingFollowups}</div>
          <div className="mt-1 text-sm text-neutral-500">Pending Follow-ups</div>
        </Link>
      </div>

      {/* Leads by Source & Product */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">Leads by Source</h3>
          <div className="space-y-2">
            {stats.leadsBySource.map(s => (
              <div key={s.source} className="flex items-center justify-between">
                <span className="text-sm capitalize text-neutral-600">{s.source}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-brand-200" style={{ width: `${Math.max(20, (s.count / stats.totalLeads) * 200)}px` }} />
                  <span className="text-sm font-medium text-neutral-900">{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">Leads by Product</h3>
          <div className="space-y-2">
            {stats.leadsByProduct.map(p => (
              <div key={p.product} className="flex items-center justify-between">
                <span className="text-sm capitalize text-neutral-600">{p.product}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-purple-200" style={{ width: `${Math.max(20, (p.count / stats.totalLeads) * 200)}px` }} />
                  <span className="text-sm font-medium text-neutral-900">{p.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
