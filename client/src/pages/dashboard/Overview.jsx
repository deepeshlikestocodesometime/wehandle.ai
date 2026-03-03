import React, { useEffect, useState } from 'react';
import { Zap, Clock, DollarSign, Users, Activity, Sparkles, ArrowUpRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { dashboardApi } from '../../lib/api';
import { cn } from '../../lib/utils';

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const statsData = await dashboardApi.getStats();
      const activityData = await dashboardApi.getRecentActivity();
      setStats(statsData);
      setRecentActivity(activityData);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-2 border-gray-100 border-t-ai rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-lift">
        
        {/* Editorial Header */}
        <div>
          <h1 className="text-3xl font-bold text-ink-base">The Pulse</h1>
          <p className="text-ink-muted mt-1 font-serif italic text-lg">Real-time intelligence from your storefront</p>
        </div>
        
        {/* Monolith Stat Grid (Dark Cards on Light Page) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="ROI Impact" value={`$${stats.moneySaved}`} icon={DollarSign} trend="+23%" isViolet={true} footer="Based on $15/ticket" />
          <StatCard title="Auto-Resolutions" value={stats.ticketsResolved} icon={Zap} trend="+12%" footer={`${stats.resolutionRate}% Success`} />
          <StatCard title="Response Speed" value={`${stats.avgResponseTime}s`} icon={Clock} trend="-89%" footer="Instant AI Interaction" />
          <StatCard title="CSAT Index" value={stats.csatScore} icon={Users} trend="4.8" subLabel="/ 5.0" footer="847 Customer Ratings" />
        </div>

        {/* Live Feed: Dark Container */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-ink-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-ai" /> Neural Feed
            </h3>
            <button className="text-sm font-bold text-ai hover:underline uppercase tracking-widest">History</button>
          </div>

          <div className="card-monolith overflow-hidden">
            <div className="divide-y divide-surface-border">
              {recentActivity.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon: Icon, trend, footer, isViolet, subLabel }) {
  return (
    <div className="card-monolith p-6 group hover:bg-surface-highlight transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
          isViolet ? "bg-ai/20 text-ai shadow-glow" : "bg-surface-border text-ink-mutedOnDark"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">
          <ArrowUpRight className="w-3 h-3 mr-1" /> {trend}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-ink-mutedOnDark uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-mono font-medium text-white">
          {value} <span className="text-sm font-normal text-ink-mutedOnDark">{subLabel}</span>
        </h3>
        <p className="text-[10px] text-ink-mutedOnDark/50 mt-4 uppercase tracking-tighter border-t border-surface-border pt-3">{footer}</p>
      </div>
    </div>
  );
}

function ActivityItem({ item }) {
  const isResolved = item.status === 'resolved_ai';
  return (
    <div className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-md flex items-center justify-center border",
          isResolved ? "bg-ai/10 text-ai border-ai/20" : "bg-warning/10 text-warning border-warning/20"
        )}>
          {isResolved ? <Sparkles className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
        </div>
        <div>
          <p className="text-sm font-bold text-white">{item.summary}</p>
          <p className="text-xs text-ink-mutedOnDark uppercase tracking-wider font-mono">
            {item.customer} • {item.type}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-mono text-ink-mutedOnDark/40">{item.time}</span>
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
          isResolved ? "bg-ai text-white border-ai shadow-glow" : "bg-warning/10 text-warning border-warning/20"
        )}>
          {isResolved ? "Autopilot" : "Needs You"}
        </div>
      </div>
    </div>
  );
}