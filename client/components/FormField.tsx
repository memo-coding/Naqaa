import { ErrorMessage } from './ErrorMessage';
import { useLang } from './LanguageProvider';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label: string;
  error?: string;
  icon?: string;
  isTextArea?: boolean;
  isRequired?: boolean;
  options?: { value: string | number; label: string }[];
}

export function FormField({ 
  label, 
  error, 
  icon, 
  isTextArea, 
  isRequired,
  options,
  className, 
  ...props 
}: FormFieldProps) {
  const { dir } = useLang();

  const baseInputClasses = `
    w-full bg-surface-container rounded-[10px] py-4 text-sm outline-none transition-all 
    placeholder:text-on-surface-variant/30 font-bold
    ${error 
      ? 'border-2 border-[#ff6347] ring-4 ring-[#ff6347]/10' 
      : 'border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10'}
    ${icon ? (dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4') : 'px-6'}
    ${className || ''}
  `;

  return (
    <div className="space-y-2 w-full group">
      <label className="flex items-center gap-1.5 px-1">
        <span className="text-[10px] font-black uppercase text-on-surface-variant/70 tracking-wider">
          {label}
        </span>
        {isRequired && <span className="text-[#ff6347] text-sm font-black">*</span>}
      </label>
      
      <div className="relative">
        {icon && (
          <span 
            className={`material-symbols-outlined absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-[50%] -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors z-10 pointer-events-none`}
          >
            {icon}
          </span>
        )}

        {options ? (
          <select 
            className={`${baseInputClasses} appearance-none cursor-pointer`}
            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-surface-container text-on-surface">
                {opt.label}
              </option>
            ))}
          </select>
        ) : isTextArea ? (
          <textarea 
            className={`${baseInputClasses} resize-none min-h-[120px]`}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input 
            className={baseInputClasses}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
      </div>

      <ErrorMessage message={error} />
    </div>
  );
}
