'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useLang } from '@/components/LanguageProvider';
import { BrandLogo } from '@/components/BrandLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const { t, dir } = useLang();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setError('');

    let hasErrors = false;
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = t('validation_required') || 'هذا الحقل مطلوب / Required';
      hasErrors = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = t('validation_email') || 'صيغة البريد الإلكتروني غير صحيحة / Invalid Email';
      hasErrors = true;
    }

    if (!password) {
      errors.password = t('validation_required') || 'هذا الحقل مطلوب / Required';
      hasErrors = true;
    } 

    if (hasErrors) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);

    // Sanitize basic input on frontend before sending
    const sanitizedEmail = email.trim().toLowerCase();

    const { error: authError, role } = await login(sanitizedEmail, password);

    if (authError) {
      setError(authError);
      setIsLoading(false);
    } else {
      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 pt-32 bg-background relative overflow-hidden" dir={dir}>
      <div className="max-w-md w-full space-y-12 relative z-10 p-8 sm:p-12 glass-panel rounded-[5px] border-primary/20 shadow-2xl">
        <div className="text-center space-y-4">
          <BrandLogo className="mx-auto" />
          <div className="space-y-1">
            <h2 className="text-2xl font-black font-headline  uppercase leading-none">{t('auth_login_title')}</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase  text-on-surface-variant ml-2">{t('auth_email') || 'Email Address'}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full bg-surface-container-high border ${validationErrors.email ? 'border-error focus:border-error' : 'border-outline-variant/30 focus:border-primary/50'} px-6 py-4 rounded-[5px] outline-none transition-all font-bold text-sm`}
              placeholder="user@naqaa.com"
            />
            {validationErrors.email && <div className="text-error text-[10px] font-bold px-2">{validationErrors.email}</div>}
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase  text-on-surface-variant ml-2">{t('auth_password_label')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full bg-surface-container-high border ${validationErrors.password ? 'border-error focus:border-error' : 'border-outline-variant/30 focus:border-primary/50'} px-6 py-4 rounded-[5px] outline-none transition-all font-bold text-sm`}
              placeholder="••••••••"
            />
            {validationErrors.password && <div className="text-error text-[10px] font-bold px-2">{validationErrors.password}</div>}
          </div>

          {error && (
            <div className="px-4 py-3 bg-error/10 border border-error/20 rounded-xl text-error text-[10px] font-black uppercase  text-center animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-primary text-[#002a06] font-black uppercase ] rounded-[5px] transition-all text-xs flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-[#002a06]/30 border-t-[#002a06] rounded-xl animate-spin"></span>
            ) : (
              <>
                {t('auth_login_cta')}
                <span className="material-symbols-outlined text-sm">login</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-8 border-t border-outline-variant/10">
          <p className="text-[10px] text-on-surface-variant/40 font-bold uppercase  leading-relaxed">
            {t('auth_no_account')}<br/>
            <Link href="/signup" className="text-secondary hover:underline ml-1">{t('auth_signup_cta')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
