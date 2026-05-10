'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useLang } from '@/components/LanguageProvider';
import { BrandLogo } from '@/components/BrandLogo';
import { useForm, validators } from '@/lib/hooks/useForm';
import { FormField } from '@/components/FormField';

export default function Login() {
  const { login } = useAuth();
  const { t, dir } = useLang();
  const router = useRouter();

  const { values, errors, handleChange, validate, isSubmitting, setIsSubmitting, setErrors } = useForm(
    { email: '', password: '' },
    {
      email: [
        validators.required(t('validation_required') || 'Email is required'),
        validators.email(t('validation_email') || 'Invalid email format')
      ],
      password: [
        validators.required(t('validation_required') || 'Password is required')
      ]
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const sanitizedEmail = values.email.trim().toLowerCase();

    const { error: authError, role } = await login(sanitizedEmail, values.password);

    if (authError) {
      setErrors({ email: authError }); // Show general error on email field or dedicated alert
      setIsSubmitting(false);
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
      <div className="max-w-md w-full space-y-12 relative z-10 p-8 sm:p-12 glass-panel rounded-[10px] border border-primary/20 shadow-2xl">
        <div className="text-center space-y-4">
          <BrandLogo className="mx-auto" />
          <div className="space-y-1">
            <h2 className="text-2xl font-black font-headline uppercase leading-none">{t('auth_login_title')}</h2>
          </div>
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-8">
          <FormField
            label={t('auth_email') || 'Email Address'}
            type="email"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="user@naqaa.com"
            error={errors.email}
            icon="mail"
            isRequired
          />

          <FormField
            label={t('auth_password_label') || 'Password'}
            type="password"
            value={values.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="••••••••"
            error={errors.password}
            icon="lock_open"
            isRequired
          />

          <AuthButton type="submit" isLoading={isSubmitting} icon="login">
            {t('auth_login_cta') || 'Login'}
          </AuthButton>
        </form>

        <div className="text-center pt-8 border-t border-outline-variant/10">
          <p className="text-[10px] text-on-surface-variant/40 font-bold uppercase leading-relaxed">
            {t('auth_no_account')}<br/>
            <Link href="/signup" className="text-secondary hover:underline ml-1">{t('auth_signup_cta')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
