import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, Building } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { authApi } from '../lib/api'; // <--- Imported our new API

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form States
  const [storeName, setStoreName] = useState('');
  const[email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(''); // Clear previous errors

    try {
      if (isLogin) {
        // HITS: POST /api/v1/auth/login
        await authApi.login(email, password);
        navigate('/dashboard');
      } else {
        // HITS: POST /api/v1/auth/register
        // NOTE: authApi.register maps storeName -> store_name for FastAPI's UserCreate schema
        await authApi.register(storeName, email, password);
        navigate('/step-1');
      }
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;

      if (status === 422) {
        // FastAPI validation error: log full detail and surface first message
        console.error('Validation error:', detail);

        let firstMessage = 'Please check the form fields and try again.';

        if (Array.isArray(detail) && detail.length > 0) {
          // detail is typically a list of error objects: [{ loc, msg, type }, ...]
          firstMessage = detail[0]?.msg || firstMessage;
        } else if (typeof detail === 'string') {
          firstMessage = detail;
        }

        setError(firstMessage);
      } else {
        // Safely grab the error message from FastAPI or fall back to generic
        setError(typeof detail === 'string' ? detail : "Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle mode and clear form
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setPassword('');
  };

  return (
    <div className="flex min-h-screen overflow-hidden font-sans bg-white">
      
      {/* LEFT PANEL: THE BRAND ANCHOR */}
      <aside className="hidden lg:flex w-[45%] bg-[#111827] relative flex-col p-16 justify-between overflow-hidden border-r border-white/5">
        {/* Background Animation: Cognitive Pulse */}
        <div className="absolute w-full h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none top-1/2 left-1/2">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(124,58,237,0.15)_0%,_transparent_70%)] animate-pulse" />
           <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#7C3AED]/10 blur-[120px] rounded-full" />
        </div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-white shadow-2xl rounded-xl">
            <Sparkles className="w-6 h-6 text-[#7C3AED]" />
          </div>
          <span className="text-2xl font-bold tracking-tighter text-white">WeHandle.ai</span>
        </div>

        {/* Content Section */}
        <div className="relative z-10 space-y-8">
          <h1 className="text-5xl font-bold text-white leading-[1.1] tracking-tight">
            Turn support chaos <br />
            <span className="text-[#8B5CF6] font-serif italic font-normal">into silent revenue.</span>
          </h1>
          
          <div className="grid grid-cols-2 gap-6 pt-8">
            <div className="p-6 border bg-white/5 border-white/10 rounded-2xl backdrop-blur-md">
              <p className="text-[10px] font-bold text-[#F3E8FF] uppercase tracking-widest mb-2 opacity-60">Average Resolution</p>
              <p className="font-mono text-3xl font-medium tracking-tighter text-white">84.2%</p>
            </div>
            <div className="p-6 border bg-white/5 border-white/10 rounded-2xl backdrop-blur-sm">
              <p className="text-[10px] font-bold text-[#F3E8FF] uppercase tracking-widest mb-2 opacity-60">Merchant ROI</p>
              <p className="font-mono text-3xl font-medium tracking-tighter text-white">12.4x</p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="relative z-10 flex items-center gap-4 text-[#9CA3AF]">
           <div className="flex -space-x-3">
             {[1,2,3].map(i => (
               <div key={i} className="w-8 h-8 rounded-full border-2 border-[#111827] bg-[#374151] flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                 U{i}
               </div>
             ))}
           </div>
           <p className="text-xs font-medium tracking-tight">Trusted by 150+ Shopify Plus brands</p>
        </div>
      </aside>

      {/* RIGHT PANEL: THE FORM */}
      <main className="flex-1 bg-[#F9FAFB] flex flex-col items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md space-y-10 animate-lift">
          
          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-[#111827] tracking-tight">
              {isLogin ? 'Welcome Back' : 'Start Your Trial'}
            </h2>
            <p className="text-[#4B5563] font-serif italic text-lg leading-relaxed">
              {isLogin ? 'Access your intelligence dashboard.' : 'Deploy Autopilot on your store in minutes.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Error Message Display */}
            {error && (
              <div className="p-3 text-xs font-bold tracking-wider text-center text-red-600 uppercase border border-red-200 rounded-lg bg-red-50 animate-lift">
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2 animate-lift">
                <label className="text-[10px] font-bold text-[#4B5563] uppercase tracking-widest ml-1">Store Name</label>
                <div className="relative group">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D1D5DB] group-focus-within:text-[#7C3AED] transition-colors" />
                  <input 
                    required
                    minLength={2}
                    type="text" 
                    placeholder="e.g. Luminaire Co."
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-[#D1D5DB] rounded-xl text-[#111827] focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/5 outline-none transition-all placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#4B5563] uppercase tracking-widest ml-1">Work Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D1D5DB] group-focus-within:text-[#7C3AED] transition-colors" />
                <input 
                  required 
                  type="email" 
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-[#D1D5DB] rounded-xl text-[#111827] focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/5 outline-none transition-all placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-bold text-[#4B5563] uppercase tracking-widest">Password</label>
                {isLogin && <button type="button" className="text-[10px] font-bold text-[#7C3AED] uppercase hover:underline tracking-widest">Forgot?</button>}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D1D5DB] group-focus-within:text-[#7C3AED] transition-colors" />
                <input 
                  required 
                  minLength={8}
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-[#D1D5DB] rounded-xl text-[#111827] focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/5 outline-none transition-all placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              isLoading={isLoading}
              className="w-full h-16 text-lg rounded-2xl bg-[#111827] text-white hover:bg-black shadow-2xl transition-all font-bold"
            >
              {isLogin ? 'Enter Command Center' : 'Create Intelligence Account'}
            </Button>
          </form>

          {/* Verification Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E5E7EB]" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]">
              <span className="bg-[#F9FAFB] px-6 text-[#9CA3AF]">Identity Verified</span>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col items-center gap-8">
            <button 
              onClick={toggleMode}
              className="text-sm font-semibold text-[#111827] hover:text-[#7C3AED] transition-colors flex items-center gap-2 group"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            
            <div className="flex items-center gap-2 text-[#9CA3AF]">
              <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Enterprise Grade AES-256 Encryption</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}