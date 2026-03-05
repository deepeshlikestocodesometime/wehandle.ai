import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ArrowRight, Zap, TrendingUp, Globe, Mail, 
  Instagram, MessageCircle, Phone, Check, ShieldCheck, 
  Layers, Cpu, DollarSign, Minus, ChevronRight, Target, 
  ArrowUpRight, Heart, Users, Clock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

// 1. DATA DEFINITIONS
const HEADLINES = [
  {
    main: "AI that handles the noise.",
    sub: "So you can handle the growth.",
    accent: "The Intelligent Co-pilot for Shopify Plus"
  },
  {
    main: "Pay only for resolved tickets.",
    sub: "$0 fixed monthly retainers.",
    accent: "Performance-Based Economics"
  },
  {
    main: "Scale trust, not payroll.",
    sub: "Human-level nuance at algorithm speed.",
    accent: "Cognitive Neural Architecture"
  }
];

const INTEGRATIONS = [
  { id: 'ig', name: 'Instagram', color: '#E4405F', icon: Instagram, desc: "Auto-replies to DMs & Stories" },
  { id: 'wa', name: 'WhatsApp', color: '#25D366', icon: MessageCircle, desc: "Deep-sync business automation" },
  { id: 'mail', name: 'Email', color: '#1A73E8', icon: Mail, desc: "Contextual ticket resolution" },
  { id: 'sms', name: 'iMessage/SMS', color: '#000000', icon: Phone, desc: "The elite concierge touch" },
];

const CURRENCIES = [
  { id: 'usd', label: 'USD', symbol: '$' },
  { id: 'eur', label: 'EUR', symbol: '€' },
  { id: 'gbp', label: 'GBP', symbol: '£' },
  { id: 'aed', label: 'AED', symbol: 'د.إ' },
];

const SECTIONS = [
  { label: 'Nexus', id: 'nexus' },
  { label: 'ROI Engine', id: 'roi-engine' },
  { label: 'The Ledger', id: 'ledger' },
  { label: 'Enterprise', id: 'enterprise' },
];

