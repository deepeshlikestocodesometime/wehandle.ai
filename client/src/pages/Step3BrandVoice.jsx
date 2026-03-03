import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Sparkles, RefreshCw } from 'lucide-react';
import OnboardingLayout from '../components/layout/OnboardingLayout';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { onboardingApi } from '../lib/api';

export default function Step3BrandVoice() {
  const navigate = useNavigate();
  const [tone, setTone] = useState('friendly');
  const [emoji, setEmoji] = useState('moderate');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshPreview = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1200);
  };

  const getResponse = () => {
    if (tone === 'formal') return "Your order #8821 is currently in transit. The estimated delivery date is tomorrow. Thank you for your patience.";
    if (tone === 'friendly') return "Great news! 🎉 Your order #8821 is on its way and should be there by tomorrow! Let me know if you need anything else.";
    return "Order #8821 is shipped. Expect it tomorrow.";
  };

  const handleSavePersona = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await onboardingApi.updatePersona(tone, emoji);

      if (data?.onboarding_step != null) {
        localStorage.setItem('onboarding_step', String(data.onboarding_step));
      }

      navigate('/step-4');
    } catch (err) {
      console.error('Error saving persona:', err?.response?.data || err);
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : 'Unable to save persona. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout currentStep={3}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-full">
        
        {/* LEFT: Controls (Dark Theme) */}
        <div className="space-y-8 flex flex-col h-full">
          <div>
            <h1 className="text-2xl font-bold text-ink-onDark">Identity Studio</h1>
            <p className="text-ink-mutedOnDark font-serif italic mt-1">Shape the personality of your AI.</p>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-ink-mutedOnDark uppercase tracking-widest">Tone of Voice</label>
            <div className="grid grid-cols-3 gap-2">
              {['formal', 'neutral', 'friendly'].map((t) => (
                <button
                  key={t}
                  onClick={() => { setTone(t); refreshPreview(); }}
                  className={cn(
                    "py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all",
                    tone === t 
                      ? "bg-ai text-white border-ai shadow-glow" 
                      : "bg-surface-highlight text-ink-mutedOnDark border-surface-border hover:border-ai/50 hover:text-white"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-ink-mutedOnDark uppercase tracking-widest">Emoji Density</label>
            <div className="flex p-1 bg-surface-highlight rounded-lg border border-surface-border">
              {['none', 'moderate', 'always'].map((e) => (
                <button
                  key={e}
                  onClick={() => { setEmoji(e); refreshPreview(); }}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                    emoji === e 
                      ? "bg-surface-border text-white shadow-sm border border-surface-border" 
                      : "text-ink-mutedOnDark hover:text-white"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-8 mt-auto flex justify-between items-center border-t border-surface-border">
            <Button variant="ghost" onClick={() => navigate('/step-2')} className="text-ink-mutedOnDark hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <div className="flex items-center gap-3">
              {error && (
                <span className="text-[10px] font-bold text-error uppercase tracking-widest">
                  {error}
                </span>
              )}
              <Button
                onClick={handleSavePersona}
                className="bg-white text-surface hover:bg-gray-200"
                isLoading={isLoading}
                disabled={isLoading}
              >
              Save Persona <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT: Live Preview (Widget on Dark Background) */}
        <div className="bg-surface-highlight rounded-xl border border-surface-border p-6 flex flex-col h-[400px] shadow-inner relative overflow-hidden">
          {/* Widget Header */}
          <div className="absolute top-0 left-0 w-full h-12 bg-surface border-b border-surface-border flex items-center px-4 justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs font-bold text-white">Support Agent</span>
            </div>
            <Sparkles className="w-3 h-3 text-ai" />
          </div>

          <div className="mt-12 flex-1 space-y-4 overflow-y-auto p-2 custom-scrollbar">
            {/* User Message */}
            <div className="flex justify-end">
              <div className="bg-ai text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm max-w-[85%] shadow-glow">
                Where is my order? It's been 5 days!
              </div>
            </div>

            {/* AI Message */}
            <div className="flex justify-start items-end gap-2">
              <div className="w-6 h-6 rounded-full bg-surface border border-surface-border flex items-center justify-center text-[10px] text-white font-bold">
                AI
              </div>
              <div className={cn(
                "bg-surface border border-surface-border text-ink-mutedOnDark px-4 py-3 rounded-2xl rounded-tl-sm text-sm max-w-[85%] transition-opacity duration-300",
                isTyping ? "opacity-50" : "opacity-100"
              )}>
                {isTyping ? (
                  <div className="flex gap-1 h-5 items-center px-2">
                    <div className="w-1.5 h-1.5 bg-ink-mutedOnDark rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-ink-mutedOnDark rounded-full animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 bg-ink-mutedOnDark rounded-full animate-bounce delay-200" />
                  </div>
                ) : getResponse()}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 flex justify-center">
             <button 
               onClick={refreshPreview}
               className="flex items-center gap-1 text-[10px] font-bold text-ink-mutedOnDark uppercase tracking-widest hover:text-ai transition-colors"
             >
               <RefreshCw className="w-3 h-3" /> Regenerate Preview
             </button>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}