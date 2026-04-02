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
import { inboxApi } from '../../lib/api';

export default function Inbox() {
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isAutopilot, setIsAutopilot] = useState(true);
  const [message, setMessage] = useState('');
  const [shopifyContext, setShopifyContext] = useState(null);
  const [shopifyUrl, setShopifyUrl] = useState('');
  const [shopifyError, setShopifyError] = useState('');
  const [shopifySynced, setShopifySynced] = useState(true);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyError, setReplyError] = useState('');

  const renderAiContent = (content) => {
    if (!content) return '';
    let cleaned = String(content).trim();

    if (cleaned.startsWith('```')) {
      const lines = cleaned.split('\n');
      if (lines.length >= 3 && lines[lines.length - 1].startsWith('```')) {
        cleaned = lines.slice(1, -1).join('\n').trim();
        if (cleaned.toLowerCase().startsWith('json')) {
          cleaned = cleaned.slice(4).trim();
        }
      }
    }

    try {
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === 'object' && typeof parsed.answer === 'string') {
        return parsed.answer;
      }
    } catch {
      // fall back to raw text
    }

    return cleaned;
  };

  useEffect(() => {
    const loadTickets = async () => {
      const data = await inboxApi.getTickets();
      setTickets(data);
      if (data.length > 0) {
        setActiveTicket(data[0]);
      }
    };
    loadTickets();
  }, []);

  useEffect(() => {
    if (!activeTicket) return;
    const loadThread = async () => {
      const thread = await inboxApi.getThread(activeTicket.id);
      setMessages(thread.messages || []);
      setIsAutopilot(thread.status === 'AUTOPILOT');
    };
    loadThread();
  }, [activeTicket?.id]);

  useEffect(() => {
    if (!activeTicket) return;
    const loadContext = async () => {
      try {
        const ctx = await inboxApi.getContext(activeTicket.id);
        setShopifyContext(ctx.shopify_context || null);
        setShopifyUrl(ctx.shopify_shop_url || '');
        setShopifySynced(ctx?.shopify_synced !== false);
        if (ctx?.shopify_synced === false) {
          setShopifyError('Shopify not synced');
        } else {
          setShopifyError('');
        }
      } catch {
        setShopifyContext(null);
        setShopifySynced(false);
        setShopifyError('Shopify not synced');
      }
    };
    loadContext();
  }, [activeTicket?.id]);

  useEffect(() => {
    if (!activeTicket) return;
    const merchantId = activeTicket.merchant_id;
    if (!merchantId) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.hostname;
    const wsPort = '8000';
    const url = `${wsProtocol}://${wsHost}:${wsPort}/api/v1/inbox/ws/${merchantId}`;
    const socket = new WebSocket(url);

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'message.new' && payload.ticketId === activeTicket.id) {
          setMessages((prev) => [...prev, payload.message]);
        }
        if (payload.type === 'ticket.created') {
          setTickets((prev) => {
            const exists = prev.some((t) => t.id === payload.ticketId);
            if (exists) return prev;
            const nextTicket = {
              id: payload.ticketId,
              merchant_id: merchantId,
              customer_email: payload.customer_email,
              customer_name: payload.customer_name,
              intent: payload.intent,
              status: payload.status || 'AUTOPILOT',
              channel: payload.channel || 'EMAIL',
            };
            return [nextTicket, ...prev];
          });
        }
      } catch {
        // ignore malformed messages
      }
    };

    return () => {
      socket.close();
    };
  }, [activeTicket?.id]);

  const handleSendReply = async () => {
    if (!activeTicket || !message.trim() || isAutopilot) return;
    setIsSendingReply(true);
    setReplyError('');
    try {
      const sent = await inboxApi.sendReply(activeTicket.id, message.trim());
      setMessages((prev) => [...prev, sent]);
      setMessage('');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setReplyError(typeof detail === 'string' ? detail : 'Unable to send reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  const lastOrder = shopifyContext?.orders?.[0] || null;
  const customerFound = shopifyContext?.customer_found === true;
  const totalSpentAmount = shopifyContext?.customer?.total_spent?.amount;
  const totalSpentCurrency = shopifyContext?.customer?.total_spent?.currencyCode;
  const orderCount = shopifyContext?.customer?.order_count ?? shopifyContext?.orders?.length ?? 0;
  const totalSpentValue = Number(totalSpentAmount);
  const formattedTotalSpent = Number.isFinite(totalSpentValue)
    ? `$${totalSpentValue.toFixed(2)}${totalSpentCurrency ? ` ${totalSpentCurrency}` : ''}`
    : null;
  const lastOrderItems = (lastOrder?.lineItems?.edges || []).map((edge) => edge?.node).filter(Boolean);

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
              {tickets.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveTicket(chat)}
                  className={cn(
                    "w-full p-4 flex items-start gap-3 border-b border-surface-border transition-all text-left",
                    activeTicket?.id === chat.id ? "bg-surface-highlight" : "hover:bg-white/[0.02]"
                  )}
                >
                  <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-surface-border flex items-center justify-center text-xs font-bold text-ink-mutedOnDark">
                      {(chat.customer_name || chat.customer_email || '?')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                  </div>
                    {chat.status === 'AUTOPILOT' && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-ai rounded-full border-2 border-surface flex items-center justify-center">
                        <Zap className="w-2 h-2 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className={cn("text-sm font-bold", "text-ink-mutedOnDark")}>
                        {chat.customer_name || chat.customer_email}
                      </span>
                      <span className="text-[10px] font-mono text-ink-mutedOnDark uppercase">{/* time placeholder */}</span>
                    </div>
                    <p className="text-xs text-ink-mutedOnDark truncate">{chat.intent || 'Conversation'}</p>
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
                {activeTicket && (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs">
                      {(activeTicket.customer_name || activeTicket.customer_email || '?')[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink-base">
                        {activeTicket.customer_name || activeTicket.customer_email}
                      </h3>
                      <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">
                        {activeTicket.intent || 'Conversation'}
                      </p>
                    </div>
                  </>
                )}
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
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={m.sender_type === 'CUSTOMER' ? 'flex justify-start' : 'flex justify-end'}
                >
                  <div
                    className={
                      m.sender_type === 'CUSTOMER'
                        ? 'bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-4 max-w-[80%] shadow-sm'
                        : 'bg-surface text-white rounded-2xl rounded-tr-sm p-4 max-w-[80%] shadow-xl'
                    }
                  >
                    {m.sender_type === 'AI' && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                        <Zap className="w-3 h-3 text-ai fill-current" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ai">
                          AI Resolution
                        </span>
                      </div>
                    )}
                    <p
                      className={`text-sm leading-relaxed ${
                        m.sender_type === 'AI' ? 'text-white' : 'text-ink-base'
                      }`}
                    >
                      {m.sender_type === 'AI' ? renderAiContent(m.content) : m.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Footer */}
            <footer className="p-4 bg-white border-t border-gray-200">
              {replyError && (
                <p className="mb-2 text-[10px] font-bold text-error uppercase tracking-widest">{replyError}</p>
              )}
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
                  <button
                    onClick={handleSendReply}
                    disabled={isSendingReply || !message.trim()}
                    className="absolute bottom-4 right-4 w-10 h-10 bg-ai text-white rounded-lg flex items-center justify-center shadow-glow hover:bg-ai-hover transition-all disabled:opacity-50"
                  >
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
                    {(shopifyContext?.customer?.name || activeTicket?.customer_name || activeTicket?.customer_email || '?')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {shopifyContext?.customer?.name || activeTicket?.customer_name || 'Customer'}
                    </h4>
                    <p className="text-xs text-ink-mutedOnDark">
                      {shopifyContext?.customer?.email || activeTicket?.customer_email || ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-surface rounded-lg border border-surface-border">
                    <p className="text-[10px] font-bold text-ink-mutedOnDark uppercase tracking-widest mb-1">Total Spent</p>
                    <p className="text-sm font-mono text-white">
                      {formattedTotalSpent
                        ? formattedTotalSpent
                        : shopifySynced
                          ? (customerFound ? '$0.00' : 'Customer not in Shopify')
                          : 'Shopify not synced'}
                    </p>
                  </div>
                  <div className="p-3 bg-surface rounded-lg border border-surface-border">
                    <p className="text-[10px] font-bold text-ink-mutedOnDark uppercase tracking-widest mb-1">Orders</p>
                    <p className="text-sm font-mono text-white">
                      {orderCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-4">Live Order Context</h3>
              
              <div className="bg-surface border border-surface-border rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-white">
                      {shopifyContext?.orders?.[0]?.name || 'No orders'}
                    </p>
                    <p className="text-[10px] text-ink-mutedOnDark mt-1">
                      {shopifyContext?.orders?.[0]?.processedAt || ''}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-ai/10 text-ai border border-ai/20">
                    {shopifySynced
                      ? (customerFound ? (lastOrder?.fulfillmentStatus || 'SYNCED') : 'CUSTOMER NOT FOUND')
                      : 'SHOPIFY NOT SYNCED'}
                  </span>
                </div>

                <div className="space-y-2 pt-4 border-t border-surface-border">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-ink-mutedOnDark">Subtotal</span>
                    <span className="text-white font-mono">
                      {lastOrder?.totalPriceSet?.shopMoney?.amount
                        ? `$${lastOrder.totalPriceSet.shopMoney.amount}`
                        : '$0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-ink-mutedOnDark">Shipping</span>
                    <span className="text-white font-mono">$0.00</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-surface-border">
                    <span className="text-white">Total</span>
                    <span className="text-ai font-mono">
                      {lastOrder?.totalPriceSet?.shopMoney?.amount
                        ? `$${lastOrder.totalPriceSet.shopMoney.amount}`
                        : '$0.00'}
                    </span>
                  </div>
                </div>

                {lastOrderItems.length > 0 && (
                  <div className="pt-3 border-t border-surface-border">
                    <p className="text-[10px] font-bold text-ink-mutedOnDark uppercase tracking-widest mb-2">Last Order Items</p>
                    <ul className="space-y-1">
                      {lastOrderItems.slice(0, 5).map((item, idx) => (
                        <li key={`${item?.name || 'item'}-${idx}`} className="text-xs text-white flex justify-between gap-2">
                          <span className="truncate">{item?.name}</span>
                          <span className="font-mono text-ink-mutedOnDark">x{item?.quantity || 1}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {shopifyError && (
                  <p className="text-[10px] text-error uppercase tracking-widest">{shopifyError}</p>
                )}

                <button
                  className="w-full py-2 bg-surface-highlight border border-surface-border rounded-lg text-[10px] font-bold text-white uppercase tracking-widest hover:bg-surface transition-colors flex items-center justify-center gap-2"
                  type="button"
                  onClick={() => {
                    if (shopifyUrl && shopifyContext?.orders?.[0]?.id) {
                      window.open(`${shopifyUrl}/orders/${shopifyContext.orders[0].id}`, '_blank');
                    }
                  }}
                >
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
                  {(() => {
                    const latestAi = [...messages].reverse().find((m) => m.sender_type === 'AI');
                    const logs = latestAi?.cognitive_logs || {};
                    if (Array.isArray(logs.flow_steps) && logs.flow_steps.length > 0) {
                      return logs.flow_steps.map((text, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-[10px] text-ink-mutedOnDark">
                          <div className="w-1 h-1 rounded-full bg-ai" />
                          {text}
                        </li>
                      ));
                    }
                    const items = [];
                    if (logs.intent) {
                      items.push(`Detected Intent: ${logs.intent}`);
                    }
                    if (logs.shopify_context?.orders?.length || logs.order_name) {
                      items.push('Fetched Shopify Orders');
                    }
                    if (logs.tone) {
                      items.push(`Applied ${logs.tone} Tone`);
                    }
                    if (items.length === 0) {
                      items.push('AI reasoning will appear here as tickets are processed.');
                    }
                    return items.map((text, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-[10px] text-ink-mutedOnDark">
                        <div className="w-1 h-1 rounded-full bg-ai" />
                        {text}
                      </li>
                    ));
                  })()}
                </ul>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </DashboardLayout>
  );
}