import React, { useEffect } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../../lib/api';

const steps = [
  { id: 1, name: 'Connect Store' },
  { id: 2, name: 'Knowledge Ingestion' },
  { id: 3, name: 'Identity Studio' },
];

export default function OnboardingLayout({ currentStep, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const syncOnboardingStep = async () => {
      try {
        const me = await authApi.getMe();
        const step = me?.merchant?.onboarding_step;

        if (!isMounted || step == null) return;

        // 5+ means fully live, send to dashboard
        if (step >= 5 && location.pathname !== '/dashboard') {
          navigate('/dashboard', { replace: true });
          return;
        }

        const stepPathMap = {
          1: '/step-1',
          2: '/step-2',
          3: '/step-3',
        };

        const targetPath = stepPathMap[step];

        if (targetPath && location.pathname !== targetPath) {
          navigate(targetPath, { replace: true });
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          navigate('/auth', { replace: true });
        } else {
          console.error('Error syncing onboarding step:', err?.response?.data || err);
        }
      }
    };

    syncOnboardingStep();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-canvas font-sans flex flex-col relative overflow-hidden">
      
      {/* Decorative background mesh on the light canvas */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-ai-dim/20 to-transparent blur-[120px] pointer-events-none" />

      {/* Header (Light Mode) */}
      <header className="px-8 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-white shadow-xl">
            <Sparkles className="w-5 h-5 text-ai-glow" />
          </div>
          <span className="font-bold text-xl text-ink-base tracking-tight">WeHandle.ai</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-xs font-mono font-bold text-ink-muted uppercase tracking-widest">
             Setup: Step {currentStep}/3
           </span>
           <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
             <div 
                className="h-full bg-surface transition-all duration-700" 
                style={{ width: `${(currentStep/3)*100}%` }}
             />
           </div>
        </div>
      </header>

      {/* Main Layout: Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* LEFT: Stepper (Light Mode Text) */}
        <aside className="lg:col-span-3 pt-12">
          <nav aria-label="Progress">
            <ol role="list" className="space-y-12">
              {steps.map((step, stepIdx) => (
                <li key={step.name} className="relative">
                  {/* Vertical Line */}
                  {stepIdx !== steps.length - 1 ? (
                    <div className={cn(
                      "absolute top-5 left-4 -ml-px h-12 w-0.5",
                      step.id < currentStep ? "bg-surface" : "bg-gray-200"
                    )} aria-hidden="true" />
                  ) : null}
                  
                  <div className="group relative flex items-center gap-4">
                    <span className="flex h-9 items-center">
                      {step.id < currentStep ? (
                        <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      ) : step.id === currentStep ? (
                        <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-ai text-white shadow-lg scale-110 transition-transform">
                          <span className="text-xs font-bold font-mono">{step.id}</span>
                        </span>
                      ) : (
                        <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-200 bg-white">
                          <span className="text-gray-400 text-xs font-bold font-mono">{step.id}</span>
                        </span>
                      )}
                    </span>
                    
                    <span className="flex flex-col">
                      <span className={cn(
                        "text-sm font-bold uppercase tracking-widest transition-colors",
                        step.id === currentStep ? "text-ai" : "text-ink-muted"
                      )}>
                        {step.name}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        {/* RIGHT: The Monolith (Dark Card) */}
        <div className="lg:col-span-9 animate-lift">
          <div className="card-monolith p-10 md:p-16 min-h-[600px] relative overflow-hidden flex flex-col">
            {/* Inner Glow for the Dark Card */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-ai/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="relative z-10 h-full flex flex-col">
              {children}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}