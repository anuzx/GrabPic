import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { haptic } from '../lib/haptic';

interface CustomAlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description: string;
  className?: string;
}

export function CustomAlert({ type, title, description, className = '' }: CustomAlertProps) {
  React.useEffect(() => {
    // Trigger respective haptics on mount
    if (type === 'success') haptic.success();
    else if (type === 'error') haptic.error();
    else if (type === 'warning') haptic.warning();
    else haptic.light();
  }, [type]);

  const config = {
    info: {
      icon: Info,
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/5',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/5'
    },
    success: {
      icon: CheckCircle2,
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/5',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/5'
    },
    warning: {
      icon: AlertTriangle,
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/5',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/5'
    },
    error: {
      icon: AlertCircle,
      border: 'border-destructive/20',
      bg: 'bg-destructive/5',
      text: 'text-destructive',
      glow: 'shadow-destructive/5'
    }
  }[type];

  const Icon = config.icon;

  return (
    <div className={`flex gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg ${config.border} ${config.bg} ${config.glow} ${className} transition-all duration-300 animate-in fade-in slide-in-from-top-4`}>
      <Icon className={`w-5 h-5 shrink-0 ${config.text} mt-0.5`} />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-foreground leading-none">{title}</span>
        <span className="text-xs text-muted-foreground leading-relaxed">{description}</span>
      </div>
    </div>
  );
}
export default CustomAlert;
