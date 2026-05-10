'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '@/components/LanguageProvider';
import { ErrorMessage } from '@/components/ErrorMessage';
import { FormField } from '@/components/FormField';
import { useForm, validators } from '@/lib/hooks/useForm';
import { fetchApi, uploadFile, getImageUrl } from '@/lib/api';

export type DBProduct = any;

interface Category {
  _id: string;
  name: string;
  name_ar: string;
  category_id?: number;
}

export default function ProductManagement() {
  const { t, dir, lang } = useLang();
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // Unified Form System
  const { 
    values: formData, 
    errors: validationErrors, 
    handleChange, 
    validate, 
    setValues, 
    setErrors,
    isSubmitting: isSaving,
    setIsSubmitting: setIsSaving 
  } = useForm(
    {
      name: '', name_ar: '', description: '', description_ar: '',
      price: 0, stock: 0, img: '', is_active: true, storage_zone: '',
      category_id: 1,
      scientific_name_en: 'SCIENTIFIC', scientific_name_ar: 'علمي',
      scientific_desc_en: 'CLINICALLY TESTED', scientific_desc_ar: 'مختبر سريرياً',
      organic_name_en: 'ORGANIC', organic_name_ar: 'عضوي',
      organic_desc_en: 'SUSTAINABLY SOURCED', organic_desc_ar: 'مستدام المصدر',
      key_ingredients_en: '', key_ingredients_ar: ''
    },
    {
      name: [validators.required(t('validation_required') || 'Name EN is required')],
      name_ar: [validators.required(t('validation_required') || 'Name AR is required')],
      price: [validators.positiveNumber(t('error_price_invalid') || 'Price must be positive')]
    }
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = useCallback(async (file: File) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      setError(`Unsupported format: ${file.type}`);
      return;
    }
    setIsUploading(true);
    setError('');
    try {
      const { url } = await uploadFile(file);
      setValues(prev => ({ ...prev, img: url }));
    } catch (err: any) {
      setError(err.message || 'Image upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [setValues]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  }, [handleImageFile]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        fetchApi('/products?admin=true'),
        fetchApi('/categories')
      ]);
      if (productsData) setProducts(productsData);
      if (categoriesData) setCategories(categoriesData);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to load products/categories');
    }
    setLoading(false);
  };

  useEffect(() => { loadInitialData(); }, []);

  const handleEdit = (prod: DBProduct) => {
    setEditingId(prod.id);
    setValues({
      name: prod.name, name_ar: prod.name_ar, description: prod.description || '', description_ar: prod.description_ar || '',
      price: prod.price, stock: prod.stock, img: prod.img || '', is_active: prod.is_active, storage_zone: prod.storage_zone || '',
      category_id: prod.category_id || 1,
      scientific_name_en: prod.scientific_name_en || 'SCIENTIFIC',
      scientific_name_ar: prod.scientific_name_ar || 'علمي',
      scientific_desc_en: prod.scientific_desc_en || 'CLINICALLY TESTED',
      scientific_desc_ar: prod.scientific_desc_ar || 'مختبر سريرياً',
      organic_name_en: prod.organic_name_en || 'ORGANIC',
      organic_name_ar: prod.organic_name_ar || 'عضوي',
      organic_desc_en: prod.organic_desc_en || 'SUSTAINABLY SOURCED',
      organic_desc_ar: prod.organic_desc_ar || 'مستدام المصدر',
      key_ingredients_en: prod.key_ingredients_en || '',
      key_ingredients_ar: prod.key_ingredients_ar || ''
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setValues({ 
      name: '', name_ar: '', description: '', description_ar: '', price: 0, stock: 0, img: '', is_active: true, storage_zone: '',
      category_id: 1,
      scientific_name_en: 'SCIENTIFIC', scientific_name_ar: 'علمي',
      scientific_desc_en: 'CLINICALLY TESTED', scientific_desc_ar: 'مختبر سريرياً',
      organic_name_en: 'ORGANIC', organic_name_ar: 'عضوي',
      organic_desc_en: 'SUSTAINABLY SOURCED', organic_desc_ar: 'مستدام المصدر',
      key_ingredients_en: '', key_ingredients_ar: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      if (editingId) {
         await fetchApi(`/products/${editingId}`, { method: 'PUT', body: JSON.stringify(formData) });
      } else {
         await fetchApi('/products', { method: 'POST', body: JSON.stringify(formData) });
      }
      setIsModalOpen(false);
      loadInitialData();
    } catch (e: any) {
      setError(e.message || 'Error saving product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetchApi(`/products/${id}`, { method: 'PUT', body: JSON.stringify({ is_active: !currentStatus }) });
      loadInitialData();
    } catch (e) {
      alert(t('error_updating_status') || 'Error updating status');
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('admin_delete_confirm'))) {
      try {
        await fetchApi(`/products/${id}`, { method: 'DELETE' });
        loadInitialData();
      } catch (e) {
        alert(t('error_deleting_product'));
        console.error(e);
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const idStr = p.id ? p.id.toString().toLowerCase() : '';
    const nameStr = (p.name || '').toLowerCase();
    const nameArStr = (p.name_ar || '').toLowerCase();
    
    const matchesSearch = !q || nameStr.includes(q) || nameArStr.includes(q) || idStr.includes(q);
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? p.is_active : !p.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full" dir={dir}>
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} className="bg-[#ff6347]/10 py-4 rounded-2xl justify-center border border-[#ff6347]/20" />
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
          <h2 className="text-4xl font-black font-headline  text-on-surface uppercase mb-1">{t('admin_product_catalog')}</h2>
        </div>
        <button onClick={handleCreate} className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary-container rounded-lg text-xs font-black uppercase  shadow-[0_0_20px_rgba(145,247,142,0.2)]">
          <span className="material-symbols-outlined text-sm">add</span> {t('admin_add_new_product')}
        </button>
      </div>

      <div className="bg-surface-container-low p-6 rounded-3xl border border-white/5 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center group mt-8">
         <div className="w-full md:w-96 relative">
            <span className={`absolute top-1/2 -translate-y-1/2 ${dir === 'rtl' ? 'right-4' : 'left-4'} material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors`}>search</span>
            <input 
              type="text" 
              placeholder={t('admin_search_product_placeholder')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-surface-container border border-white/10 rounded-xl py-3 ${dir === 'rtl' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} text-sm font-bold text-on-surface outline-none focus:border-primary/50 transition-all`}
            />
         </div>
         
         <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className={`flex bg-surface-container border border-white/10 rounded-xl p-1 shrink-0 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
               {['all', 'active', 'inactive'].map((status) => (
                  <button 
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 text-[10px] font-black uppercase  rounded-lg transition-all ${statusFilter === status ? 'bg-primary text-black shadow-[0_0_15px_rgba(145,247,142,0.3)]' : 'text-on-surface-variant hover:text-on-surface'}`}
                  >
                     {t(`admin_filter_${status}`)}
                  </button>
               ))}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
        {loading ? (
           <div className="col-span-full text-center py-10 opacity-50 font-bold uppercase ">{t('admin_loading_catalog')}</div>
        ) : paginatedProducts.length === 0 ? (
           <div className="col-span-full text-center py-20 opacity-50 bg-surface-container-low rounded-3xl border border-white/5">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">search_off</span>
              <p className="font-bold uppercase  text-sm">{t('admin_no_products_found')}</p>
           </div>
        ) : (
        paginatedProducts.map((prod) => (
          <div key={prod.id} className={`p-4 rounded-3xl bg-surface-container border border-white/5 relative group overflow-hidden shadow-2xl transition-all hover:border-primary/20 ${!prod.is_active ? 'opacity-60' : ''}`}>
             <div className="h-64 rounded-2xl overflow-hidden mb-6 relative grayscale group-hover:grayscale-0 transition-transform duration-700 hover:scale-105">
                <img className="w-full h-full object-cover" alt={lang === 'ar' ? (prod.name_ar || prod.name) : prod.name} src={getImageUrl(prod.img) || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800'} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0b]/90 via-transparent to-transparent"></div>
                <div className="absolute top-4 right-4 bg-[#0a0f0b]/60 backdrop-blur-md px-3 py-1 rounded-xl text-[8px] font-black uppercase  text-primary border border-primary/20">{lang === 'ar' ? (prod.categories?.name_ar || prod.categories?.name || t('admin_uncategorized')) : (prod.categories?.name || t('admin_uncategorized'))}</div>
             </div>
             <div className="flex justify-between items-start mb-2 px-2">
                <div>
                   <h4 className="font-headline font-black text-xl text-on-surface uppercase  leading-tight truncate max-w-[200px]">{lang === 'ar' ? (prod.name_ar || prod.name) : prod.name}</h4>
                   
                   {prod.storage_zone && (
                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 text-[8px] font-black uppercase  mb-2">
                       <span className="material-symbols-outlined text-[10px]">warehouse</span>
                       {prod.storage_zone}
                     </span>
                   )}
                </div>
                <p className="text-xl font-headline font-black text-secondary  drop-shadow-[0_0_10px_#2ff801]">${prod.price.toFixed(2)}</p>
             </div>
             <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5 px-2">
                <span className={`px-2 py-1 text-[8px] font-black uppercase  rounded ${
                  !prod.is_active ? 'bg-error/10 text-error border border-error/20' : 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(145,247,142,0.1)]'
                }`}>{prod.is_active ? t('admin_filter_active') : t('admin_filter_inactive')}</span>
                <div className="flex gap-2">
                   <button onClick={() => handleEdit(prod)} className="p-2 text-on-surface-variant hover:text-primary transition-colors hover:scale-110 active:scale-90"><span className="material-symbols-outlined text-xl">edit</span></button>
                   <button onClick={() => handleToggleActive(prod.id, prod.is_active)} className={`p-2 transition-colors hover:scale-110 active:scale-90 ${prod.is_active ? 'text-on-surface-variant hover:text-error' : 'text-error hover:text-primary'}`} title="Toggle Visibility"><span className="material-symbols-outlined text-xl">{prod.is_active ? 'visibility_off' : 'visibility'}</span></button>
                   <button onClick={() => handleDelete(prod.id)} className="p-2 text-on-surface-variant hover:text-error transition-colors hover:scale-110 active:scale-90" title="Delete Specimen"><span className="material-symbols-outlined text-xl">delete</span></button>
                </div>
             </div>
          </div>
        )))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-2xl border border-white/5 shadow-sm mt-8">
          <div className="text-xs text-on-surface-variant font-medium">
             {t('admin_showing')} {((currentPage - 1) * ITEMS_PER_PAGE) + 1} {t('admin_to')} {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} {t('admin_of')} {filteredProducts.length}
          </div>
          <div className={`flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
             <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors">
               <span className="material-symbols-outlined text-sm">{dir === 'rtl' ? 'chevron_right' : 'chevron_left'}</span>
              </button>
             <div className="flex gap-1.5 hidden md:flex">
                {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                   <button 
                     key={page} 
                     onClick={() => setCurrentPage(page)} 
                     className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === page ? 'bg-primary text-black shadow-[0_0_10px_rgba(145,247,142,0.3)]' : 'bg-surface-container hover:bg-white/5 text-on-surface-variant border border-white/5'}`}
                   >
                     {page}
                   </button>
                ))}
             </div>
             <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors">
               <span className="material-symbols-outlined text-sm">{dir === 'rtl' ? 'chevron_left' : 'chevron_right'}</span>
             </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm rtl:text-right ltr:text-left">
           <form noValidate onSubmit={handleSave} className="bg-surface-container border border-primary/20 p-8 rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-[101]">
              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                 <h3 className="text-xl font-headline font-black uppercase ">{editingId ? t('admin_edit_product') : t('admin_new_product_title')}</h3>
                 <button type="button" onClick={() => setIsModalOpen(false)} className={`text-on-surface-variant hover:text-error ${dir === 'rtl' ? 'order-first' : ''}`}><span className="material-symbols-outlined">close</span></button>
              </div>
              {error && (
                <div className="mb-6">
                  <ErrorMessage message={error} className="bg-[#ff6347]/5 py-3 rounded-xl justify-center border border-[#ff6347]/20" />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    label={t('admin_price')}
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={e => handleChange('price', parseFloat(e.target.value))}
                    error={validationErrors.price}
                    isRequired
                 />
                 <FormField
                    label={t('admin_stock_quantity')}
                    type="number"
                    value={formData.stock}
                    onChange={e => handleChange('stock', parseInt(e.target.value))}
                    isRequired
                 />
                 <div className="md:col-span-2">
                    <FormField
                      label={t('filter_nav')}
                      options={categories.map(cat => ({
                        value: cat.category_id || cat._id,
                        label: lang === 'ar' ? cat.name_ar : cat.name
                      }))}
                      value={formData.category_id}
                      onChange={e => handleChange('category_id', parseInt(e.target.value))}
                    />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase mb-2 opacity-50">{t('admin_product_image')}</label>
                    {/* Drag & Drop Zone */}
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 overflow-hidden ${
                        isDragging ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-white/20 hover:border-primary/50 hover:bg-white/5'
                      } ${formData.img ? 'h-48' : 'h-36 py-8'}`}
                    >
                      {formData.img ? (
                        <>
                          <img
                            src={getImageUrl(formData.img)}
                            alt="Preview"
                            className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-80"
                          />
                          <div className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-white text-3xl">swap_horiz</span>
                            <p className="text-white text-[10px] font-black uppercase ">{t('admin_replace_image')}</p>
                          </div>
                        </>
                      ) : isUploading ? (
                        <>
                          <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-xl animate-spin"></span>
                          <p className="text-[10px] font-black uppercase text-on-surface-variant">{t('admin_uploading')}</p>
                        </>
                      ) : (
                        <>
                          <span className={`material-symbols-outlined text-4xl transition-colors ${isDragging ? 'text-primary' : 'text-on-surface-variant'}`}>cloud_upload</span>
                          <div className="text-center">
                            <p className="text-sm font-black uppercase text-on-surface-variant">
                              {isDragging ? t('admin_drop_to_upload') : t('admin_drag_drop_click')}
                            </p>
                            <p className="text-[9px] text-on-surface-variant/50 mt-1 uppercase ">JPG · PNG · WEBP · GIF · AVIF · SVG</p>
                          </div>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
                    />
                    <div className="mt-3 flex items-center gap-2">
                       <FormField
                         label=""
                         placeholder={t('admin_image_url_placeholder')}
                         value={formData.img.startsWith('data:') ? '' : formData.img}
                         onChange={e => handleChange('img', e.target.value)}
                         className="!py-2 !text-xs"
                       />
                       {formData.img && (
                        <button
                          type="button"
                          onClick={() => handleChange('img', '')}
                          className="text-on-surface-variant hover:text-error transition-colors shrink-0"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      )}
                    </div>
                 </div>
                 <div className="md:col-span-2">
                    <FormField
                      label={t('admin_storage_zone')}
                      value={formData.storage_zone}
                      onChange={e => handleChange('storage_zone', e.target.value)}
                      placeholder="مثال: Zone A - Shelf 2 / المستودع الرئيسي"
                    />
                    <p className="text-[9px] text-on-surface-variant mt-1 opacity-50">المنطقة الفيزيائية التي يتخزن فيها هذا المنتج في المستودع</p>
                 </div>
                  <div className="md:col-span-2 border-t border-white/5 pt-6 mt-2">
                     <h4 className="text-[10px] font-black uppercase text-primary mb-4">Scientific & Organic Information</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label={t('admin_sci_label_en')} value={formData.scientific_name_en} onChange={e => handleChange('scientific_name_en', e.target.value)} className="!py-2 !text-xs" />
                        <FormField label={t('admin_sci_desc_en')} value={formData.scientific_desc_en} onChange={e => handleChange('scientific_desc_en', e.target.value)} className="!py-2 !text-xs" />
                        <FormField label={t('admin_org_label_en')} value={formData.organic_name_en} onChange={e => handleChange('organic_name_en', e.target.value)} className="!py-2 !text-xs" />
                        <FormField label={t('admin_org_desc_en')} value={formData.organic_desc_en} onChange={e => handleChange('organic_desc_en', e.target.value)} className="!py-2 !text-xs" />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <FormField label={t('admin_sci_label_ar')} value={formData.scientific_name_ar} onChange={e => handleChange('scientific_name_ar', e.target.value)} className="!py-2 !text-xs" />
                        <FormField label={t('admin_sci_desc_ar')} value={formData.scientific_desc_ar} onChange={e => handleChange('scientific_desc_ar', e.target.value)} className="!py-2 !text-xs" />
                        <FormField label={t('admin_org_label_ar')} value={formData.organic_name_ar} onChange={e => handleChange('organic_name_ar', e.target.value)} className="!py-2 !text-xs" />
                        <FormField label={t('admin_org_desc_ar')} value={formData.organic_desc_ar} onChange={e => handleChange('organic_desc_ar', e.target.value)} className="!py-2 !text-xs" />
                     </div>
                  </div>

                  <div className="md:col-span-2 border-t border-white/5 pt-6">
                     <h4 className="text-[10px] font-black uppercase text-primary mb-4">{t('admin_key_ingredients')}</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField isTextArea label={t('admin_ingredients_en')} value={formData.key_ingredients_en} onChange={e => handleChange('key_ingredients_en', e.target.value)} />
                        <FormField isTextArea label={t('admin_ingredients_ar')} value={formData.key_ingredients_ar} onChange={e => handleChange('key_ingredients_ar', e.target.value)} />
                     </div>
                  </div>

                  <div className="md:col-span-2">
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input type="checkbox" checked={formData.is_active} onChange={e => handleChange('is_active', e.target.checked)} className="rounded bg-white/5 text-primary border-white/10" />
                       <span className="text-sm font-bold uppercase text-primary">{t('admin_active_variant')}</span>
                     </label>
                  </div>
              </div>
              <div className="mt-8 flex justify-end gap-4 border-t border-white/5 pt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-xs font-bold uppercase hover:text-on-surface-variant transition-colors">{t('admin_cancel')}</button>
                 <button type="submit" disabled={isSaving} className="px-6 py-2 bg-primary text-on-primary-container rounded-lg text-xs font-black uppercase shadow-[0_0_20px_rgba(145,247,142,0.2)]">
                   {isSaving ? t('admin_uploading') : t('admin_save_specimen')}
                 </button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
}
