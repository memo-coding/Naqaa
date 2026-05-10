import React from 'react';

interface ErrorMessageProps {
  message?: string;
  className?: string;
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className={`flex items-center gap-1.5 px-2 text-error animate-in fade-in slide-in-from-top-1 ${className || ''}`}>
      <span className="material-symbols-outlined text-[14px]">error</span>
      <span className="text-[10px] font-black uppercase tracking-tight">{message}</span>
    </div>
  );
}
