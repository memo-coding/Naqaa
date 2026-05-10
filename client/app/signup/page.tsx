'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useLang } from '@/components/LanguageProvider';
import { BrandLogo } from '@/components/BrandLogo';
import { AuthInput } from '@/components/AuthInput';
import { AuthButton } from '@/components/AuthButton';
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
      <div className="max-w-md w-full glass-panel p-10 rounded-[10px] border border-primary/20 relative z-10">
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

          <AuthInput
            label={t('auth_name_label') || 'Full Name'}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Elena Vance"
            error={validationErrors.name}
            icon="person"
            dir={dir}
          />

          <AuthInput
            label={t('auth_email_label') || 'Email Address'}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@collective.bio"
            error={validationErrors.email}
            icon="mail"
            dir={dir}
          />

          <AuthInput
            label={t('auth_password_label') || 'Password'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            error={validationErrors.password}
            icon="lock_open"
            dir={dir}
          />

          <AuthButton type="submit" isLoading={isLoading} icon="person_add">
            {t('auth_signup_cta') || 'Initialize Account'}
          </AuthButton>
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