export default function Landing() {
  const navigate = useNavigate();
  
  // PAGE STATES
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // ROI CALCULATOR STATES
  const [roiTickets, setRoiTickets] = useState(5000);
  const [roiHumanCost, setRoiHumanCost] = useState(15);
  const [roiSavings, setRoiSavings] = useState(0);
  const [currency, setCurrency] = useState('usd');

  const activeCurrency = CURRENCIES.find((c) => c.id === currency) ?? CURRENCIES[0];

  // LOGIC: Smart Header Scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // LOGIC: Headline Cycle
  useEffect(() => {
    const timer = setInterval(() => setHeadlineIndex((prev) => (prev + 1) % HEADLINES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  // LOGIC: ROI Math
  useEffect(() => {
    const automated = roiTickets * 0.84; // 84% res rate
    const humanTotal = automated * roiHumanCost;
    const aiTotal = humanTotal * 0.25; // assume ~75% cheaper with Autopilot
    setRoiSavings(Math.round(humanTotal - aiTotal));
  }, [roiTickets, roiHumanCost]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink-base selection:bg-violet-mist overflow-x-hidden">
      
      {/* SECTION 1: SMART HEADER */}
      <nav className={cn(
        "fixed top-0 left-0 w-full z-50 h-20 px-10 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-border-mist transition-all duration-500",
        showHeader ? "translate-y-0" : "-translate-y-full"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-white shadow-glow">
            <Sparkles className="w-6 h-6 text-ai" />
          </div>
          <span className="font-bold text-2xl tracking-tighter">wehandlecx</span>
        </div>
        <div className="hidden lg:flex items-center gap-10">
          {SECTIONS.map(({ label, id }) => (
            <button
              key={id}
              type="button"
              className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink-muted hover:text-ai transition-all"
              onClick={() => scrollToSection(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/auth')} className="text-[10px] font-bold uppercase tracking-widest text-ink-muted hover:text-ink-base">Sign In</button>
          <Button onClick={() => navigate('/auth')} variant="ai" size="sm" className="px-8 shadow-violet-glow">Get Autopilot</Button>
        </div>
      </nav>

      {/* SECTION 2: DYNAMIC HERO */}
      <section className="pt-48 pb-32 px-8 min-h-[90vh] flex items-center justify-center relative bg-white overflow-hidden border-b border-border-mist">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(124,58,237,0.05)_0%,_transparent_70%)]" />
        
        <div className="max-w-7xl mx-auto w-full text-center relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={headlineIndex}
              initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-12"
            >
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-violet-mist/50 border border-violet-core/20 text-violet-core shadow-sm">
                <Target className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em]">{HEADLINES[headlineIndex].accent}</span>
              </div>
              
              <h1 className="text-7xl md:text-[130px] font-bold tracking-tighter leading-[0.8] text-ink-base">
                {HEADLINES[headlineIndex].main}
                <span className="block text-ink-muted opacity-20 font-serif italic font-normal mt-4">
                  {HEADLINES[headlineIndex].sub}
                </span>
              </h1>
              
              <div className="pt-12 flex justify-center">
                <Button onClick={() => navigate('/auth')} size="lg" className="h-24 px-20 text-3xl shadow-2xl hover:scale-105 transition-all group">
                  Start Realizing ROI <ArrowRight className="ml-6 w-10 h-10 group-hover:translate-x-2 transition-transform" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* SECTION 3: INTEGRATION NEXUS (The Orbit Visual) */}
      <section className="py-40 bg-platinum-canvas relative overflow-hidden border-b border-border-mist" id="nexus">
        <div className="max-w-7xl mx-auto px-10 grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="space-y-12 relative z-10">
            <h2 className="text-7xl font-bold tracking-tighter leading-[0.85]">Vibrant <br />Omnichannel.</h2>
            <p className="text-2xl text-ink-muted font-serif italic leading-relaxed max-w-lg">
              WeHandle isn't a chatbot. It's a unified nervous system that handles every social, support, and business touchpoint.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {INTEGRATIONS.map((app) => (
                <div key={app.id} className="p-8 bg-white border border-border-mist rounded-3xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group flex flex-col gap-6">
                   <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all group-hover:rotate-12" 
                    style={{ backgroundColor: `${app.color}15`, color: app.color }}
                   >
                     <app.icon className="w-8 h-8" />
                   </div>
                   <div>
                     <h4 className="font-bold text-lg text-ink-base">{app.name}</h4>
                     <p className="text-sm text-ink-muted leading-relaxed mt-1">{app.desc}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* THE ORBIT NEXUS */}
          <div className="relative h-[600px] flex items-center justify-center">
             <div className="absolute inset-0 bg-ai/5 blur-[120px] rounded-full animate-pulse" />
             <div className="w-40 h-40 bg-surface rounded-[40px] flex items-center justify-center text-white shadow-violet-glow relative z-10 animate-cognitive-pulse border border-white/10">
                <Cpu className="w-16 h-16 text-ai" />
                <div className="absolute -top-4 -right-4 bg-success text-white text-[8px] font-bold px-2 py-1 rounded-full shadow-lg">LIVE_NEXUS</div>
             </div>
             
             {/* Orbital Paths */}
             <div className="absolute w-full h-full flex items-center justify-center">
                <div className="absolute border border-border-mist rounded-full w-[350px] h-[350px]" />
                <div className="absolute border border-border-mist rounded-full w-[550px] h-[550px]" />
                
                <div className="absolute animate-orbit"><Instagram className="p-4 bg-white shadow-2xl rounded-2xl w-16 h-16 text-[#E4405F]" /></div>
                <div className="absolute animate-orbit-reverse" style={{animationDuration: '30s'}}><MessageCircle className="p-4 bg-white shadow-2xl rounded-2xl w-16 h-16 text-[#25D366]" /></div>
                <div className="absolute animate-orbit" style={{animationDelay: '-8s', animationDuration: '22s'}}><Mail className="p-4 bg-white shadow-2xl rounded-2xl w-16 h-16 text-[#1A73E8]" /></div>
             </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: ROI ENGINE (Functional Component Built-in) */}
      <section className="py-40 bg-white" id="roi-engine">
        <div className="max-w-6xl mx-auto px-4 md:px-10">
          <div className="text-center mb-24 space-y-6">
             <h2 className="text-7xl font-bold tracking-tighter">Measure the Impact.</h2>
             <p className="text-2xl text-ink-muted font-serif italic max-w-2xl mx-auto">
               Stop paying for support seats. Start paying for <span className="text-ai underline decoration-ai/20 underline-offset-8">outcomes</span>.
             </p>
          </div>

          <div className="card-monolith grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden shadow-2xl border-none">
             {/* Left: Controls */}
             <div className="lg:col-span-7 p-10 md:p-16 space-y-16 bg-surface">
                <div className="space-y-12">
                   <div className="space-y-6">
                      <div className="flex justify-between items-end">
                         <label className="text-[11px] font-bold uppercase tracking-[0.4em] text-ink-mutedOnDark">Tickets / Month</label>
                         <span className="text-5xl font-mono text-ai font-medium">{roiTickets.toLocaleString()}</span>
                      </div>
                      <input 
                        type="range" min="1000" max="100000" step="1000" 
                        value={roiTickets} onChange={(e) => setRoiTickets(parseInt(e.target.value))}
                        className="w-full h-1 bg-midnight-slate rounded-full appearance-none cursor-pointer accent-ai"
                      />
                   </div>

                   <div className="space-y-8">
                     <div className="flex justify-between items-center gap-6">
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-ink-mutedOnDark">Human Cost / Ticket</p>
                          <p className="text-xs text-ink-mutedOnDark">What you currently pay per resolved ticket.</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <select
                              value={currency}
                              onChange={(e) => setCurrency(e.target.value)}
                              className="bg-surface-highlight border border-surface-border rounded-lg px-3 py-1 text-xs text-ink-mutedOnDark uppercase tracking-[0.2em] focus:outline-none focus:ring-1 focus:ring-ai"
                            >
                              {CURRENCIES.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-ink-mutedOnDark">{activeCurrency.symbol}</span>
                          <input
                            type="number"
                            min="5"
                            max="50"
                            step="0.5"
                            value={roiHumanCost}
                            onChange={(e) => setRoiHumanCost(Number(e.target.value) || 0)}
                            className="w-24 bg-transparent border border-surface-border rounded-lg px-3 py-1 text-right text-ink-mutedOnDark text-sm focus:outline-none focus:ring-1 focus:ring-ai"
                          />
                          </div>
                        </div>
                     </div>

                     <div className="p-8 bg-surface-highlight border border-surface-border rounded-2xl space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-ai/10 flex items-center justify-center">
                              <Zap className="w-5 h-5 text-ai" />
                           </div>
                           <div>
                              <p className="text-sm text-white font-bold tracking-tight">84% Auto-Resolution Rate</p>
                              <p className="text-xs text-ink-mutedOnDark">Across all Shopify Plus clients</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-ai/10 flex items-center justify-center">
                              <DollarSign className="w-5 h-5 text-ai" />
                           </div>
                           <div>
                              <p className="text-sm text-white font-bold tracking-tight">Usage-Based Autopilot Pricing</p>
                              <p className="text-xs text-ink-mutedOnDark">We model rates off your current support baseline. Talk to us for exact economics.</p>
                           </div>
                        </div>
                     </div>
                   </div>
                </div>
             </div>

             {/* Right: Outcome Result */}
             <div className="lg:col-span-5 bg-ai p-10 md:p-16 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-700 opacity-60 group-hover:scale-110 transition-transform duration-1000" />
                <div className="relative z-10 space-y-12">
                   <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-white/50">Annual Operational Savings</p>
                   <motion.h4 
                     key={roiSavings}
                     initial={{ scale: 0.95, opacity: 0 }} 
                     animate={{ scale: 1, opacity: 1 }}
                     className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-mono text-white tracking-tighter font-medium"
                   >
                     {activeCurrency.symbol}
                     {(roiSavings * 12).toLocaleString()}
                   </motion.h4>
                   <p className="text-xs text-white/80 max-w-sm mx-auto">
                     Based on {roiTickets.toLocaleString()} tickets / month, 84% auto-resolved and an estimated 75% lower cost per resolution with WeHandle Autopilot, in {activeCurrency.label}.
                   </p>
                   <div className="space-y-4">
                      <Button onClick={() => navigate('/auth')} variant="white" className="w-full h-20 text-xl shadow-2xl">
                         Claim This Efficiency <ArrowRight className="ml-3 w-5 h-5" />
                      </Button>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest tracking-[0.2em]">Based on Shopify Enterprise Baseline</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: THE LEDGER (Battle Comparison) */}
      <section className="py-40 bg-platinum-canvas border-t border-border-mist relative" id="ledger">
        <div className="max-w-7xl mx-auto px-10">
          <div className="text-center mb-32 space-y-6">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ai text-white text-[9px] font-bold uppercase tracking-[0.3em] shadow-lg">The Ledger v1.4</div>
             <h2 className="text-7xl font-bold tracking-tighter">Compare the Reality.</h2>
             <p className="text-2xl text-ink-muted font-serif italic">Why high-growth brands are migrating to the Platinum standard.</p>
          </div>

          <div className="bg-platinum-haze rounded-[60px] p-2 overflow-hidden shadow-2xl border border-border-mist">
            <div className="bg-white rounded-[58px] overflow-hidden">
               <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                     <tr className="bg-platinum-haze/30">
                        <th className="px-12 py-12 text-[12px] font-bold uppercase tracking-[0.4em] text-ink-muted w-1/4">Critical Capability</th>
                        <th className="px-12 py-12 text-[12px] font-bold uppercase tracking-[0.4em] text-ink-muted opacity-30 text-center">Legacy Bots</th>
                        <th className="px-12 py-12 text-[12px] font-bold uppercase tracking-[0.4em] text-ink-muted opacity-30 text-center">Indian Players</th>
                        <th className="px-12 py-12 text-[12px] font-bold uppercase tracking-[0.4em] text-ai bg-violet-mist/20 border-x border-ai/10 text-center">WeHandle.ai</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border-mist text-ink-base">
                     <BattleRow label="Pricing Engine" a="Fixed $1,200+/mo" b="Seat-based" c="Pay-per-resolve ($0 Fixed)" highlight />
                     <BattleRow label="Channel Nexus" a="Web-only" b="Partial WhatsApp" c="Full Social + SMS + WA" />
                     <BattleRow label="Order Autonomy" a="Manual Triggers" b="Basic API Link" c="Neural Order & Refund Core" highlight />
                     <BattleRow label="Intelligence Model" a="Keywords" b="LLM Wrapper" c="Proprietary RAG Flow" />
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: FINAL LAUNCHPAD */}
      <section className="py-64 px-8 text-center bg-white relative overflow-hidden" id="enterprise">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[800px] bg-violet-mist/30 blur-[180px] rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-16">
           <h2 className="text-8xl md:text-[140px] font-bold tracking-tighter leading-none text-ink-base">
             Deploy <br /> <span className="text-ai">Autopilot.</span>
           </h2>
           <p className="text-3xl text-ink-muted font-serif italic max-w-2xl mx-auto leading-relaxed opacity-70">
             Join 150+ brands resolving 80% of support volume without lifting a finger. 
           </p>
           <div className="flex flex-col items-center gap-12">
              <Button onClick={() => navigate('/auth')} size="lg" variant="primary" className="h-28 px-24 text-4xl rounded-[40px] shadow-2xl hover:scale-105 transition-transform group">
                 Launch Intelligence <ArrowRight className="ml-6 w-12 h-12" />
              </Button>
              <div className="flex items-center gap-6 text-ink-muted/50">
                 <ShieldCheck className="w-6 h-6 text-success" />
                 <span className="text-sm font-bold uppercase tracking-[0.3em]">SOC2 Type II Compliant • 256-Bit SSL</span>
              </div>
           </div>
        </div>
      </section>

      {/* SECTION 7: FOOTER */}
      <footer className="py-24 px-12 bg-surface text-white">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-20 border-b border-white/5 pb-20">
            <div className="md:col-span-5 space-y-8">
              <div className="flex items-center gap-3">
                <Sparkles className="w-10 h-10 text-ai" />
                <span className="font-bold text-3xl tracking-tighter">WeHandle.ai</span>
              </div>
              <p className="text-xl text-ink-mutedOnDark font-serif italic leading-relaxed opacity-50">
                The resolution-first intelligence engine for the world's most ambitious merchants. 
              </p>
            </div>
            <div className="md:col-span-7 grid grid-cols-2 lg:grid-cols-3 gap-12">
               <div className="space-y-6">
                  <h5 className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">Platform</h5>
                  <ul className="space-y-4 text-sm text-ink-mutedOnDark font-medium">
                    <li>
                      <button
                        type="button"
                        className="hover:text-ai transition-colors cursor-pointer"
                        onClick={() => scrollToSection('roi-engine')}
                      >
                        ROI Calculator
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="hover:text-ai transition-colors cursor-pointer"
                        onClick={() => scrollToSection('nexus')}
                      >
                        Omnichannel
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="hover:text-ai transition-colors cursor-pointer"
                        onClick={() => scrollToSection('ledger')}
                      >
                        The Ledger
                      </button>
                    </li>
                  </ul>
               </div>
               <div className="space-y-6">
                  <h5 className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">Integrations</h5>
                  <ul className="space-y-4 text-sm text-ink-mutedOnDark font-medium">
                    <li className="hover:text-ai transition-colors cursor-pointer">Shopify Plus</li>
                    <li className="hover:text-ai transition-colors cursor-pointer">WhatsApp Business</li>
                    <li className="hover:text-ai transition-colors cursor-pointer">Instagram Commerce</li>
                  </ul>
               </div>
               <div className="space-y-6">
                  <h5 className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">Connect</h5>
                  <ul className="space-y-4 text-sm text-ink-mutedOnDark font-medium">
                    <li className="hover:text-ai transition-colors cursor-pointer">Support</li>
                    <li className="hover:text-ai transition-colors cursor-pointer">Case Studies</li>
                    <li className="hover:text-ai transition-colors cursor-pointer">API Documentation</li>
                  </ul>
               </div>
            </div>
         </div>
         <div className="max-w-7xl mx-auto pt-12 flex flex-col sm:flex-row justify-between items-center gap-6 text-[10px] font-mono font-bold uppercase tracking-[0.5em] text-ink-mutedOnDark opacity-30">
            <p>© 2026 WEHANDLE AI OPERATIONS HUB</p>
            <div className="flex gap-10">
               <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> NODES_STABLE</span>
               <span className="text-ai">V1.0.4_PLATINUM</span>
            </div>
         </div>
      </footer>
    </div>
  );
}

// 2. HELPER COMPONENTS
function BattleRow({ label, a, b, c, highlight }) {
  return (
    <tr className="group transition-all hover:bg-canvas-muted/20">
      <td className="px-12 py-12 text-base font-bold border-r border-border-mist">{label}</td>
      <td className="px-12 py-12 text-xs opacity-30 text-center font-medium leading-relaxed">{a}</td>
      <td className="px-12 py-12 text-xs opacity-30 text-center font-medium leading-relaxed">{b}</td>
      <td className={cn(
        "px-12 py-12 text-base font-bold text-ai bg-violet-mist/20 relative border-x border-ai/10 text-center transition-all",
        highlight && "shadow-[inset_0_0_30px_rgba(124,58,237,0.05)]"
      )}>
         <div className="flex items-center justify-center gap-4">
            <div className="w-7 h-7 bg-ai rounded-full flex items-center justify-center shadow-violet-glow scale-110">
               <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
            {c}
         </div>
      </td>
    </tr>
  );
}