import React, { useEffect, useState } from 'react';
import { LayoutDashboard, MessageSquare, BookOpen, Settings, LogOut, Bell, Search, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { authApi } from '../../lib/api';

const navigation = [
  { name: 'The Pulse', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Copilot Inbox', href: '/dashboard/inbox', icon: MessageSquare },
  { name: 'Intelligence Hub', href: '/dashboard/training', icon: BookOpen },
  { name: 'Control Room', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }) {
  const location = useLocation();
  const [storeName, setStoreName] = useState('WeHandle.ai');

  useEffect(() => {
    let mounted = true;
    const loadMe = async () => {
      try {
        const me = await authApi.getMe();
        const name = me?.merchant?.name;
        if (mounted && name) setStoreName(name);
      } catch {
        // keep default
      }
    };
    loadMe();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-canvas flex font-sans">
      {/* Sidebar: THE ANCHOR (Midnight Charcoal) */}
      <aside className="w-64 bg-surface fixed inset-y-0 left-0 z-50 flex flex-col shadow-2xl">
        <div className="h-20 flex items-center px-8 border-b border-surface-border">
          <div className="w-9 h-9 bg-ai rounded-lg flex items-center justify-center text-white shadow-glow">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="ml-3 font-bold text-lg tracking-tight text-white">{storeName}</span>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 group relative",
                  isActive
                    ? "text-white bg-surface-highlight"
                    : "text-ink-mutedOnDark hover:text-white hover:bg-surface-highlight/50"
                )}
              >
                {isActive && <div className="absolute left-0 w-1 h-5 bg-ai rounded-r-full" />}
                <item.icon className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  isActive ? "text-ai" : "text-ink-mutedOnDark group-hover:text-white"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-surface-border">
          <button className="flex items-center w-full px-4 py-3 text-sm font-medium text-ink-mutedOnDark rounded-md hover:text-error hover:bg-error/5 transition-all group">
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Workspace (The Milk Canvas) */}
      <div className="flex-1 pl-64 flex flex-col">
        {/* Header: Frosted Quartz (Glass) */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-40 px-10 flex items-center justify-between">
          <div className="flex items-center bg-canvas-muted border border-gray-200 rounded-md px-4 py-2 w-80 group focus-within:bg-white focus-within:border-ai/50 transition-all">
            <Search className="w-4 h-4 text-ink-muted" />
            <input 
              type="text" 
              placeholder="Command search..." 
              className="bg-transparent border-none outline-none ml-3 text-sm text-ink-base w-full placeholder:text-ink-muted"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ai-dim border border-ai/10">
              <div className="w-2 h-2 rounded-full bg-ai animate-pulse shadow-glow" />
              <span className="text-[10px] font-mono text-ai font-bold uppercase tracking-widest">Neural Link Active</span>
            </div>
            <button className="p-2 text-ink-muted hover:text-ink-base transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}