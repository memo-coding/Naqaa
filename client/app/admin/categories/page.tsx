'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/components/LanguageProvider';
import { fetchApi } from '@/lib/api';

interface Category {
  _id: string;
  name: string;
  name_ar: string;
  slug?: string;
  order: number;
  category_id?: number;
}

import { useForm, validators } from '@/lib/hooks/useForm';
import { FormField } from '@/components/FormField';
import { ErrorMessage } from '@/components/ErrorMessage';

export default function CategoryManagement() {
  const { t, dir, lang } = useLang();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    values: formData, 
    errors: validationErrors, 
    handleChange, 
    validate, 
    setValues, 
    setIsSubmitting: setIsSaving,
    isSubmitting: isSaving 
  } = useForm(
    {
      name: '',
      name_ar: '',
      slug: '',
      order: 0
    },
    {
      name: [validators.required(t('validation_required') || 'Name is required')],
      name_ar: [validators.required(t('validation_required') || 'Arabic name is required')]
    }
  );

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/categories');
      if (data) setCategories(data);
    } catch (err: any) {
      console.error('Error loading categories:', err);
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat._id);
    setValues({
      name: cat.name,
      name_ar: cat.name_ar,
      slug: cat.slug || '',
      order: cat.order
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin_delete_confirm') || 'Are you sure?')) return;
    try {
      await fetchApi(`/categories/${id}`, { method: 'DELETE' });
      setCategories(categories.filter(c => c._id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setError(null);
    setIsSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const endpoint = editingId ? `/categories/${editingId}` : '/categories';
      
      const saved = await fetchApi(endpoint, {
        method,
        body: JSON.stringify(formData)
      });

      if (saved) {
        if (editingId) {
          setCategories(categories.map(c => c._id === editingId ? saved : c));
        } else {
          setCategories([...categories, saved]);
        }
        setIsModalOpen(false);
        setEditingId(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-700" dir={dir}>
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} className="bg-[#ff6347]/10 py-4 rounded-2xl justify-center border border-[#ff6347]/20" />
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-black uppercase  text-on-surface flex items-center gap-3">
             <span className="material-symbols-outlined text-primary text-4xl">category</span>
             {lang === 'ar' ? 'أقسام المنتجات' : 'Product Categories'}
          </h2>
          <p className="text-on-surface-variant/60 text-xs font-bold uppercase  mt-1">
            {lang === 'ar' ? 'إدارة وتصنيف المنتجات في المتجر' : 'Managing product groupings and classifications'}
          </p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setValues({name:'', name_ar:'', slug:'', order:0}); setIsModalOpen(true); }}
          className="bg-primary hover:bg-primary-container text-on-primary-container px-6 py-3 rounded-2xl font-headline font-black text-xs uppercase  flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          {t('admin_add_new_product') || 'Add Category'}
        </button>
      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4 opacity-50">
            <span className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-xl animate-spin"></span>
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem] opacity-40">
            <span className="material-symbols-outlined text-6xl mb-4">inventory_2</span>
            <p className="font-headline font-black uppercase  text-sm">{t('admin_no_products_found') || 'No categories found'}</p>
          </div>
        ) : (
          categories.map(cat => (
            <div key={cat._id} className="group bg-surface-container/40 hover:bg-surface-container border border-white/5 hover:border-primary/20 p-6 rounded-[2rem] transition-all duration-500 relative overflow-hidden backdrop-blur-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">category</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(cat)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-primary/20 text-on-surface-variant hover:text-primary transition-all flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button onClick={() => handleDelete(cat._id)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-error/20 text-on-surface-variant hover:text-error transition-all flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-black uppercase  mb-1">{cat.name}</h3>
              <p className="text-primary font-bold text-sm mb-4 font-['Cairo']">{cat.name_ar}</p>
              
              <div className="flex items-center justify-between text-[10px] font-black uppercase  opacity-40">
                <span>Slug: {cat.slug || '—'}</span>
                <span>ID: {cat.category_id || '—'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form noValidate onSubmit={handleSave} className="bg-surface-container border border-primary/20 p-8 rounded-[2rem] shadow-2xl max-w-lg w-full z-[101] animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-headline font-black uppercase  mb-6 border-b border-white/5 pb-4">
              {editingId ? (lang === 'ar' ? 'تعديل قسم' : 'Edit Category') : (lang === 'ar' ? 'قسم جديد' : 'New Category')}
            </h3>
            
            <ErrorMessage message={error || undefined} className="mb-6 bg-[#ff6347]/5 py-3 rounded-xl justify-center border border-[#ff6347]/20" />
            
            <div className="space-y-4">
              <FormField
                label={t('admin_name_en')}
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                error={validationErrors.name}
                isRequired
              />
              <FormField
                label={t('admin_name_ar')}
                value={formData.name_ar}
                onChange={e => handleChange('name_ar', e.target.value)}
                error={validationErrors.name_ar}
                isRequired
              />
              <FormField
                label="Slug / Key"
                value={formData.slug}
                onChange={e => handleChange('slug', e.target.value)}
                placeholder="exotics"
              />
              <FormField
                label="Display Order"
                type="number"
                value={formData.order}
                onChange={e => handleChange('order', parseInt(e.target.value))}
              />
            </div>

            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border border-white/10 rounded-xl font-black text-[10px] uppercase hover:bg-white/5 transition-all">
                {t('admin_cancel')}
              </button>
              <button type="submit" disabled={isSaving} className="flex-1 px-6 py-3 bg-primary text-on-primary font-black text-[10px] uppercase rounded-xl hover:bg-primary-container transition-all">
                {isSaving ? t('admin_uploading') : t('common_save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
