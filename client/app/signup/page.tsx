'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useLang } from '@/components/LanguageProvider';
import { BrandLogo } from '@/components/BrandLogo';
import { useForm, validators } from '@/lib/hooks/useForm';
import { FormField } from '@/components/FormField';
import { AuthButton } from '@/components/AuthButton';

export default function SignupPage() {
  const { signup } = useAuth();
  const { t, dir } = useLang();
  const router = useRouter();

  const { values, errors, handleChange, validate, isSubmitting, setIsSubmitting, setErrors } = useForm(
    { name: '', email: '', password: '' },
    {
      name: [validators.required(t('validation_required') || 'Name is required')],
      email: [
        validators.required(t('validation_required') || 'Email is required'),
        validators.email(t('validation_email') || 'Invalid email format')
      ],
      password: [
        validators.required(t('validation_required') || 'Password is required'),
        validators.minLength(6, t('validation_password_length') || 'Minimum 6 characters')
      ]
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const sanitizedName = values.name.trim().replace(/[<>]/g, ""); 
    const sanitizedEmail = values.email.trim().toLowerCase();

    const { error: authError } = await signup(sanitizedEmail, values.password, sanitizedName);

    if (authError) {
      setErrors({ email: authError });
      setIsSubmitting(false);
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
            <h2 className="text-2xl font-black font-headline uppercase leading-none">
              {t('auth_signup_title') || 'Initialize Account'}
            </h2>
          </div>
          <p className="mt-2 text-on-surface-variant font-medium text-sm">
            {t('auth_signup_subtitle') || 'Join our global botanical collective'}
          </p>
        </div>

        <form noValidate className="space-y-8" onSubmit={handleSubmit}>
          <FormField
            label={t('auth_name_label') || 'Full Name'}
            type="text"
            value={values.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Elena Vance"
            error={errors.name}
            icon="person"
            isRequired
          />

          <FormField
            label={t('auth_email_label') || 'Email Address'}
            type="email"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="email@collective.bio"
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

          <AuthButton type="submit" isLoading={isSubmitting} icon="person_add">
            {t('auth_signup_cta') || 'Initialize Account'}
          </AuthButton>
        </form>

        <div className="mt-10 text-center">
          <p className="text-on-surface-variant text-xs font-bold uppercase leading-loose">
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
