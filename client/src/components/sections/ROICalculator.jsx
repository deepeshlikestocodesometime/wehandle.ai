import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, TrendingUp, ShieldCheck, ArrowRight, Brain, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

const SERVICES = [
  { id: 'tracking', name: 'Order Tracking', boost: 25, desc: 'WISMO inquiries' },
  { id: 'policy', name: 'Policy & FAQ', boost: 20, desc: 'Returns, shipping info' },
  { id: 'refunds', name: 'Refund Processing', boost: 15, desc: 'Automated logic' },
  { id: 'social', name: 'Social DMs', boost: 15, desc: 'IG & WhatsApp' },
];

export default function ROICalculator() {
  const [volume, setVolume] = useState(5000);
  const [humanCost, setHumanCost] = useState(15);
  const [activeServices, setActiveServices] = useState(['tracking', 'policy']);
  
  const [metrics, setMetrics] = useState({
    savings: 0,
    resolutionRate: 0,
    hoursSaved: 0
  });

  useEffect(() => {
    // 20% base + individual service boosts
    const resRate = Math.min(85, 20 + activeServices.reduce((acc, id) => {
      const service = SERVICES.find(s => s.id === id);
      return acc + (service?.boost || 0);
    }, 0));

    const automatedTickets = volume * (resRate / 100);
    const currentCost = volume * humanCost;
    
    // WeHandle Logic: $0.90 per resolved ticket, $0 fixed monthly.
    const remainingHumanCost = (volume - automatedTickets) * humanCost;
    const weHandleCost = automatedTickets * 0.90;
    const totalNewCost = remainingHumanCost + weHandleCost;
    
    const monthlySavings = Math.max(0, currentCost - totalNewCost);
    const hours = Math.round((automatedTickets * 6) / 60);

    setMetrics({
      savings: monthlySavings,
      resolutionRate: resRate,
      hoursSaved: hours
    });
  }, [volume, humanCost, activeServices]);

  const toggleService = (id) => {
    setActiveServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <section className="py-32 bg-white" id="roi-engine">
      <div className="max-w-7xl mx-auto px-10">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          
          {/* LEFT: CONTROLS */}
          <div className="lg:w-1/2 space-y-12 animate-lift">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-mist border border-violet-core/10 text-violet-core text-[10px] font-bold uppercase tracking-widest">
                <Brain className="w-3 h-3" /> ROI Engine v2.0
              </div>
              <h2 className="text-6xl font-bold tracking-tighter text-ink-base leading-none">The Economics.</h2>
              <p className="text-xl text-ink-muted font-serif italic max-w-md">
                Customize your co-pilot to measure the exact impact on your operational bottom line.
              </p>
            </div>

            {/* Range Sliders */}
            <div className="space-y-10 bg-platinum-canvas p-10 rounded-[32px] border border-border-mist shadow-sm">
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink-muted">Monthly Ticket Volume</label>
                  <span className="text-3xl font-mono font-medium text-ink-base">{volume.toLocaleString()}</span>
                </div>
                <input 
                  type="range" min="1000" max="100000" step="1000" 
                  value={volume} onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-border-stone rounded-full appearance-none cursor-pointer accent-ai"
                />
              </div>

              <div className="space-y-6 pt-4 border-t border-border-mist">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink-muted">Human Cost Per Ticket</label>
                  <span className="text-3xl font-mono font-medium text-ink-base">${humanCost}</span>
                </div>
                <input 
                  type="range" min="5" max="50" step="1" 
                  value={humanCost} onChange={(e) => setHumanCost(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-border-stone rounded-full appearance-none cursor-pointer accent-ai"
                />
              </div>
            </div>

            {/* Service Module Toggles */}
            <div className="space-y-6">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink-muted ml-2">Active Intelligence Modules</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SERVICES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    className={cn(
                      "p-6 rounded-2xl border transition-all duration-500 text-left group",
                      activeServices.includes(s.id)
                        ? "bg-ai border-ai shadow-violet-glow"
                        : "bg-white border-border-mist hover:border-ai/30"
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        activeServices.includes(s.id) ? "bg-white/20 text-white" : "bg-platinum-haze text-ai"
                      )}>
                        <Check className={cn("w-4 h-4 transition-opacity", activeServices.includes(s.id) ? "opacity-100" : "opacity-0")} />
                      </div>
                      <span className={cn("text-[10px] font-bold font-mono", activeServices.includes(s.id) ? "text-white/60" : "text-ai")}>
                        +{s.boost}% Efficiency
                      </span>
                    </div>
                    <h4 className={cn("font-bold text-sm", activeServices.includes(s.id) ? "text-white" : "text-ink-base")}>{s.name}</h4>
                    <p className={cn("text-[10px] mt-1 leading-relaxed", activeServices.includes(s.id) ? "text-white/50" : "text-ink-muted")}>{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: OUTCOME (The Monolith) */}
          <div className="lg:w-1/2 w-full lg:sticky lg:top-32">
            <div className="card-monolith bg-surface p-12 space-y-12 overflow-hidden border-none shadow-2xl relative">
              {/* Inner Radial Glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-ai/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />

              <div className="space-y-4 relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-ai">Annual Efficiency Savings</p>
                <motion.h3 
                  key={metrics.savings}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[120px] font-mono font-medium text-white tracking-tighter leading-none"
                >
                  ${(metrics.savings * 12).toLocaleString()}
                </motion.h3>
              </div>

              <div className="grid grid-cols-2 gap-10 relative z-10 pt-12 border-t border-white/5">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-ink-mutedOnDark uppercase tracking-widest">Resolution Rate</p>
                  <p className="text-4xl font-mono text-white tracking-tighter">{metrics.resolutionRate}%</p>
                  <div className="h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${metrics.resolutionRate}%` }}
                      className="h-full bg-ai shadow-glow" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-ink-mutedOnDark uppercase tracking-widest">Team Hours Saved</p>
                  <p className="text-4xl font-mono text-white tracking-tighter">{metrics.hoursSaved.toLocaleString()}</p>
                  <p className="text-[10px] text-success font-bold uppercase mt-2">Per Month</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-4 relative z-10">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-ink-mutedOnDark">WeHandle Pay-per-Resolve</span>
                  <span className="text-ai font-mono">$0.90 / resolution</span>
                </div>
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-ink-mutedOnDark">Fixed Monthly Commitment</span>
                  <span className="text-white font-mono">$0.00</span>
                </div>
              </div>

              <Button onClick={() => window.location.href='/auth'} variant="white" size="lg" className="w-full h-24 text-2xl group relative z-10">
                Claim This ROI <ArrowRight className="ml-3 w-8 h-8 group-hover:translate-x-2 transition-transform" />
              </Button>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-8 text-ink-muted">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-ai" />
                <span className="text-[10px] font-bold uppercase tracking-widest">No Fixed Costs</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-ai" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Setup in 4 Minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}