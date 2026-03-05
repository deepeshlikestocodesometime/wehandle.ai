import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Globe, ArrowRight, ShieldCheck } from 'lucide-react';
import OnboardingLayout from '../components/layout/OnboardingLayout';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { onboardingApi } from '../lib/api';

export default function Step1Connect() {
  const navigate = useNavigate();
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!selectedPlatform || !domain.trim()) {
      setError('Please select a platform and enter your store domain.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const storeDomain =
        selectedPlatform === 'shopify'
          ? domain.trim()
          : domain.trim();

      const data = await onboardingApi.connectStore(storeDomain);

      if (data?.authorization_url) {
        // Hand off to Shopify OAuth – this will eventually return the user
        // to our /step-2 route after the callback completes.
        window.location.href = data.authorization_url;
        return;
      }

      setError('Unexpected response from Shopify connect. Please try again.');
    } catch (err) {
      console.error('Error connecting store:', err?.response?.data || err);
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : 'Unable to connect your store. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout currentStep={1}>
      <div className="max-w-2xl mx-auto space-y-12 flex flex-col h-full">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-ink-onDark tracking-tight">Connect Source</h1>
          <p className="text-ink-mutedOnDark text-lg font-serif italic">
            Synchronize your intelligence engine with your store data.
          </p>
        </div>

        {/* Platform Cards (Darker on Dark) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setSelectedPlatform('shopify')}
            className={cn(
              "group relative flex flex-col items-center justify-center p-10 rounded-card border-2 transition-all duration-300",
              selectedPlatform === 'shopify'
                ? "border-ai bg-surface-highlight shadow-glow"
                : "border-surface-border bg-surface hover:bg-surface-highlight hover:border-surface-highlight"
            )}
          >
            <div className={cn(
              "h-16 w-16 rounded-full flex items-center justify-center mb-6 transition-colors duration-300",
              selectedPlatform === 'shopify' ? "bg-ai text-white" : "bg-surface-border text-ink-mutedOnDark"
            )}>
              <ShoppingBag className="h-8 w-8" />
            </div>
            <span className={cn(
              "text-lg font-bold tracking-wide transition-colors",
              selectedPlatform === 'shopify' ? "text-white" : "text-ink-mutedOnDark"
            )}>Shopify</span>
          </button>

          <button
            onClick={() => setSelectedPlatform('woocommerce')}
            className={cn(
              "group relative flex flex-col items-center justify-center p-10 rounded-card border-2 transition-all duration-300",
              selectedPlatform === 'woocommerce'
                ? "border-ai bg-surface-highlight shadow-glow"
                : "border-surface-border bg-surface hover:bg-surface-highlight hover:border-surface-highlight"
            )}
          >
            <div className={cn(
              "h-16 w-16 rounded-full flex items-center justify-center mb-6 transition-colors duration-300",
              selectedPlatform === 'woocommerce' ? "bg-ai text-white" : "bg-surface-border text-ink-mutedOnDark"
            )}>
              <Globe className="h-8 w-8" />
            </div>
            <span className={cn(
              "text-lg font-bold tracking-wide transition-colors",
              selectedPlatform === 'woocommerce' ? "text-white" : "text-ink-mutedOnDark"
            )}>WooCommerce</span>
          </button>
        </div>

        {/* Inputs (Dark on Dark) */}
        <div className="min-h-[100px] flex items-center justify-center">
          {selectedPlatform ? (
            <div className="w-full animate-lift space-y-4">
              <label className="block text-xs font-bold text-ink-mutedOnDark uppercase tracking-widest">
                {selectedPlatform === 'shopify' ? 'Store Domain' : 'Store URL'}
              </label>
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder={selectedPlatform === 'shopify' ? "brand-name" : "https://yourbrand.com"}
                  className="input-dark w-full pl-5 pr-40 py-4 font-mono text-sm"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
                {selectedPlatform === 'shopify' && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-mutedOnDark/50 font-mono">
                    .myshopify.com
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-mutedOnDark/30 italic">Select a platform to reveal options</p>
          )}
        </div>

        <div className="pt-8 border-t border-surface-border mt-auto">
          {error && (
            <div className="mb-4 text-xs font-bold text-error uppercase tracking-widest">
              {error}
            </div>
          )}
          <Button 
            onClick={handleConnect} 
            disabled={!selectedPlatform || isLoading}
            size="lg"
            className="w-full h-16 text-lg"
            isLoading={isLoading}
          >
            Authenticate & Continue <ArrowRight className="ml-3 h-5 w-5" />
          </Button>
          <div className="mt-6 flex items-center justify-center gap-2 text-ink-mutedOnDark/50">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-widest font-bold">256-Bit Encrypted Connection</span>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}