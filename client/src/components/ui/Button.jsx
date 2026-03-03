import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({ 
  className, variant = 'primary', size = 'default', isLoading = false, children, ...props 
}, ref) => {
  const variants = {
    primary: "bg-surface text-white hover:bg-black shadow-2xl active:scale-95",
    ai: "bg-ai text-white shadow-glow hover:brightness-110 active:scale-95",
    white: "bg-white text-surface hover:bg-canvas-muted shadow-xl active:scale-95",
    outline: "border border-border-stone bg-transparent text-ink-base hover:bg-canvas-muted active:scale-95",
    ghost: "text-ink-muted hover:bg-canvas-muted hover:text-ink-base",
  };
  const sizes = {
    default: "h-12 px-8 rounded-full text-xs font-bold uppercase tracking-[0.2em]",
    sm: "h-10 px-6 rounded-full text-[10px] font-bold uppercase tracking-widest",
    lg: "h-20 px-14 text-xl rounded-full font-bold tracking-tighter",
  };
  return (
    <button ref={ref} className={cn("inline-flex items-center justify-center transition-all duration-500 disabled:opacity-50", variants[variant], sizes[size], className)} disabled={isLoading || props.disabled} {...props}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
Button.displayName = "Button";
export { Button };