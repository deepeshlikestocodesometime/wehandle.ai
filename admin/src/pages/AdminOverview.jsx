import React from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Cpu, 
  User, 
  TrendingUp, 
  Globe, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Server, 
  ShieldAlert,
  Activity
} from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { cn } from '../lib/utils';

const GLOBAL_STATS = [
  { label: "Platform MRR", value: "$42,800", trend: "+12.4%", icon: DollarSign },
  { label: "Client Stores", value: "154", trend: "+8", icon: ShoppingBag },
  { label: "Total Resolutions", value: "84.2k", trend: "+18%", icon: Cpu },
  { label: "Global CSAT", value: "4.82", trend: "+0.02", icon: User },
];

const CLIENT_LEDGER = [
  { id: 1, name: "Luminaire Co.", platform: "Shopify", plan: "Growth", usage: "82%", status: "healthy", mrr: "$249" },
  { id: 2, name: "Atlas Outdoors", platform: "Woo", plan: "Scale", usage: "45%", status: "healthy", mrr: "$499" },
  { id: 3, name: "Zenith Beauty", platform: "Shopify", plan: "Growth", usage: "98%", status: "warning", mrr: "$249" },
  { id: 4, name: "Urban Tech", platform: "Custom", plan: "Enterprise", usage: "12%", status: "healthy", mrr: "$1,200" },
];

export default function AdminOverview() {
  return (
    <AdminLayout>
      <div className="space-y-10 animate-lift">
        
        {/* Editorial Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-base tracking-tight">Global Pulse</h1>
            <p className="text-ink-muted font-serif italic text-lg mt-1">Cross-platform infrastructure intelligence</p>
          </div>
          <div className="flex gap-4 items-center">
             <div className="text-right">
               <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Network Latency</p>
               <p className="text-xs font-mono font-bold text-success">24ms (Optimal)</p>
             </div>
             <div className="w-12 h-12 rounded-full bg-ai/5 border border-ai/10 flex items-center justify-center">
               <Activity className="w-6 h-6 text-ai animate-pulse" />
             </div>
          </div>
        </div>

        {/* Global Stat Cards: Obsidian Monoliths on Milk Canvas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {GLOBAL_STATS.map((stat, i) => (
            <div key={i} className="card-monolith p-6 group hover:bg-surface-highlight transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-ai group-hover:text-white transition-colors">
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="flex items-center text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">
                   {stat.trend}
                </div>
              </div>
              <p className="text-xs font-bold text-ink-mutedOnDark uppercase tracking-widest mb-1 opacity-60">{stat.label}</p>
              <h3 className="text-3xl font-mono font-medium text-white">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Client Ledger Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-ink-base flex items-center gap-2">
              <Globe className="w-5 h-5 text-ai" /> Client Ledger
            </h3>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search stores..." 
                  className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-ai transition-all w-64" 
                />
              </div>
              <button className="px-4 py-2 bg-surface text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-black transition-all flex items-center gap-2">
                <Plus className="w-3 h-3" /> Add Instance
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-float overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-canvas-muted border-b border-gray-200">
                <tr>
                  {["Store Name", "Platform", "Tier", "AI Usage", "Status", "Revenue", ""].map((h) => (
                    <th key={h} className="px-6 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {CLIENT_LEDGER.map((client) => (
                  <tr key={client.id} className="hover:bg-canvas-muted/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-ink-base">{client.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-ink-muted font-mono">{client.platform}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-surface text-white border border-surface-border">
                        {client.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-1000",
                              client.usage.replace('%','') > 90 ? "bg-error" : "bg-ai"
                            )} 
                            style={{ width: client.usage }} 
                          />
                        </div>
                        <span className="text-[10px] font-mono text-ink-muted">{client.usage}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]",
                          client.status === 'healthy' ? "text-success bg-success" : "text-warning bg-warning animate-pulse"
                        )} />
                        <span className="text-xs capitalize text-ink-muted font-medium">{client.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-bold text-ink-base">{client.mrr}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-gray-300 hover:text-ink-base transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Infrastructure & Alerts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
          <div className="card-monolith p-8 h-80 flex flex-col">
            <div className="flex justify-between items-start mb-8">
               <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
                 <Server className="w-4 h-4 text-ai" /> Global Request Volume
               </h4>
               <span className="text-[10px] font-mono text-success bg-success/10 px-2 py-1 rounded">SYSTEM: NOMINAL</span>
            </div>
            <div className="flex-1 flex items-end gap-1.5 px-2">
               {[40, 45, 30, 55, 70, 65, 80, 85, 40, 35, 50, 60, 45, 55, 65, 75, 80, 70, 60, 50, 40, 30, 45, 60].map((h, i) => (
                 <div 
                  key={i} 
                  className="flex-1 bg-white/5 rounded-t-[2px] hover:bg-ai/50 transition-all cursor-crosshair group relative"
                  style={{ height: `${h}%` }}
                 >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ai text-white text-[8px] font-bold px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {h*12} REQ
                    </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="card-monolith p-8 flex flex-col border-ai/20 shadow-glow">
            <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
              <ShieldAlert className="w-4 h-4 text-ai" /> Priority Intelligence
            </h4>
            <div className="space-y-4 flex-1">
              <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-white font-bold">Limit Exceeded</p>
                  <p className="text-[10px] text-error">Zenith Beauty has reached 98% of Growth Tier.</p>
                </div>
                <button className="text-[9px] font-bold uppercase tracking-widest text-white px-3 py-2 bg-error rounded-lg shadow-lg">Scale Plan</button>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-white font-bold">New Deployment</p>
                  <p className="text-[10px] text-ink-mutedOnDark">Streetwear X requested Shopify Auth.</p>
                </div>
                <button className="text-[9px] font-bold uppercase tracking-widest text-white px-3 py-2 bg-ai rounded-lg shadow-glow">Approve</button>
              </div>
            </div>
            <button className="w-full mt-6 py-3 border border-surface-border rounded-xl text-[10px] font-bold text-ink-mutedOnDark hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest">
              Review Master Logs
            </button>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}