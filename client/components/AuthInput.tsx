import React from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: string;
  dir?: string;
}

export function AuthInput({ label, error, icon, dir = 'ltr', className, ...props }: AuthInputProps) {
  return (
    <div className="space-y-4 w-full">
      <label className="text-[10px] font-black uppercase text-primary/70 ml-1 block">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <span 
            className={`material-symbols-outlined absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-[20px] -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors z-10`}
          >
            {icon}
          </span>
        )}
        <input 
          className={`w-full bg-surface-container border-none focus:ring-2 ${error ? 'ring-2 ring-error/50 focus:ring-error/80' : 'focus:ring-primary/30'} rounded-[10px] ${icon ? (dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4') : 'px-6'} py-4 text-sm outline-none transition-all placeholder:text-on-surface-variant/30 font-bold ${className || ''}`}
          {...props}
        />
      </div>
      {error && <div className="text-error text-[10px] font-bold px-2">{error}</div>}
    </div>
  );
}
