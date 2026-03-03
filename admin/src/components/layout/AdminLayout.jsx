import React from 'react';
import { Shield, LayoutDashboard, Globe, Activity, Settings, LogOut, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function AdminLayout({ children }) {
  const location = useLocation();
  const nav = [
    { name: 'Global Pulse', href: '/', icon: LayoutDashboard },
    { name: 'Client Ledger', href: '/clients', icon: Globe },
    { name: 'System Health', href: '/health', icon: Activity },
    { name: 'Revenue Ops', href: '/revenue', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-canvas flex font-sans">
      {/* Sidebar: Midnight Admin */}
      <aside className="w-64 bg-surface fixed inset-y-0 left-0 z-50 flex flex-col shadow-2xl">
        <div className="h-20 flex items-center px-8 border-b border-surface-border">
          <div className="w-9 h-9 bg-ai rounded-lg flex items-center justify-center text-white">
            <Shield className="w-5 h-5" />
          </div>
          <span className="ml-3 font-bold text-lg text-white tracking-tight">WH Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => (
            <Link key={item.name} to={item.href} className={cn(
              "flex items-center px-4 py-3 text-sm font-bold uppercase tracking-widest rounded-md transition-all",
              location.pathname === item.href ? "text-white bg-surface-highlight" : "text-ink-mutedOnDark hover:text-white"
            )}>
              <item.icon className={cn("mr-3 h-4 w-4", location.pathname === item.href ? "text-ai" : "text-ink-mutedOnDark")} />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Area */}
      <div className="flex-1 pl-64 flex flex-col">
        <header className="h-20 border-b border-gray-200 px-10 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-40">
          <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-ink-muted">Internal Command</h2>
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-ai/10 text-ai flex items-center justify-center font-bold text-xs">A</div>
          </div>
        </header>
        <main className="p-10">{children}</main>
      </div>
    </div>
  );
}