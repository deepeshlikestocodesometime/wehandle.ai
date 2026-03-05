import React, { useState } from 'react';
import { Copy, Check, Terminal, ArrowRight, ArrowLeft, PartyPopper } from 'lucide-react';
import OnboardingLayout from '../components/layout/OnboardingLayout';
import { Button } from '../components/ui/Button';
import { onboardingApi } from '../lib/api';

export default function Step4Install() {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('idle');

  const snippet = `<script>
  window.WH_ID = "wh_live_83749283";
  (function(w,d,s,src){
    var f=d.getElementsByTagName(s)[0];
    var j=d.createElement(s);
    j.async=true; j.src=src;
    f.parentNode.insertBefore(j,f);
  })(window,document,"script","https://cdn.wehandle.ai/core.js");
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    setStatus('verifying');

    try {
      const data = await onboardingApi.verifyDeployment();

      if (data?.onboarding_step != null) {
        localStorage.setItem('onboarding_step', String(data.onboarding_step));
      }

      setStatus('success');
    } catch (err) {
      console.error('Error during deployment:', err?.response?.data || err);
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <OnboardingLayout currentStep={4}>
        <div className="flex flex-col items-center justify-center h-full py-12 animate-lift">
          <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mb-6 border border-success/20">
            <PartyPopper className="w-12 h-12 text-success" />
          </div>
          <h2 className="text-3xl font-bold text-ink-onDark">System Live</h2>
          <p className="text-ink-mutedOnDark font-serif italic mt-2 text-center max-w-md">
            The neural engine is now active on your storefront. Autopilot is engaged.
          </p>
          <Button className="mt-8 w-64 bg-ai text-white hover:bg-ai-hover shadow-glow" onClick={() => window.location.href = '/dashboard'}>
            Enter Command Center <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout currentStep={4}>
      <div className="space-y-8 flex flex-col h-full">
        <div>
          <h1 className="text-2xl font-bold text-ink-onDark">Deployment</h1>
          <p className="text-ink-mutedOnDark font-serif italic mt-1">Inject the intelligence layer into your theme.</p>
        </div>

        {/* Code Terminal - Dark Contrast Area */}
        <div className="relative group rounded-xl overflow-hidden border border-surface-border shadow-lg">
          <div className="bg-surface-highlight px-4 py-2 flex items-center justify-between border-b border-surface-border">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-error" />
              <div className="w-2.5 h-2.5 rounded-full bg-warning" />
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
            </div>
            <span className="text-[10px] font-mono text-ink-mutedOnDark/50">theme.liquid</span>
          </div>
          <div className="bg-surface p-6 overflow-x-auto">
            <pre className="text-xs font-mono text-ink-mutedOnDark leading-relaxed">
              {snippet}
            </pre>
          </div>
          <button 
            onClick={handleCopy}
            className="absolute top-10 right-4 p-2 rounded-md bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5"
          >
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="pt-4 mt-auto">
          <Button 
            onClick={handleVerify} 
            disabled={status === 'verifying'}
            isLoading={status === 'verifying'}
            className="w-full h-14 text-base bg-white text-surface hover:bg-gray-200"
          >
            <Terminal className="mr-2 h-4 w-4" /> Verify & Launch
          </Button>
          
          <div className="flex justify-between items-center mt-6">
             <Button variant="ghost" onClick={() => window.location.href='/step-3'} className="text-ink-mutedOnDark hover:text-white">
               <ArrowLeft className="mr-2 h-4 w-4" /> Back
             </Button>
             <button className="text-xs text-ink-mutedOnDark underline hover:text-ai">
               Invite a developer
             </button>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}