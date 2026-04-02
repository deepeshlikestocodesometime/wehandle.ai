import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Book, 
  Plus, 
  ChevronRight, 
  FileText, 
  Globe, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  CheckCircle2,
  Brain,
  ArrowRight
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { suggestionsApi, knowledgeApi } from '../../lib/api';

export default function IntelligenceHub() {
  const [knowledgeByCategory, setKnowledgeByCategory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  const getRuleTitle = (rule) => {
    if (!rule) return '';
    const sourceName = rule.source_name || '';
    const content = rule.content || '';

    // For manual entries, source_name is often generic ("Manual Entry ..."),
    // so derive a more human title from the content.
    const shouldDeriveFromContent =
      !sourceName || sourceName.toLowerCase().startsWith('manual entry');

    if (!shouldDeriveFromContent) return sourceName;

    const fortyFiveDayMatch = content.match(/.{0,40}\b45\s*[- ]?day\b.{0,60}/i);
    if (fortyFiveDayMatch && fortyFiveDayMatch[0]) {
      const snippet = fortyFiveDayMatch[0].trim();
      return snippet.length > 60 ? `${snippet.slice(0, 60)}...` : snippet;
    }

    const firstNonEmptyLine = content
      .split('\n')
      .map((s) => s.trim())
      .find((s) => s.length > 0);

    if (!firstNonEmptyLine) return sourceName || 'Knowledge Rule';

    // Keep it short for the sidebar label.
    return firstNonEmptyLine.length > 60 ? `${firstNonEmptyLine.slice(0, 60)}...` : firstNonEmptyLine;
  };

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const data = await suggestionsApi.getSuggestions();
        setSuggestion(data[0] || null);
      } catch {
        setSuggestion(null);
      }
    };
    loadSuggestions();
  }, []);

  useEffect(() => {
    const loadKnowledge = async () => {
      try {
        const rules = await knowledgeApi.getRules();
        const grouped = {};
        for (const rule of rules || []) {
          const category = rule.source_type || 'Knowledge';
          if (!grouped[category]) grouped[category] = [];
          grouped[category].push(rule);
        }
        const categories = Object.entries(grouped).map(([category, items]) => ({
          id: category,
          category,
          items,
        }));
        setKnowledgeByCategory(categories);
        if (!selectedItem && categories.length > 0 && categories[0].items.length > 0) {
          setSelectedItem(categories[0].items[0]);
        }
      } catch {
        setKnowledgeByCategory([]);
        setSelectedItem(null);
      }
    };
    loadKnowledge();
  }, []);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-180px)] animate-lift">
        {/* THE MONOLITH CONTAINER */}
        <div className="card-monolith h-full flex overflow-hidden border-none shadow-2xl">
          
          {/* COLUMN 1: The Library Navigator (Obsidian) */}
          <aside className="w-80 border-r border-surface-border flex flex-col bg-surface">
            <div className="p-6 border-b border-surface-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white tracking-tight">Library</h2>
                <button className="p-1.5 rounded-lg bg-ai text-white hover:bg-ai-hover transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-mutedOnDark" />
                <input 
                  type="text" 
                  placeholder="Search knowledge..." 
                  className="w-full bg-surface-highlight border border-surface-border rounded-lg pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-ai transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {knowledgeByCategory.map((cat) => (
                <div key={cat.id} className="mb-4">
                  <div className="px-4 py-2 flex items-center justify-between group">
                    <span className="text-[10px] font-bold text-ink-mutedOnDark uppercase tracking-[0.2em]">
                      {cat.category}
                    </span>
                    <ChevronRight className="w-3 h-3 text-ink-mutedOnDark/30" />
                  </div>
                  <div className="space-y-1 mt-1">
                    {cat.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { setSelectedItem(item); setIsEditing(false); }}
                        className={cn(
                          "w-full px-4 py-2.5 rounded-lg flex items-center gap-3 transition-all text-left group",
                          selectedItem?.id === item.id
                            ? "bg-surface-highlight text-white border border-surface-border shadow-lg" 
                            : "text-ink-mutedOnDark hover:bg-white/[0.02]"
                        )}
                      >
                        <FileText className={cn(
                          "w-4 h-4",
                          selectedItem?.id === item.id ? "text-ai" : "text-ink-mutedOnDark/40"
                        )} />
                        <span className="text-sm font-medium">
                          {getRuleTitle(item) || 'Knowledge Rule'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Health Meter (Bottom of sidebar) */}
            <div className="p-6 bg-surface-highlight/50 border-t border-surface-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">AI Confidence</span>
                <span className="text-[10px] font-mono text-ai">94%</span>
              </div>
              <div className="h-1 bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-ai shadow-glow" style={{ width: '94%' }} />
              </div>
            </div>
          </aside>

          {/* COLUMN 2: The Document Workspace (Pure White Editorial) */}
          <main className="flex-1 flex flex-col bg-white">
            {/* Editor Header */}
            <header className="h-16 px-8 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="px-2 py-1 rounded bg-gray-100 text-[10px] font-bold text-ink-muted uppercase font-mono">
                  ID: {selectedItem?.id || 'N/A'}
                </div>
                <h3 className="text-sm font-bold text-ink-base">
                  {getRuleTitle(selectedItem) || 'No knowledge selected'}
                </h3>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-ink-muted hover:text-ink-base hover:bg-gray-100 transition-all"
                >
                  {isEditing ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Edit3 className="w-4 h-4" />}
                  {isEditing ? 'Save Changes' : 'Edit Article'}
                </button>
                <button className="p-2 text-gray-300 hover:text-error transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Editorial Content Zone */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-canvas-muted/30">
              <div className="max-w-3xl mx-auto py-16 px-8">
                {/* Meta info bar */}
                <div className="flex items-center gap-6 mb-12 pb-6 border-b border-gray-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Source Type</span>
                    <div className="flex items-center gap-2 text-sm font-bold text-ink-base">
                      {selectedItem?.source_type === 'Manual' ? <Edit3 className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      {selectedItem?.source_type || 'N/A'}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Last Modified</span>
                    <span className="text-sm font-bold text-ink-base">{selectedItem?.updated_at || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">AI Reference Count</span>
                  <span className="text-sm font-bold text-ai">{selectedItem?.reference_count ?? 0} hits</span>
                  </div>
                </div>

                {/* The "Legal" Document Content */}
                <div className={cn(
                  "font-serif text-lg leading-relaxed text-ink-base space-y-8",
                  isEditing ? "opacity-50 pointer-events-none" : "opacity-100"
                )}>
                  <h2 className="text-3xl font-sans font-bold text-ink-base leading-tight">
                    {getRuleTitle(selectedItem) || 'Knowledge Document'}
                  </h2>

                  <p>
                    {selectedItem?.content || 'No knowledge content available yet.'}
                  </p>
                </div>

                {isEditing && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/20 backdrop-blur-[2px] pt-40">
                    <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl border border-gray-200 p-1 animate-lift">
                      <textarea 
                        autoFocus
                        className="w-full h-96 p-8 font-serif text-lg leading-relaxed border-none focus:ring-0 outline-none resize-none text-ink-base"
                        defaultValue={selectedItem?.content || ''}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Training Banner (The Correction UI) */}
            <footer className="p-4 bg-ai/5 border-t border-ai/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-ai/10 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-ai" />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink-base">Neural Suggestion</p>
                  <p className="text-[10px] text-ink-muted">
                    {suggestion
                      ? suggestion.summary
                      : 'The AI will surface topics where customers struggle and your Knowledge Base has gaps.'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-[10px] font-bold text-ai hover:bg-ai/10">
                Teach Rule
              </Button>
            </footer>
          </main>

        </div>
      </div>
    </DashboardLayout>
  );
}