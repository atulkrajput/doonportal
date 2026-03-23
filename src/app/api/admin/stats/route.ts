import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const [
      totalLeads, newLeads, contacted, demoScheduled, converted, lost,
      upcomingDemos, recentActivities,
      activeCampaigns, pendingFollowups,
      leadsBySource, leadsByProduct,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: 'new' } }),
      prisma.lead.count({ where: { status: 'contacted' } }),
      prisma.lead.count({ where: { status: 'demo_scheduled' } }),
      prisma.lead.count({ where: { status: 'converted' } }),
      prisma.lead.count({ where: { status: 'lost' } }),
      prisma.demoBooking.count({ where: { status: 'scheduled' } }),
      prisma.activity.count(),
      prisma.campaign.count({ where: { status: 'active' } }),
      prisma.lead.count({ where: { nextFollowupDate: { not: null }, OR: [{ followupStatus: 'pending' }, { followupStatus: null }] } }),
      prisma.lead.groupBy({ by: ['source'], _count: { id: true } }),
      prisma.lead.groupBy({ by: ['productInterest'], _count: { id: true } }),
    ]);

    // Conversion metrics
    const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : '0';
    const demoRate = totalLeads > 0 ? (((demoScheduled + converted) / totalLeads) * 100).toFixed(1) : '0';
    const responseRate = totalLeads > 0 ? (((contacted + demoScheduled + converted) / totalLeads) * 100).toFixed(1) : '0';

    return NextResponse.json({
      totalLeads, newLeads, contacted, demoScheduled, converted, lost,
      upcomingDemos, recentActivities,
      activeCampaigns, pendingFollowups,
      conversionRate, demoRate, responseRate,
      leadsBySource: leadsBySource.map(s => ({ source: s.source, count: s._count.id })),
      leadsByProduct: leadsByProduct.map(p => ({ product: p.productInterest, count: p._count.id })),
    });
  } catch (error) {
    console.error('[API] GET /api/admin/stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
