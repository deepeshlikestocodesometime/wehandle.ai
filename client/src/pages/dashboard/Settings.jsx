import React, { useState } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  Users, 
  Sparkles, 
  Code, 
  CreditCard, 
  Shield, 
  Check,
  ChevronRight,
  Plus,
  RefreshCw,
  Zap
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

const TABS = [
  { id: 'general', name: 'General', icon: SettingsIcon },
  { id: 'team', name: 'Team Access', icon: Users },
  { id: 'identity', name: 'AI Identity', icon: Sparkles },
  { id: 'widget', name: 'Widget Style', icon: Code },
  { id: 'billing', name: 'Billing', icon: CreditCard },
  { id: 'security', name: 'Security', icon: Shield },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('identity');
  
  // State for AI sliders
  const [tone, setTone] = useState(7);
  const [length, setLength] = useState(4);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-180px)] animate-lift">
        {/* THE SETTINGS MONOLITH */}
        <div className="card-monolith h-full flex overflow-hidden border-none shadow-2xl">
          
          {/* INNER SIDEBAR: Tab Navigation (Obsidian) */}
          <aside className="w-64 border-r border-surface-border flex flex-col bg-surface">
            <div className="p-6 border-b border-surface-border">
              <h2 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Settings</h2>
            </div>
            
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all text-left group",
                    activeTab === tab.id 
                      ? "bg-surface-highlight text-white border border-surface-border shadow-lg" 
                      : "text-ink-mutedOnDark hover:bg-white/[0.02] hover:text-white"
                  )}
                >
                  <tab.icon className={cn(
                    "w-4 h-4 transition-colors",
                    activeTab === tab.id ? "text-ai" : "text-ink-mutedOnDark/40 group-hover:text-ink-mutedOnDark"
                  )} />
                  <span className="text-sm font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
            
            {/* Version Stamp */}
            <div className="p-6 text-[10px] font-mono text-ink-mutedOnDark/30 uppercase tracking-widest">
              v1.0.4-stable
            </div>
          </aside>

          {/* MAIN SETTINGS CONTENT (Obsidian Deep) */}
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-surface-highlight/30 p-12">
            <div className="max-w-3xl">
              
              {/* TAB: IDENTITY STUDIO (Brand Voice Refinement) */}
              {activeTab === 'identity' && (
                <div className="space-y-10 animate-lift">
                  <div>
                    <h1 className="text-2xl font-bold text-white">AI Identity Studio</h1>
                    <p className="text-ink-mutedOnDark mt-2 font-serif italic">Refine how your copilot speaks to the world.</p>
                  </div>

                  {/* Sliders Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <label className="text-xs font-bold text-white uppercase tracking-widest">Formal vs Casual</label>
                          <span className="text-xs font-mono text-ai">{tone > 5 ? 'Professional' : 'Friendly'}</span>
                        </div>
                        <input 
                          type="range" min="1" max="10" value={tone} 
                          onChange={(e) => setTone(e.target.value)}
                          className="w-full h-1.5 bg-surface rounded-full appearance-none cursor-pointer accent-ai"
                        />
                        <div className="flex justify-between text-[10px] text-ink-mutedOnDark font-bold uppercase tracking-tighter">
                          <span>Concierge</span>
                          <span>Peer</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <label className="text-xs font-bold text-white uppercase tracking-widest">Response Length</label>
                          <span className="text-xs font-mono text-ai">{length > 5 ? 'Detailed' : 'Concise'}</span>
                        </div>
                        <input 
                          type="range" min="1" max="10" value={length} 
                          onChange={(e) => setLength(e.target.value)}
                          className="w-full h-1.5 bg-surface rounded-full appearance-none cursor-pointer accent-ai"
                        />
                      </div>
                    </div>

                    {/* Preview Bubble */}
                    <div className="p-6 bg-surface border border-surface-border rounded-2xl shadow-xl space-y-4 relative">
                       <div className="flex items-center gap-2 mb-2">
                         <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                         <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Persona Preview</span>
                       </div>
                       <div className="p-4 bg-surface-highlight border border-surface-border rounded-xl rounded-tl-none">
                         <p className="text-sm text-ink-mutedOnDark leading-relaxed italic">
                           "I've checked your shipment #8821. It's moving through the network as scheduled. Should arrive tomorrow! {tone < 5 ? '✨' : ''}"
                         </p>
                       </div>
                       <button className="flex items-center gap-2 text-[10px] font-bold text-ai uppercase tracking-widest hover:text-white transition-colors">
                         <RefreshCw className="w-3 h-3" /> Regenerate
                       </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: BILLING (Luxury Plan View) */}
              {activeTab === 'billing' && (
                <div className="space-y-10 animate-lift">
                  <div>
                    <h1 className="text-2xl font-bold text-white">Subscription & Usage</h1>
                    <p className="text-ink-mutedOnDark mt-2">Manage your plan and resource allocation.</p>
                  </div>

                  {/* PREMIUM CARD */}
                  <div className="relative p-8 rounded-3xl bg-gradient-to-br from-surface-highlight to-surface border border-white/5 overflow-hidden group shadow-2xl h-56 flex flex-col justify-between">
                    {/* Abstract design elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-ai/5 rounded-full blur-3xl group-hover:bg-ai/10 transition-all duration-700" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                    
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <span className="px-3 py-1 bg-white text-surface text-[10px] font-bold uppercase tracking-[0.2em] rounded-full">
                          Growth Plan
                        </span>
                        <h2 className="text-4xl font-mono mt-4 font-medium text-white">$249<span className="text-lg opacity-50">/mo</span></h2>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-ink-mutedOnDark uppercase tracking-widest">Active Store</p>
                        <p className="text-sm font-bold text-white">LUMINAIRE CO.</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-end relative z-10">
                      <div className="text-xs font-mono text-ink-mutedOnDark">
                        RENEWAL: MAR 01, 2026
                      </div>
                      <div className="flex gap-2">
                        <div className="w-8 h-5 bg-white/10 rounded border border-white/10 flex items-center justify-center">
                          <CreditCard className="w-3 h-3 text-white/40" />
                        </div>
                        <span className="text-xs font-mono text-white">•••• 4242</span>
                      </div>
                    </div>
                  </div>

                  {/* USAGE METERS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <UsageMeter label="AI Conversations" current={3247} max={5000} />
                    <UsageMeter label="Knowledge Points" current={124} max={500} />
                  </div>

                  <div className="pt-6 border-t border-surface-border">
                    <Button variant="ghost" className="text-xs font-bold text-ink-mutedOnDark uppercase tracking-widest hover:text-white">
                      View Invoice History <ChevronRight className="ml-1 w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB: SECURITY (API Keys) */}
              {activeTab === 'security' && (
                <div className="space-y-10 animate-lift">
                  <div>
                    <h1 className="text-2xl font-bold text-white">System Security</h1>
                    <p className="text-ink-mutedOnDark mt-2">Manage API access and encryption keys.</p>
                  </div>

                  <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-white uppercase tracking-widest">Production API Key</label>
                        <span className="px-2 py-0.5 bg-success/10 text-success text-[9px] font-bold uppercase border border-success/20 rounded">Live</span>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="password" readOnly 
                          value="wh_live_283749283749283749"
                          className="flex-1 bg-surface-highlight border border-surface-border rounded-lg px-4 py-2 font-mono text-sm text-ai outline-none"
                        />
                        <Button className="h-10 px-4">Copy</Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border border-error/20 bg-error/5 rounded-xl">
                    <h4 className="text-xs font-bold text-error uppercase tracking-widest flex items-center gap-2">
                      <Shield className="w-3 h-3" /> Advanced Protection
                    </h4>
                    <p className="text-[10px] text-error/60 mt-2 leading-relaxed">
                      Two-factor authentication is currently disabled. We recommend enabling it for all administrator accounts to prevent unauthorized store access.
                    </p>
                    <button className="mt-4 text-[10px] font-bold text-error uppercase tracking-widest hover:underline">
                      Setup 2FA now
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>

        </div>
      </div>
    </DashboardLayout>
  );
}

function UsageMeter({ label, current, max }) {
  const percent = (current / max) * 100;
  return (
    <div className="bg-surface border border-surface-border p-5 rounded-xl space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-ink-mutedOnDark uppercase tracking-widest">{label}</span>
        <span className="text-xs font-mono text-white">{current} <span className="opacity-30">/ {max}</span></span>
      </div>
      <div className="h-1.5 bg-surface-highlight rounded-full overflow-hidden">
        <div className="h-full bg-ai shadow-glow transition-all duration-1000" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}