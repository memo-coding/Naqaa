import React from 'react';

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  icon?: string;
  children: React.ReactNode;
}

export function AuthButton({ isLoading, icon, children, className, ...props }: AuthButtonProps) {
  return (
    <button 
      disabled={isLoading || props.disabled}
      className={`w-full py-5 bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-black uppercase rounded-[10px] transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 ${className || ''}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-xl animate-spin"></span>
      ) : (
        <>
          {icon && <span className="material-symbols-outlined text-sm">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
