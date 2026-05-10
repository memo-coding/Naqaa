'use client';
import { useLang } from '@/components/LanguageProvider';
import { useCMS } from '@/components/CMSProvider';
import { useState, useCallback, useEffect } from 'react';
import { fetchApi, getImageUrl } from '@/lib/api';

export default function CMSManager() {
  const { t, dir, lang } = useLang();
  const { data: cms, updateData } = useCMS();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(cms);
  const [dragActive, setDragActive] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchApi('/products').then(data => {
      if (data) setAvailableProducts(data.filter((p: any) => p.is_active));
    });
  }, []);

  // Sync internal form data when provider data loads from backend
  useEffect(() => {
    setFormData(cms);
  }, [cms]);

  const handleProductSelect = (index: number, productId: string) => {
    const newIds = [...(formData.featuredProductIds || [])];
    // Pad array if needed
    while (newIds.length <= index) newIds.push('');
    newIds[index] = productId;
    setFormData({ ...formData, featuredProductIds: newIds });
  };

  const handleSave = () => {
    updateData(formData);
    setIsEditing(false);
  };

  const onFileUpload = useCallback((field: 'heroImg' | 'logoUrl', file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Please use an image under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFormData(prev => ({ ...prev, [field]: result, logoType: field === 'logoUrl' ? 'image' : prev.logoType }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrag = (e: React.DragEvent, field: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(field);
    } else if (e.type === "dragleave") {
      setDragActive(null);
    }
  };

  const handleDrop = (e: React.DragEvent, field: 'heroImg' | 'logoUrl') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(field, e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'heroImg' | 'logoUrl') => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(field, e.target.files[0]);
    }
  };

  const ImageUploader = ({ field, label }: { field: 'heroImg' | 'logoUrl', label: string }) => (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase  opacity-50">{label}</label>
      <div
        onDragEnter={(e) => handleDrag(e, field)}
        onDragOver={(e) => handleDrag(e, field)}
        onDragLeave={(e) => handleDrag(e, field)}
        onDrop={(e) => handleDrop(e, field)}
        className={`relative h-48 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all overflow-hidden ${dragActive === field ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
      >
        {formData[field] ? (
          <>
            <img
              src={getImageUrl(formData[field])}
              className="absolute inset-0 w-full h-full object-cover opacity-40 hover:opacity-60 transition-opacity"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800";
              }}
            />
            <div className="relative z-10 text-center p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 mx-4">
              <span className="material-symbols-outlined text-primary text-3xl mb-2">check_circle</span>
              <p className="text-[10px] font-black uppercase ">Image Loaded</p>
              <button
                onClick={() => setFormData(prev => ({ ...prev, [field]: '' }))}
                className="mt-2 text-[8px] underline opacity-60 hover:opacity-100 flex items-center justify-center gap-1 w-full"
              ><span className="material-symbols-outlined text-[10px]">delete</span> Remove</button>
            </div>
          </>
        ) : (
          <div className="text-center p-4">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-2 opacity-50">add_photo_alternate</span>
            <p className="text-[10px] font-black uppercase ">{t('admin_upload_hint')}</p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, field)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      <div className="relative group">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-sm opacity-50">link</span>
        <input
          type="text"
          placeholder="Paste high-quality direct image URL..."
          value={formData[field]}
          onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
          className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] font-bold outline-none focus:border-primary/40 focus:bg-surface-container-high transition-all"
        />
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full" dir={dir}>
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
        <div>
          <h2 className="text-4xl font-black font-headline  text-on-surface uppercase mb-1 flex items-center gap-3">
             <span className="material-symbols-outlined text-primary text-4xl">dashboard_customize</span>
             {t('admin_cms_title')}
          </h2>
          <p className="text-on-surface-variant font-medium text-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-xl bg-primary/40"></span>
            {t('admin_cms_desc')}
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-3 px-8 py-3 bg-primary text-on-primary-container rounded-2xl text-[11px] font-black uppercase ] shadow-[0_0_25px_rgba(145,247,142,0.15)] hover:shadow-[0_0_35px_rgba(145,247,142,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-sm">edit</span> {t('admin_edit_content')}
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-8 py-3 bg-surface-container text-on-surface rounded-2xl text-[11px] font-black uppercase ] border border-white/10 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-secondary text-on-primary-container rounded-2xl text-[11px] font-black uppercase ] shadow-[0_0_25px_rgba(145,247,142,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Save Protocol
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* ─── Editor Column ─── */}
        <div className={`glass-panel p-8 rounded-[3rem] border-white/5 space-y-12 bg-surface-container-low transition-all duration-700 ${!isEditing ? 'opacity-50 grayscale pointer-events-none' : 'opacity-100 grayscale-0'}`}>

          {/* Section 01: Brand Identity */}
          <section className="space-y-8">
             <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">01</span>
                <h3 className="text-xs font-black uppercase ] text-on-surface-variant/80">Brand Identity</h3>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setFormData({...formData, logoType: 'text'})}
                 className={`flex items-center justify-center gap-3 py-4 rounded-2xl border transition-all ${formData.logoType === 'text' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-transparent text-on-surface-variant opacity-40 hover:opacity-60'}`}>
                 <span className="material-symbols-outlined text-sm">title</span>
                 <span className="text-[10px] font-black uppercase ">Text Logo</span>
               </button>
               <button onClick={() => setFormData({...formData, logoType: 'image'})}
                 className={`flex items-center justify-center gap-3 py-4 rounded-2xl border transition-all ${formData.logoType === 'image' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-transparent text-on-surface-variant opacity-40 hover:opacity-60'}`}>
                 <span className="material-symbols-outlined text-sm">image</span>
                 <span className="text-[10px] font-black uppercase ">Image Logo</span>
               </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-surface-container rounded-[2rem] border border-white/5">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  opacity-40">Global Brand Name (EN)</label>
                   <input type="text" value={formData.brandName_en}
                      onChange={(e) => setFormData({...formData, brandName_en: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                   />
                </div>
                <div className="space-y-4 text-right">
                   <label className="text-[10px] font-black uppercase  opacity-40">اسم المتجر الرسمي (عربي)</label>
                   <input type="text" dir="rtl" value={formData.brandName_ar}
                      onChange={(e) => setFormData({...formData, brandName_ar: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none text-right focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                   />
                </div>
             </div>
             <ImageUploader field="logoUrl" label="High-Res Website Logo" />
          </section>

          {/* Section 02: Hero */}
          <section className="space-y-8 pt-8 border-t border-white/5">
             <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">02</span>
                <h3 className="text-xs font-black uppercase ] text-on-surface-variant/80">Homepage Hero</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  opacity-40">Hero Badge (EN)</label>
                   <input type="text" value={formData.heroBadge_en}
                      onChange={(e) => setFormData({...formData, heroBadge_en: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none focus:ring-1 focus:ring-primary/40"
                   />
                </div>
                <div className="space-y-4 text-right">
                   <label className="text-[10px] font-black uppercase  opacity-40">وسام الهيرو (عربي)</label>
                   <input type="text" dir="rtl" value={formData.heroBadge_ar}
                      onChange={(e) => setFormData({...formData, heroBadge_ar: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none text-right focus:ring-1 focus:ring-primary/40"
                   />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  opacity-40">Hero Title (EN)</label>
                   <textarea rows={3} value={formData.heroTitle_en}
                      onChange={(e) => setFormData({...formData, heroTitle_en: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                   />
                </div>
                <div className="space-y-4 text-right">
                   <label className="text-[10px] font-black uppercase  opacity-40">عنوان الهيرو (عربي)</label>
                   <textarea rows={3} dir="rtl" value={formData.heroTitle_ar}
                      onChange={(e) => setFormData({...formData, heroTitle_ar: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none text-right focus:ring-1 focus:ring-primary/40 resize-none"
                   />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  opacity-40">Hero Description (EN)</label>
                   <textarea rows={2} value={formData.heroDesc_en}
                      onChange={(e) => setFormData({...formData, heroDesc_en: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-1 focus:ring-primary/40 resize-none opacity-80"
                   />
                </div>
                <div className="space-y-4 text-right">
                   <label className="text-[10px] font-black uppercase  opacity-40">وصف الهيرو (عربي)</label>
                   <textarea rows={2} dir="rtl" value={formData.heroDesc_ar}
                      onChange={(e) => setFormData({...formData, heroDesc_ar: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none text-right focus:ring-1 focus:ring-primary/40 resize-none opacity-80"
                   />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  opacity-40">Shop Button Label (EN)</label>
                   <input type="text" value={formData.heroCTA1_en}
                      onChange={(e) => setFormData({...formData, heroCTA1_en: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none text-primary"
                   />
                </div>
                <div className="space-y-4 text-right">
                   <label className="text-[10px] font-black uppercase  opacity-40">نص زر التسوق (عربي)</label>
                   <input type="text" dir="rtl" value={formData.heroCTA1_ar}
                      onChange={(e) => setFormData({...formData, heroCTA1_ar: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none text-right text-primary"
                   />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  opacity-40">Checkout Button Label (EN)</label>
                   <input type="text" value={formData.heroCTA2_en}
                      onChange={(e) => setFormData({...formData, heroCTA2_en: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none opacity-60"
                   />
                </div>
                <div className="space-y-4 text-right">
                   <label className="text-[10px] font-black uppercase  opacity-40">نص زر الاتمام (عربي)</label>
                   <input type="text" dir="rtl" value={formData.heroCTA2_ar}
                      onChange={(e) => setFormData({...formData, heroCTA2_ar: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none text-right opacity-60"
                   />
                </div>
             </div>
             <ImageUploader field="heroImg" label="Hero Immersion Background" />
          </section>

          {/* Section 03: The Verdict */}
          <section className="space-y-8 pt-8 border-t border-white/5">
             <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">03</span>
                <h3 className="text-xs font-black uppercase ] text-on-surface-variant/80">The Verdict (Reviews)</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  opacity-40">Verdict Title (EN)</label>
                   <input type="text" value={formData.verdictTitle_en}
                      onChange={(e) => setFormData({...formData, verdictTitle_en: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none"
                   />
                </div>
                <div className="space-y-4 text-right">
                   <label className="text-[10px] font-black uppercase  opacity-40">عنوان الحكم (عربي)</label>
                   <input type="text" dir="rtl" value={formData.verdictTitle_ar}
                      onChange={(e) => setFormData({...formData, verdictTitle_ar: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none text-right"
                   />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  opacity-40">Verdict Subtitle (EN)</label>
                   <input type="text" value={formData.verdictSubtitle_en}
                      onChange={(e) => setFormData({...formData, verdictSubtitle_en: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none"
                   />
                </div>
                <div className="space-y-4 text-right">
                   <label className="text-[10px] font-black uppercase  opacity-40">العنوان الفرعي للمراجعات (عربي)</label>
                   <input type="text" dir="rtl" value={formData.verdictSubtitle_ar}
                      onChange={(e) => setFormData({...formData, verdictSubtitle_ar: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none text-right"
                   />
                </div>
             </div>
          </section>

          {/* Section 04: Featured Products */}
          <section className="space-y-8 pt-8 border-t border-white/5">
             <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">04</span>
                <h3 className="text-xs font-black uppercase ] text-on-surface-variant/80">Featured Products Section</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  opacity-40">Section Badge (EN)</label>
                   <input type="text" value={formData.featuredBadge_en}
                      onChange={(e) => setFormData({...formData, featuredBadge_en: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none focus:ring-1 focus:ring-primary/40"
                   />
                </div>
                <div className="space-y-4 text-right">
                   <label className="text-[10px] font-black uppercase  opacity-40">وسام القسم (عربي)</label>
                   <input type="text" dir="rtl" value={formData.featuredBadge_ar}
                      onChange={(e) => setFormData({...formData, featuredBadge_ar: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none text-right focus:ring-1 focus:ring-primary/40"
                   />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  opacity-40">Section Title (EN)</label>
                   <input type="text" value={formData.featuredTitle_en}
                      onChange={(e) => setFormData({...formData, featuredTitle_en: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none focus:ring-1 focus:ring-primary/40"
                   />
                </div>
                <div className="space-y-4 text-right">
                   <label className="text-[10px] font-black uppercase  opacity-40">عنوان القسم (عربي)</label>
                   <input type="text" dir="rtl" value={formData.featuredTitle_ar}
                      onChange={(e) => setFormData({...formData, featuredTitle_ar: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none text-right focus:ring-1 focus:ring-primary/40"
                   />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  opacity-40">Section Description (EN)</label>
                   <textarea rows={3} value={formData.featuredDesc_en}
                      onChange={(e) => setFormData({...formData, featuredDesc_en: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                   />
                </div>
                <div className="space-y-4 text-right">
                   <label className="text-[10px] font-black uppercase  opacity-40">وصف القسم (عربي)</label>
                   <textarea rows={3} dir="rtl" value={formData.featuredDesc_ar}
                      onChange={(e) => setFormData({...formData, featuredDesc_ar: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none text-right focus:ring-1 focus:ring-primary/40 resize-none"
                   />
                </div>
             </div>
             <div className="pt-8 space-y-6">
                <div className="flex items-center gap-3">
                   <span className="material-symbols-outlined text-secondary text-sm">inventory_2</span>
                   <h4 className="text-[10px] font-black uppercase  text-on-surface-variant">Manual Product Selection (Pick 3)</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                   {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-4 bg-background/50 p-4 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all">
                         <span className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black opacity-40 group-hover:bg-primary/10 group-hover:opacity-100 transition-all font-mono">0{i+1}</span>
                         <select 
                            value={formData.featuredProductIds?.[i] || ''}
                            onChange={(e) => handleProductSelect(i, e.target.value)}
                            className="flex-1 bg-transparent text-sm font-bold outline-none cursor-pointer appearance-none"
                         >
                            <option value="" className="bg-surface-container">-- Select Featured Product --</option>
                            {availableProducts.map(p => (
                               <option key={p.id} value={p.id} className="bg-surface-container">
                                  {lang === 'ar' ? p.name_ar : p.name} ({p.price}$)
                               </option>
                            ))}
                         </select>
                         <span className="material-symbols-outlined text-xs opacity-30">expand_more</span>
                      </div>
                   ))}
                </div>
                <p className="text-[9px] font-bold text-on-surface-variant/40">* Note: If left empty, the system will automatically display the latest 3 active products.</p>
             </div>
          </section>

          {/* Section 05: Newsletter */}
          <section className="space-y-8 pt-8 border-t border-white/5">
             <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">05</span>
                <h3 className="text-xs font-black uppercase ] text-on-surface-variant/80">Newsletter Formulation</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  opacity-40">Newsletter Title (EN)</label>
                   <input type="text" value={formData.newsletterTitle_en}
                      onChange={(e) => setFormData({...formData, newsletterTitle_en: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none"
                   />
                </div>
                <div className="space-y-4 text-right">
                   <label className="text-[10px] font-black uppercase  opacity-40">عنوان النشرة (عربي)</label>
                   <input type="text" dir="rtl" value={formData.newsletterTitle_ar}
                      onChange={(e) => setFormData({...formData, newsletterTitle_ar: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none text-right"
                   />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  opacity-40">Description (EN)</label>
                   <textarea rows={2} value={formData.newsletterDesc_en}
                      onChange={(e) => setFormData({...formData, newsletterDesc_en: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none resize-none"
                   />
                </div>
                <div className="space-y-4 text-right">
                   <label className="text-[10px] font-black uppercase  opacity-40">الوصف (عربي)</label>
                   <textarea rows={2} dir="rtl" value={formData.newsletterDesc_ar}
                      onChange={(e) => setFormData({...formData, newsletterDesc_ar: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none text-right resize-none"
                   />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  opacity-40">Button CTA (EN)</label>
                   <input type="text" value={formData.newsletterCTA_en}
                      onChange={(e) => setFormData({...formData, newsletterCTA_en: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none text-secondary"
                   />
                </div>
                <div className="space-y-4 text-right">
                   <label className="text-[10px] font-black uppercase  opacity-40">نص الزر (عربي)</label>
                   <input type="text" dir="rtl" value={formData.newsletterCTA_ar}
                      onChange={(e) => setFormData({...formData, newsletterCTA_ar: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none text-right text-secondary"
                   />
                </div>
             </div>
          </section>

          {/* Section 06: Footer Details */}
          <section className="space-y-8 pt-8 border-t border-white/5 pb-10">
             <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">06</span>
                <h3 className="text-xs font-black uppercase ] text-on-surface-variant/80">Site Footer Information</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  opacity-40">Footer Desc (EN)</label>
                   <textarea rows={3} value={formData.footerDesc_en}
                      onChange={(e) => setFormData({...formData, footerDesc_en: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none resize-none"
                   />
                </div>
                <div className="space-y-4 text-right">
                   <label className="text-[10px] font-black uppercase  opacity-40">وصف التذييل (عربي)</label>
                   <textarea rows={3} dir="rtl" value={formData.footerDesc_ar}
                      onChange={(e) => setFormData({...formData, footerDesc_ar: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none text-right resize-none"
                   />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  opacity-40">Copyright Text (EN)</label>
                   <input type="text" value={formData.footerCopyright_en}
                      onChange={(e) => setFormData({...formData, footerCopyright_en: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-[10px] uppercase font-bold outline-none opacity-60"
                   />
                </div>
                <div className="space-y-4 text-right">
                   <label className="text-[10px] font-black uppercase  opacity-40">نص الحقوق (عربي)</label>
                   <input type="text" dir="rtl" value={formData.footerCopyright_ar}
                      onChange={(e) => setFormData({...formData, footerCopyright_ar: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-[10px] font-bold outline-none text-right opacity-60"
                   />
                </div>
             </div>
          </section>

          {/* Section 07: Loyalty Tiers */}
          <section className="space-y-8 pt-8 border-t border-white/5 pb-10">
             <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary font-black text-xs">07</span>
                <h3 className="text-xs font-black uppercase ] text-on-surface-variant/80">Loyalty Tier Thresholds</h3>
             </div>
             <p className="text-[10px] text-on-surface-variant leading-relaxed opacity-60">
               {lang === 'ar' ? 'حدد الحد الأدنى للإنفاق المطلوب لكل فئة من فئات العملاء. سيتم تصنيف العملاء تلقائياً بناءً على إنفاقهم الإجمالي.' : 'Define the minimum spending required for each customer tier. Customers will be automatically categorized based on their lifetime value.'}
             </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  text-primary">{lang === 'ar' ? 'الحد الأدنى للفئة البلاتينية ($)' : 'Platinum Tier Min Spend ($)'}</label>
                   <input 
                      type="number" 
                      value={formData.tierPlatinumThreshold}
                      onChange={(e) => setFormData({...formData, tierPlatinumThreshold: Number(e.target.value)})}
                      className="w-full bg-background border border-primary/20 rounded-xl px-5 py-4 text-sm font-bold outline-none focus:ring-1 focus:ring-primary shadow-[0_0_15px_rgba(145,247,142,0.05)]"
                   />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase  text-secondary">{lang === 'ar' ? 'الحد الأدنى للفئة الذهبية ($)' : 'Gold Tier Min Spend ($)'}</label>
                   <input 
                      type="number" 
                      value={formData.tierGoldThreshold}
                      onChange={(e) => setFormData({...formData, tierGoldThreshold: Number(e.target.value)})}
                      className="w-full bg-background border border-secondary/20 rounded-xl px-5 py-4 text-sm font-bold outline-none focus:ring-1 focus:ring-secondary shadow-[0_0_15px_rgba(145,247,142,0.05)]"
                   />
                </div>
             </div>
          </section>
          
          {/* Section 08: Shipping */}
          <section className="space-y-8 pt-8 border-t border-white/5 pb-12">
             <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">08</span>
                <h3 className="text-xs font-black uppercase ] text-on-surface-variant/80">Shipping & Delivery</h3>
             </div>
             <p className="text-[10px] text-on-surface-variant leading-relaxed opacity-60">
               {lang === 'ar' ? 'حدد قيمة رسوم الشحن الثابتة لجميع الطلبات.' : 'Define the flat shipping fee applied to all domestic orders.'}
             </p>
             <div className="max-w-md space-y-4">
                <label className="text-[10px] font-black uppercase  text-primary">{lang === 'ar' ? 'رسوم الشحن العالمية ($)' : 'Global Shipping Fee ($)'}</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary text-xl">local_shipping</span>
                  <input 
                    type="number" 
                    value={formData.shippingFee}
                    onChange={(e) => setFormData({...formData, shippingFee: Number(e.target.value)})}
                    className="w-full bg-background border border-primary/20 rounded-2xl pl-12 pr-6 py-5 text-lg font-black outline-none focus:ring-2 focus:ring-primary shadow-[0_0_25px_rgba(145,247,142,0.1)] transition-all"
                  />
                </div>
             </div>
          </section>

        </div>

        {/* ─── Live Preview Column ─── */}
        <div className="space-y-8 sticky top-28 h-fit">
           <div className="flex justify-between items-center px-4">
             <div className="flex items-center gap-2">
               <span className="flex h-2 w-2 rounded-xl bg-secondary"></span>
               <h3 className="text-[10px] font-black uppercase ] text-on-surface-variant/60">Live Environment Preview</h3>
             </div>
             <div className="flex items-center gap-4">
               <span className="text-[8px] font-black text-primary uppercase  bg-primary/10 px-2 py-0.5 rounded-xl">Synchronized</span>
             </div>
           </div>

           {/* Preview 1: Header/Logo */}
           <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-surface-container flex items-center justify-between shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center gap-4 relative z-10">
                 {formData.logoType === 'image' && formData.logoUrl ? (
                   <img src={getImageUrl(formData.logoUrl)} className="h-8 md:h-10 w-auto object-contain drop-shadow-lg" alt="Logo Preview"
                     onError={(e) => { (e.target as HTMLImageElement).style.border = "1px solid red"; }}
                   />
                 ) : (
                   <span className="text-2xl font-black text-primary font-headline uppercase  leading-none">
                     {lang === 'ar' ? formData.brandName_ar : formData.brandName_en}
                   </span>
                 )}
                 <div className="hidden md:flex items-center gap-6 ml-8">
                   <div className="w-12 h-1 bg-white/5 rounded-xl"></div>
                   <div className="w-16 h-1 bg-white/5 rounded-xl"></div>
                   <div className="w-20 h-1 bg-white/5 rounded-xl"></div>
                 </div>
              </div>
              <div className="flex gap-4 relative z-10">
                 <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xs opacity-40">person</span>
                 </div>
                 <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xs opacity-40">shopping_cart</span>
                 </div>
              </div>
           </div>

           {/* Preview 2: Hero */}
           <div className="p-1 relative min-h-[500px] rounded-[3rem] overflow-hidden group shadow-2xl">
              <div className="absolute inset-0 bg-[#060a07]"></div>
              {formData.heroImg && (
                <img src={getImageUrl(formData.heroImg)} alt="Hero Preview"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  style={{ opacity: 0.7 }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800"; }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#060a07] via-[#060a07]/20 to-transparent"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 space-y-6 z-10">
                 <div className="px-5 py-2 rounded-xl bg-black/50 backdrop-blur-xl border border-primary/30 text-primary text-[10px] font-black uppercase ] shadow-[0_0_20px_rgba(145,247,142,0.2)]">
                    {lang === 'ar' ? formData.heroBadge_ar : formData.heroBadge_en}
                 </div>
                 <h1 className="text-4xl font-black font-headline  uppercase leading-[1.1] text-white whitespace-pre-line text-center">
                    {lang === 'ar' ? formData.heroTitle_ar : formData.heroTitle_en}
                 </h1>
                 <p className="text-[9px] text-white/50 max-w-xs leading-relaxed text-center opacity-80">
                    {lang === 'ar' ? formData.heroDesc_ar : formData.heroDesc_en}
                 </p>
                 <div className="flex gap-4 pt-4">
                    <button className="px-8 py-3 bg-primary text-black rounded-xl text-[9px] font-black uppercase ] shadow-[0_0_20px_rgba(145,247,142,0.3)] hover:scale-105 transition-all">
                       {lang === 'ar' ? formData.heroCTA1_ar : formData.heroCTA1_en}
                    </button>
                    <button className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase ] hover:bg-white/10 transition-all">
                       {lang === 'ar' ? formData.heroCTA2_ar : formData.heroCTA2_en}
                    </button>
                 </div>
              </div>
           </div>

           {/* Preview 3: Featured Products */}
           <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-white/10 shadow-xl">
              <div className="mb-6">
                 <span className="text-secondary font-black text-[10px] uppercase ]">
                    {lang === 'ar' ? formData.featuredBadge_ar : formData.featuredBadge_en}
                 </span>
                 <div className="flex justify-between items-end mt-1">
                    <h2 className="text-2xl font-black font-headline uppercase ">
                       {lang === 'ar' ? formData.featuredTitle_ar : formData.featuredTitle_en}
                    </h2>
                 </div>
                 <p className="text-on-surface-variant text-[10px] mt-2 leading-relaxed opacity-60 max-w-xs">
                    {lang === 'ar' ? formData.featuredDesc_ar : formData.featuredDesc_en}
                 </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                 {[0,1,2].map(i => {
                    const selectedId = formData.featuredProductIds?.[i];
                    const product = availableProducts.find(p => String(p.id) === String(selectedId));
                    return (
                       <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 border border-white/5 flex items-end p-3 overflow-hidden relative group">
                          {product?.img ? (
                             <img src={getImageUrl(product.img)} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-500" alt="" />
                          ) : (
                             <div className="absolute inset-0 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white/5 text-4xl">inventory_2</span>
                             </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>
                          <div className="relative z-10 w-full">
                             <div className="h-1.5 w-10 bg-primary/40 rounded mb-1.5"/>
                             <p className="text-[7px] font-black uppercase  text-white truncate w-full">
                                {product ? (lang === 'ar' ? product.name_ar : product.name) : `Select Product 0${i+1}`}
                             </p>
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>

           {/* Preview 4: The Verdict */}
           <div className="bg-surface-container-low p-10 rounded-[3rem] border border-white/10 text-center space-y-3 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
              <h2 className="text-3xl font-black font-headline uppercase text-on-surface ">
                 {lang === 'ar' ? formData.verdictTitle_ar : formData.verdictTitle_en}
              </h2>
              <p className="text-on-surface-variant font-black uppercase ] text-[8px] opacity-60">
                 {lang === 'ar' ? formData.verdictSubtitle_ar : formData.verdictSubtitle_en}
              </p>
           </div>

           {/* Preview 5: Newsletter */}
           <div className="bg-surface-container rounded-[2.5rem] p-8 border border-secondary/20 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-xl blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10 space-y-4 text-left">
                 <h2 className="text-xl font-black font-headline uppercase  max-w-[150px] leading-none text-white text-left">
                    {lang === 'ar' ? formData.newsletterTitle_ar : formData.newsletterTitle_en}
                 </h2>
                 <p className="text-[9px] text-on-surface-variant leading-relaxed opacity-60 max-w-[180px] text-left">
                    {lang === 'ar' ? formData.newsletterDesc_ar : formData.newsletterDesc_en}
                 </p>
                 <div className="flex gap-2">
                    <div className="flex-1 h-10 bg-black/20 rounded-lg border border-white/5"></div>
                    <button className="px-4 bg-secondary text-black rounded-lg text-[8px] font-black uppercase  whitespace-nowrap">
                       {lang === 'ar' ? formData.newsletterCTA_ar : formData.newsletterCTA_en}
                    </button>
                 </div>
              </div>
           </div>

           {/* Preview 6: Footer */}
           <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center space-y-6 opacity-60">
              <div className="flex flex-col items-center">
                 <div className="h-6 w-24 bg-primary/20 rounded-md mb-4 flex items-center justify-center">
                    <span className="text-[10px] font-black uppercase text-primary ">BRAND</span>
                  </div>
                  <p className="text-[8px] max-w-[200px] text-on-surface-variant leading-loose uppercase  font-bold">
                     {lang === 'ar' ? formData.footerDesc_ar : formData.footerDesc_en}
                  </p>
               </div>
               <div className="w-full h-px bg-white/5"></div>
               <p className="text-[7px] font-black uppercase ] opacity-40">
                  {lang === 'ar' ? formData.footerCopyright_ar : formData.footerCopyright_en}
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
