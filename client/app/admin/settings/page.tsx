'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useLang } from '@/components/LanguageProvider';

export default function AdminSettingsPage() {
  const { user, updateProfile } = useAuth();
  const { t, dir } = useLang();

  // --- Profile form state ---
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // --- Password form state ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- Shared state ---
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    const { error: err } = await updateProfile(name.trim(), email.trim());
    setSaving(false);
    if (err) {
      setError(err);
    } else {
      setSuccess(dir === 'rtl' ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully!');
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (newPassword.length < 6) {
      setError(dir === 'rtl' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(dir === 'rtl' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match.');
      return;
    }

    setSaving(true);
    const { error: err } = await updateProfile(user?.name || '', user?.email || '', newPassword);
    setSaving(false);
    if (err) {
      setError(err);
    } else {
      setSuccess(dir === 'rtl' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const avatarUrl = user?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=91f78e&color=002a06&size=256&bold=true`;

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto space-y-10" dir={dir}>
      {/* Page Header */}
      <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
        <h1 className="text-3xl font-black font-headline tracking-tighter text-on-surface uppercase">
          {dir === 'rtl' ? 'إعدادات الحساب' : 'Account Settings'}
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          {dir === 'rtl' ? 'تحديث بيانات المشرف وكلمة المرور' : 'Update your admin profile and credentials'}
        </p>
      </div>

      {/* Feedback banners */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-2xl text-primary text-sm font-bold animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-2xl text-error text-sm font-bold animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-xl">error</span>
          {error}
        </div>
      )}

      {/* ── Profile Info Card ── */}
      <section className="bg-surface-container rounded-3xl border border-white/5 overflow-hidden">
        {/* Card header with avatar */}
        <div className="p-8 border-b border-white/5 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl border-2 border-primary/20 overflow-hidden flex-shrink-0">
            <img src={avatarUrl} alt={user?.name || 'Admin'} className="w-full h-full object-cover" />
          </div>
          <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
            <p className="text-xl font-black font-headline text-on-surface">{user?.name || '—'}</p>
            <p className="text-sm text-on-surface-variant mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSaveProfile} className="p-8 space-y-6">
          <h2 className={`text-xs font-black uppercase tracking-[0.2em] text-primary mb-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            {dir === 'rtl' ? 'المعلومات الشخصية' : 'Personal Information'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={`block text-xs font-black uppercase tracking-widest text-on-surface-variant ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                {dir === 'rtl' ? 'الاسم الكامل' : 'Full Name'}
              </label>
              <div className="relative group">
                <span className={`material-symbols-outlined absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors text-sm`}>
                  person
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className={`w-full bg-background border border-outline-variant/20 focus:border-primary/50 rounded-xl ${dir === 'rtl' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'} py-3.5 text-sm font-bold outline-none transition-all`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`block text-xs font-black uppercase tracking-widest text-on-surface-variant ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                {dir === 'rtl' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative group">
                <span className={`material-symbols-outlined absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors text-sm`}>
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={`w-full bg-background border border-outline-variant/20 focus:border-primary/50 rounded-xl ${dir === 'rtl' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'} py-3.5 text-sm font-bold outline-none transition-all`}
                />
              </div>
            </div>
          </div>

          <div className={`flex ${dir === 'rtl' ? 'justify-start' : 'justify-end'}`}>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3.5 bg-primary text-on-primary-container font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_var(--accent-glow)] hover:shadow-[0_0_35px_var(--accent-glow)] transition-all disabled:opacity-50 active:scale-95"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-[#002a06]/30 border-t-[#002a06] rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-sm">save</span>
              )}
              {dir === 'rtl' ? 'حفظ التغييرات' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>

      {/* ── Change Password Card ── */}
      <section className="bg-surface-container rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5">
          <h2 className={`text-xs font-black uppercase tracking-[0.2em] text-secondary flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse justify-end' : ''}`}>
            <span className="material-symbols-outlined text-sm">lock</span>
            {dir === 'rtl' ? 'تغيير كلمة المرور' : 'Change Password'}
          </h2>
          <p className={`text-xs text-on-surface-variant mt-1 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            {dir === 'rtl' ? 'اترك الحقلين فارغين إذا لم ترد التغيير' : 'Leave blank if you do not want to change your password'}
          </p>
        </div>

        <form onSubmit={handleSavePassword} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={`block text-xs font-black uppercase tracking-widest text-on-surface-variant ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                {dir === 'rtl' ? 'كلمة المرور الجديدة' : 'New Password'}
              </label>
              <div className="relative group">
                <span className={`material-symbols-outlined absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors text-sm`}>
                  lock_open
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-background border border-outline-variant/20 focus:border-primary/50 rounded-xl ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3.5 text-sm font-bold outline-none transition-all`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`block text-xs font-black uppercase tracking-widest text-on-surface-variant ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                {dir === 'rtl' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </label>
              <div className="relative group">
                <span className={`material-symbols-outlined absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-secondary transition-colors text-sm`}>
                  lock
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-background border ${confirmPassword && confirmPassword !== newPassword ? 'border-error/50 focus:border-error' : 'border-outline-variant/20 focus:border-primary/50'} rounded-xl ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3.5 text-sm font-bold outline-none transition-all`}
                />
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-error text-[10px] font-bold">
                  {dir === 'rtl' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}
                </p>
              )}
            </div>
          </div>

          <div className={`flex ${dir === 'rtl' ? 'justify-start' : 'justify-end'}`}>
            <button
              type="submit"
              disabled={saving || !newPassword}
              className="flex items-center gap-2 px-8 py-3.5 bg-secondary text-on-primary-container font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_var(--accent-glow)] hover:shadow-[0_0_35px_var(--accent-glow)] transition-all disabled:opacity-40 active:scale-95"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-[#002a06]/30 border-t-[#002a06] rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-sm">key</span>
              )}
              {dir === 'rtl' ? 'تغيير كلمة المرور' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
