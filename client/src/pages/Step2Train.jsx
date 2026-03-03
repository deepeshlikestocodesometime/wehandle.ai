import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Globe, FileText, CheckCircle2, X, ArrowRight, Brain, ArrowLeft } from 'lucide-react';
import OnboardingLayout from '../components/layout/OnboardingLayout';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { onboardingApi } from '../lib/api';

export default function Step2Brain() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload');
  const [files, setFiles] = useState([]);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files).map(file => ({
      name: file.name,
      progress: 0,
      status: 'uploading'
    }));
    setFiles([...files, ...newFiles]);

    newFiles.forEach((_, index) => {
      let p = 0;
      const interval = setInterval(() => {
        p += 5;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setFiles(prev => prev.map((f, i) => i === (prev.length - newFiles.length + index) ? { ...f, progress: 100 } : f));
        } else {
          setFiles(prev => prev.map((f, i) => i === (prev.length - newFiles.length + index) ? { ...f, progress: p } : f));
        }
      }, 100);
    });
  };

  const handleNext = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await onboardingApi.completeKnowledge();

      if (data?.onboarding_step != null) {
        localStorage.setItem('onboarding_step', String(data.onboarding_step));
      }

      navigate('/step-3');
    } catch (err) {
      console.error('Error progressing knowledge step:', err?.response?.data || err);
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : 'Unable to save knowledge. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout currentStep={2}>
      <div className="space-y-8 h-full flex flex-col">
        {/* Header - White Text on Dark Card */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink-onDark">Knowledge Ingestion</h1>
            <p className="text-ink-mutedOnDark font-serif italic mt-1">Teach the AI your policies.</p>
          </div>
          <div className="px-3 py-1 bg-surface-highlight rounded-full border border-surface-border">
             <span className="text-xs font-bold text-ai flex items-center gap-2">
               <Brain className="w-3 h-3" /> 12 pts
             </span>
          </div>
        </div>

        {/* Tabs - Dark Theme */}
        <div className="flex p-1 bg-surface-highlight rounded-lg border border-surface-border">
          {['upload', 'crawl', 'manual'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all",
                activeTab === tab 
                  ? "bg-ai text-white shadow-glow" 
                  : "text-ink-mutedOnDark hover:text-white hover:bg-white/5"
              )}
            >
              {tab === 'upload' ? 'Upload Files' : tab === 'crawl' ? 'Website Crawl' : 'Manual Entry'}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-[300px]">
          {activeTab === 'upload' && (
            <div className="space-y-4 animate-lift">
              <label className="border-2 border-dashed border-surface-border rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-highlight hover:border-ai/50 transition-all group">
                <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                <div className="w-12 h-12 bg-surface-highlight rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-surface-border">
                  <UploadCloud className="w-6 h-6 text-ink-mutedOnDark group-hover:text-ai" />
                </div>
                <span className="text-sm font-bold text-ink-onDark">Click to upload documents</span>
                <span className="text-xs text-ink-mutedOnDark mt-1">PDF, DOCX, TXT (Max 10MB)</span>
              </label>

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-highlight rounded-lg border border-surface-border">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-4 h-4 text-ink-mutedOnDark" />
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-ink-onDark">{file.name}</span>
                          <span className="text-ai font-mono">{file.progress}%</span>
                        </div>
                        <div className="h-1 bg-surface-border rounded-full overflow-hidden">
                          <div className="h-full bg-ai transition-all duration-300" style={{ width: `${file.progress}%` }} />
                        </div>
                      </div>
                    </div>
                    {file.progress === 100 ? (
                      <CheckCircle2 className="w-4 h-4 text-success ml-3" />
                    ) : (
                      <button className="ml-3"><X className="w-4 h-4 text-ink-mutedOnDark hover:text-white" /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'crawl' && (
            <div className="space-y-4 animate-lift pt-4">
               <div className="flex gap-2">
                 <input 
                   type="url" 
                   placeholder="https://yourstore.com/faq"
                   className="input-dark w-full pl-4 pr-4 py-3 font-mono text-sm"
                   value={url}
                   onChange={(e) => setUrl(e.target.value)}
                 />
                 <Button className="bg-surface-highlight border border-surface-border text-white hover:bg-surface-border">Scan</Button>
               </div>
               <div className="p-4 bg-ai-dim border border-ai/20 rounded-lg">
                 <p className="text-xs text-white font-medium">✨ Pro Tip</p>
                 <p className="text-xs text-ink-mutedOnDark mt-1">Enter your FAQ page URL. We'll automatically extract questions and answers.</p>
               </div>
            </div>
          )}
          
          {activeTab === 'manual' && (
             <div className="space-y-4 animate-lift">
               <textarea 
                className="input-dark w-full h-48 p-4 font-sans resize-none"
                placeholder="Q: What is your return policy?&#10;A: We offer 30-day returns..."
               />
             </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="pt-6 border-t border-surface-border flex justify-between items-center mt-auto">
          <Button variant="ghost" onClick={() => navigate('/step-1')} className="text-ink-mutedOnDark hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-xs text-ink-mutedOnDark hidden md:block">{files.length} documents ready</span>
            {error && (
              <span className="text-[10px] font-bold text-error uppercase tracking-widest">
                {error}
              </span>
            )}
            <Button
              onClick={handleNext}
              className="bg-white text-surface hover:bg-gray-200"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Next Step <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}