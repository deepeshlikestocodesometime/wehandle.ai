import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  User, 
  Zap, 
  MessageSquare, 
  ShoppingBag, 
  Clock, 
  Shield, 
  Send,
  MoreVertical,
  ChevronRight,
  Brain
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { cn } from '../../lib/utils';

// Mock Data for the Inbox
const MOCK_CHATS = [
  { id: 1, customer: "Emma Wilson", preview: "Where is my order #8821?", time: "2m", status: "autopilot", unread: true },
  { id: 2, customer: "John Doe", preview: "The item arrived damaged...", time: "15m", status: "manual", unread: false },
  { id: 3, customer: "Sarah L.", preview: "What is your return window?", time: "1h", status: "autopilot", unread: false },
  { id: 4, customer: "Michael K.", preview: "Can I get a discount?", time: "3h", status: "resolved", unread: false },
];

export default function Inbox() {
  const [activeChat, setActiveChat] = useState(MOCK_CHATS[0]);
  const [isAutopilot, setIsAutopilot] = useState(true);
  const [message, setMessage] = useState('');

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-180px)] animate-lift">
        <div className="card-monolith h-full flex overflow-hidden border-none shadow-2xl">
          
          {/* COLUMN 1: Conversation List (Midnight) */}
          <aside className="w-80 border-r border-surface-border flex flex-col bg-surface">
            <div className="p-5 border-b border-surface-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Inbox</h2>
                <div className="flex gap-2">
                  <button className="p-1.5 rounded-md hover:bg-surface-highlight text-ink-mutedOnDark transition-colors">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-mutedOnDark" />
                <input 
                  type="text" 
                  placeholder="Search chats..." 
                  className="w-full bg-surface-highlight border border-surface-border rounded-lg pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-ai transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {MOCK_CHATS.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={cn(
                    "w-full p-4 flex items-start gap-3 border-b border-surface-border transition-all text-left",
                    activeChat.id === chat.id ? "bg-surface-highlight" : "hover:bg-white/[0.02]"
                  )}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-surface-border flex items-center justify-center text-xs font-bold text-ink-mutedOnDark">
                      {chat.customer.split(' ').map(n => n[0]).join('')}
                    </div>
                    {chat.status === 'autopilot' && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-ai rounded-full border-2 border-surface flex items-center justify-center">
                        <Zap className="w-2 h-2 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className={cn("text-sm font-bold", chat.unread ? "text-white" : "text-ink-mutedOnDark")}>
                        {chat.customer}
                      </span>
                      <span className="text-[10px] font-mono text-ink-mutedOnDark uppercase">{chat.time}</span>
                    </div>
                    <p className="text-xs text-ink-mutedOnDark truncate">{chat.preview}</p>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* COLUMN 2: Active Chat (Focus Zone - Milk White Background inside the box) */}
          <main className="flex-1 flex flex-col bg-canvas border-r border-surface-border">
            {/* Chat Header */}
            <header className="h-16 px-6 border-b border-gray-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs">
                  {activeChat.customer[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-base">{activeChat.customer}</h3>
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Order #8821 • In Transit</p>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center bg-gray-100 rounded-full p-1 border border-gray-200">
                <button 
                  onClick={() => setIsAutopilot(true)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                    isAutopilot ? "bg-ai text-white shadow-glow" : "text-ink-muted hover:text-ink-base"
                  )}
                >
                  <Zap className="w-3 h-3" /> Autopilot
                </button>
                <button 
                  onClick={() => setIsAutopilot(false)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                    !isAutopilot ? "bg-surface text-white" : "text-ink-muted hover:text-ink-base"
                  )}
                >
                  <User className="w-3 h-3" /> Manual
                </button>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-4 max-w-[80%] shadow-sm">
                  <p className="text-sm text-ink-base leading-relaxed">
                    Hello! I'm checking on order #8821. It was supposed to be here yesterday.
                  </p>
                  <span className="text-[10px] font-mono text-ink-muted mt-2 block">10:42 AM</span>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="bg-surface text-white rounded-2xl rounded-tr-sm p-4 max-w-[80%] shadow-xl">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                    <Zap className="w-3 h-3 text-ai fill-current" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ai">AI Resolution</span>
                  </div>
                  <p className="text-sm leading-relaxed">
                    Hi Emma! I've checked your tracking. Order #8821 is currently in the local facility and is scheduled for delivery today by 5 PM. 🚚
                  </p>
                  <span className="text-[10px] font-mono text-ink-mutedOnDark mt-2 block">10:43 AM</span>
                </div>
              </div>
            </div>

            {/* Input Footer */}
            <footer className="p-4 bg-white border-t border-gray-200">
              <div className="relative group">
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isAutopilot ? "AI is handling this conversation..." : "Type your manual response..."}
                  disabled={isAutopilot}
                  className={cn(
                    "w-full rounded-xl border p-4 pr-16 text-sm resize-none transition-all outline-none h-24",
                    isAutopilot 
                      ? "bg-gray-50 border-gray-100 text-ink-muted cursor-not-allowed italic" 
                      : "bg-white border-gray-200 focus:border-ai focus:ring-4 focus:ring-ai/5"
                  )}
                />
                {!isAutopilot && (
                  <button className="absolute bottom-4 right-4 w-10 h-10 bg-ai text-white rounded-lg flex items-center justify-center shadow-glow hover:bg-ai-hover transition-all">
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </footer>
          </main>

          {/* COLUMN 3: Context Pane (Midnight) */}
          <aside className="w-80 bg-surface-highlight flex flex-col">
            <div className="p-6 border-b border-surface-border">
              <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-6">Customer Profile</h3>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-border flex items-center justify-center text-lg font-bold text-white">
                    EW
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Emma Wilson</h4>
                    <p className="text-xs text-ink-mutedOnDark">emma.w@gmail.com</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-surface rounded-lg border border-surface-border">
                    <p className="text-[10px] font-bold text-ink-mutedOnDark uppercase tracking-widest mb-1">Total Spent</p>
                    <p className="text-sm font-mono text-white">$1,240.50</p>
                  </div>
                  <div className="p-3 bg-surface rounded-lg border border-surface-border">
                    <p className="text-[10px] font-bold text-ink-mutedOnDark uppercase tracking-widest mb-1">Orders</p>
                    <p className="text-sm font-mono text-white">12</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-4">Live Order Context</h3>
              
              <div className="bg-surface border border-surface-border rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-white">Order #8821</p>
                    <p className="text-[10px] text-ink-mutedOnDark mt-1">Placed Feb 10, 2026</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-ai/10 text-ai border border-ai/20">
                    Processing
                  </span>
                </div>

                <div className="space-y-2 pt-4 border-t border-surface-border">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-ink-mutedOnDark">Subtotal</span>
                    <span className="text-white font-mono">$89.00</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-ink-mutedOnDark">Shipping</span>
                    <span className="text-white font-mono">$0.00</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-surface-border">
                    <span className="text-white">Total</span>
                    <span className="text-ai font-mono">$89.00</span>
                  </div>
                </div>

                <button className="w-full py-2 bg-surface-highlight border border-surface-border rounded-lg text-[10px] font-bold text-white uppercase tracking-widest hover:bg-surface transition-colors flex items-center justify-center gap-2">
                  <ShoppingBag className="w-3 h-3" /> View in Shopify
                </button>
              </div>

              {/* AI Reasoning Preview */}
              <div className="mt-8 p-4 bg-ai/5 border border-ai/10 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-ai" />
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Cognitive Flow</h4>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-[10px] text-ink-mutedOnDark">
                    <div className="w-1 h-1 rounded-full bg-ai" />
                    Detected tracking inquiry
                  </li>
                  <li className="flex items-center gap-2 text-[10px] text-ink-mutedOnDark">
                    <div className="w-1 h-1 rounded-full bg-ai" />
                    Fetched Shopify Order #8821
                  </li>
                  <li className="flex items-center gap-2 text-[10px] text-ink-mutedOnDark">
                    <div className="w-1 h-1 rounded-full bg-ai" />
                    Applied friendly brand voice
                  </li>
                </ul>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </DashboardLayout>
  );
}