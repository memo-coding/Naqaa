'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useLang } from '@/components/LanguageProvider';
import { BrandLogo } from '@/components/BrandLogo';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();
  const { t, dir } = useLang();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setError('');

    let hasErrors = false;
    const errors: { name?: string; email?: string; password?: string } = {};

    if (!name.trim()) {
      errors.name = t('validation_required') || 'الاسم مطلوب / Name Required';
      hasErrors = true;
    }

    if (!email) {
      errors.email = t('validation_required') || 'البريد مطلوب / Email Required';
      hasErrors = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = t('validation_email') || 'صيغة البريد الإلكتروني غير صحيحة / Invalid Email';
      hasErrors = true;
    }

    if (!password) {
      errors.password = t('validation_required') || 'كلمة المرور مطلوبة / Password Required';
      hasErrors = true;
    } else if (password.length < 6) {
      errors.password = t('validation_password_length') || 'كلمة المرور قصرية جداً (6 أحرف على الأقل) / Password too short (min 6 chars)';
      hasErrors = true;
    }

    if (hasErrors) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);

    // Sanitize inputs
    const sanitizedName = name.trim().replace(/[<>]/g, ""); 
    const sanitizedEmail = email.trim().toLowerCase();

    const { error: authError } = await signup(sanitizedEmail, password, sanitizedName);

    if (authError) {
      setError(authError);
      setIsLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 pt-32 bg-background relative overflow-hidden" dir={dir}>
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary rounded-xl blur-[120px]"></div>
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-secondary rounded-xl blur-[150px]"></div>
      </div>

      <div className="max-w-md w-full glass-panel p-10 rounded-[2.5rem] border border-primary/20 relative z-10 shadow-2xl">
        <div className="text-center mb-10">
          <BrandLogo className="mb-4" />
          <div className="space-y-1">
            <h2 className="text-2xl font-black font-headline  uppercase leading-none">
              {t('auth_signup_title') || 'Initialize Account'}
            </h2>
          </div>
          <p className="mt-2 text-on-surface-variant font-medium text-sm">
            {t('auth_signup_subtitle') || 'Join our global botanical collective'}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-bold text-center animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase  text-primary/70 ml-1">
              {t('auth_name_label') || 'Full Name'}
            </label>
            <div className="relative group">
              <span className={`material-symbols-outlined absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-[20px] -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors`}>person</span>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full bg-surface-container border-none focus:ring-2 ${validationErrors.name ? 'ring-2 ring-error/50 focus:ring-error/80' : 'focus:ring-primary/30'} rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 text-sm outline-none transition-all placeholder:text-on-surface-variant/30 font-bold`}
                placeholder="Elena Vance"
              />
            </div>
            {validationErrors.name && <div className="text-error text-[10px] font-bold px-2">{validationErrors.name}</div>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase  text-primary/70 ml-1">
              {t('auth_email_label') || 'Email Address'}
            </label>
            <div className="relative group">
              <span className={`material-symbols-outlined absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-[20px] -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors`}>mail</span>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-surface-container border-none focus:ring-2 ${validationErrors.email ? 'ring-2 ring-error/50 focus:ring-error/80' : 'focus:ring-primary/30'} rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 text-sm outline-none transition-all placeholder:text-on-surface-variant/30 font-bold`}
                placeholder="email@collective.bio"
              />
            </div>
            {validationErrors.email && <div className="text-error text-[10px] font-bold px-2">{validationErrors.email}</div>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase  text-primary/70 ml-1">
              {t('auth_password_label') || 'Password'}
            </label>
            <div className="relative group">
              <span className={`material-symbols-outlined absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-[20px] -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors`}>lock_open</span>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-surface-container border-none focus:ring-2 ${validationErrors.password ? 'ring-2 ring-error/50 focus:ring-error/80' : 'focus:ring-primary/30'} rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 text-sm outline-none transition-all placeholder:text-on-surface-variant/30 font-bold`}
                placeholder="••••••••"
              />
            </div>
            {validationErrors.password && <div className="text-error text-[10px] font-bold px-2">{validationErrors.password}</div>}
          </div>


          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-black uppercase  rounded-2xl shadow-[0_0_30px_var(--accent-glow)] hover:shadow-[0_0_50px_var(--accent-glow)] transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-xl animate-spin"></span>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">person_add</span>
                {t('auth_signup_cta') || 'Initialize Account'}
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-on-surface-variant text-xs font-bold uppercase  leading-loose">
            {t('auth_have_account') || "Already part of the collective?"} <br/>
            <Link href="/login" className="text-secondary hover:underline ml-1">
              {t('auth_login_cta') || 'Enter Atelier'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
