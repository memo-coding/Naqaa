'use client';
import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useLang } from '@/components/LanguageProvider';

type ShippingCompany = {
  _id: string;
  name: string;
  name_ar?: string;
  phone?: string;
  contact_email?: string;
  fees_per_order: number;
  fees_owed: number;    // Store owes this to company (card/wallet orders)
  cod_pending: number;  // Company collected this from customers, owes back to store (COD)
  balance: number;      // Legacy
  total_orders: number;
  notes?: string;
  is_active: boolean;
};

const emptyForm = {
  name: '',
  name_ar: '',
  phone: '',
  contact_email: '',
  fees_per_order: 0,
  notes: '',
  is_active: true,
};

export default function ShippingManagementPage() {
  const { dir } = useLang();
  const [companies, setCompanies] = useState<ShippingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm, fees_per_order: '' as string | number });
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [balanceModal, setBalanceModal] = useState<ShippingCompany | null>(null);
  const [settlementType, setSettlementType] = useState<'fees' | 'cod'>('fees');
  const [adjustmentStr, setAdjustmentStr] = useState('');
  const [adjNote, setAdjNote] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/shipping');
      if (data) setCompanies(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, fees_per_order: '' });
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (c: ShippingCompany) => {
    setEditingId(c._id);
    setFormData({
      name: c.name,
      name_ar: c.name_ar || '',
      phone: c.phone || '',
      contact_email: c.contact_email || '',
      fees_per_order: String(c.fees_per_order),
      notes: c.notes || '',
      is_active: c.is_active,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const feesNum = parseFloat(String(formData.fees_per_order));
    if (!formData.name || !formData.name_ar || !formData.phone || !formData.contact_email || isNaN(feesNum)) { 
      setError('الرجاء تعبئة جميع الحقول المطلوبة.'); 
      return; 
    }
    const payload = { ...formData, fees_per_order: feesNum };
    try {
      if (editingId) {
        await fetchApi(`/shipping/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await fetchApi('/shipping', { method: 'POST', body: JSON.stringify(payload) });
      }
      setIsModalOpen(false);
      fetchCompanies();
    } catch (e) {
      setError('Error saving. Please try again.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await fetchApi(`/shipping/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      setDeleteError('');
      fetchCompanies();
    } catch (e: any) {
      const msg = e?.message || 'فشل الحذف. رجاء المحاولة لاحقاً.';
      setDeleteError(msg);
    }
    setIsDeleting(false);
  };

  const handleAdjustBalance = async () => {
    if (!balanceModal) return;
    const adjNum = parseFloat(adjustmentStr);
    if (isNaN(adjNum) || adjNum === 0) return;
    setIsAdjusting(true);
    try {
      await fetchApi(`/shipping/${balanceModal._id}/balance`, {
        method: 'PUT',
        body: JSON.stringify({ type: settlementType, amount: adjNum, note: adjNote }),
      });
      setBalanceModal(null);
      setAdjustmentStr('');
      setAdjNote('');
      fetchCompanies();
    } catch (e) {
      alert('Failed to adjust balance.');
    }
    setIsAdjusting(false);
  };

  const filtered = companies.filter(c => {
    const q = searchQuery.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || (c.name_ar || '').includes(q) || (c.phone || '').includes(q);
  });

  const totalFeesOwed = companies.reduce((sum, c) => sum + (c.fees_owed || 0), 0);
  const totalCodPending = companies.reduce((sum, c) => sum + (c.cod_pending || 0), 0);
  const totalOrders = companies.reduce((sum, c) => sum + c.total_orders, 0);

  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto w-full" dir={dir}>
      {/* Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${dir === 'rtl' ? 'text-right' : ''}`}>
        <div>
          <h2 className="text-4xl font-black font-headline tracking-tighter text-on-surface uppercase mb-1">شركات الشحن</h2>
          <p className="text-on-surface-variant font-medium text-sm">إدارة شركات الشحن والمتابعة المالية</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary-container rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(145,247,142,0.2)] hover:shadow-[0_0_30px_rgba(145,247,142,0.35)] transition-all"
        >
          <span className="material-symbols-outlined text-sm">add</span> إضافة شركة
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`bg-surface-container p-6 rounded-2xl ${dir === 'rtl' ? 'border-r-4' : 'border-l-4'} border-error shadow-sm`}>
          <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] mb-1">مصاريف الشحن عليك</p>
          <h3 className="text-2xl font-headline font-black text-error">
            {loading ? '...' : `${totalFeesOwed.toFixed(2)} EGP`}
          </h3>
          <div className="flex items-center gap-1 mt-2 text-error text-xs font-bold">
            <span className="material-symbols-outlined text-xs">credit_card</span>
            <span>طلبات كارت / محفظة</span>
          </div>
        </div>
        <div className={`bg-surface-container p-6 rounded-2xl ${dir === 'rtl' ? 'border-r-4' : 'border-l-4'} border-amber-400 shadow-sm`}>
          <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] mb-1">مبالغ COD مستحقة لك</p>
          <h3 className="text-2xl font-headline font-black text-amber-400">
            {loading ? '...' : `${totalCodPending.toFixed(2)} EGP`}
          </h3>
          <div className="flex items-center gap-1 mt-2 text-amber-400 text-xs font-bold">
            <span className="material-symbols-outlined text-xs">local_shipping</span>
            <span>على الشركة إعادتها لك</span>
          </div>
        </div>
        <div className={`bg-surface-container p-6 rounded-2xl ${dir === 'rtl' ? 'border-r-4' : 'border-l-4'} border-secondary shadow-sm`}>
          <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] mb-1">إجمالي الطلبات المشحونة</p>
          <h3 className="text-2xl font-headline font-black text-on-surface">{loading ? '...' : totalOrders}</h3>
          <div className="flex items-center gap-1 mt-2 text-secondary text-xs font-bold">
            <span className="material-symbols-outlined text-xs">local_shipping</span>
            <span>عبر جميع شركات الشحن</span>
          </div>
        </div>
        <div className={`bg-surface-container p-6 rounded-2xl ${dir === 'rtl' ? 'border-r-4' : 'border-l-4'} border-primary shadow-sm`}>
          <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] mb-1">شركات نشطة</p>
          <h3 className="text-2xl font-headline font-black text-on-surface">{loading ? '...' : companies.filter(c => c.is_active).length}</h3>
          <div className="flex items-center gap-1 mt-2 text-primary text-xs font-bold">
            <span className="material-symbols-outlined text-xs">check_circle</span>
            <span>من أصل {companies.length} شركة</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full md:w-96">
        <span className="absolute top-1/2 -translate-y-1/2 left-4 material-symbols-outlined text-on-surface-variant">search</span>
        <input
          type="text"
          placeholder="بحث باسم الشركة أو الهاتف..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-surface-container border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-on-surface outline-none focus:border-primary/50 transition-all"
        />
      </div>

      {/* Companies Table */}
      <div className="bg-surface-container rounded-3xl border border-white/5 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
              <tr>
                <th className="px-6 py-4">الشركة</th>
                <th className="px-6 py-4">التواصل</th>
                <th className="px-6 py-4">رسوم الطلب</th>
                <th className="px-6 py-4">الطلبات</th>
                <th className="px-6 py-4 text-error">مصاريف الشحن عليك</th>
                <th className="px-6 py-4 text-amber-400">مبالغ COD مستحقة لك</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-on-surface-variant opacity-50 font-bold">جاري التحميل...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-on-surface-variant opacity-50 font-bold">لا توجد شركات شحن مضافة</td></tr>
              ) : (
                filtered.map((company) => (
                  <tr key={company._id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                          {company.name.charAt(0)}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-on-surface text-sm">{company.name}</p>
                          {company.name_ar && <p className="text-[10px] text-on-surface-variant">{company.name_ar}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-medium text-on-surface" dir="ltr">{company.phone || '—'}</p>
                      <p className="text-[10px] text-on-surface-variant">{company.contact_email || ''}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-black text-on-surface">{company.fees_per_order} EGP</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-black text-on-surface">{company.total_orders}</span>
                    </td>
                    <td className="px-6 py-5">
                      {/* Fees owed: store owes company */}
                      <div className="flex flex-col gap-0.5">
                        {(company.fees_owed || 0) > 0 ? (
                          <span dir="ltr" className="inline-block text-sm font-black text-error">{(company.fees_owed || 0).toFixed(2)} EGP</span>
                        ) : (
                          <span className="text-sm font-black text-primary/60">—</span>
                        )}
                        <p className="text-[9px] text-on-surface-variant font-bold opacity-60">بطاقة / محفظة</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {/* COD pending: company owes store */}
                      <div className="flex flex-col gap-0.5">
                        {(company.cod_pending || 0) > 0 ? (
                          <span dir="ltr" className="inline-block text-sm font-black text-amber-400">{(company.cod_pending || 0).toFixed(2)} EGP</span>
                        ) : (
                          <span className="text-sm font-black text-primary/60">—</span>
                        )}
                        <p className="text-[9px] text-on-surface-variant font-bold opacity-60">دفع عند الاستلام</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                        company.is_active ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
                      }`}>
                        {company.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => { setBalanceModal(company); setAdjustmentStr(''); setAdjNote(''); setSettlementType('fees'); }}
                          className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors flex items-center gap-1"
                          title="تسوية الرصيد"
                        >
                          <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                          تسوية
                        </button>
                        <button
                          onClick={() => openEdit(company)}
                          className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                          title="تعديل"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteId(company._id)}
                          className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                          title="حذف"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleSave} className="bg-surface-container-highest border border-primary/20 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 direction-rtl" dir="rtl">
            <div className="p-8 border-b border-primary/10 flex justify-between items-center">
              <h3 className="text-xl font-black font-headline text-primary uppercase">
                {editingId ? 'تعديل شركة الشحن' : 'إضافة شركة شحن'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-xl transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 space-y-5 max-h-[65vh] overflow-y-auto">
              {error && <div className="p-4 bg-error/10 border border-error/30 rounded-xl text-error text-xs font-bold">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">اسم الشركة *</label>
                  <input required value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} className="w-full bg-surface-container border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-on-surface outline-none focus:border-primary/50 transition-all" placeholder="مثال: Bosta" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">الاسم بالعربية *</label>
                  <input required value={formData.name_ar} onChange={e => setFormData(p => ({...p, name_ar: e.target.value}))} className="w-full bg-surface-container border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-on-surface outline-none focus:border-primary/50 transition-all" placeholder="بوسطة" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">هاتف التواصل *</label>
                  <input required dir="ltr" value={formData.phone} onChange={e => setFormData(p => ({...p, phone: e.target.value}))} className="w-full bg-surface-container border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-on-surface outline-none focus:border-primary/50 transition-all" placeholder="01xxxxxxxxx" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">البريد الإلكتروني *</label>
                  <input required type="email" dir="ltr" value={formData.contact_email} onChange={e => setFormData(p => ({...p, contact_email: e.target.value}))} className="w-full bg-surface-container border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-on-surface outline-none focus:border-primary/50 transition-all" placeholder="info@company.com" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">رسوم الشحن لكل طلب (EGP) *</label>
                <input required type="text" inputMode="decimal" pattern="[0-9]*(\.[0-9]+)?" value={formData.fees_per_order} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g,''); setFormData(p => ({...p, fees_per_order: v})); }} className="w-full bg-surface-container border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-on-surface outline-none focus:border-primary/50 transition-all" dir="ltr" lang="en" placeholder="100" />
                <p className="text-[9px] text-on-surface-variant mt-1 opacity-60">سيتم إضافتها تلقائياً للرصيد عند كل شحن</p>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">ملاحظات</label>
                <textarea value={formData.notes} onChange={e => setFormData(p => ({...p, notes: e.target.value}))} rows={3} className="w-full bg-surface-container border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-on-surface outline-none focus:border-primary/50 transition-all resize-none" placeholder="أي ملاحظات إضافية..." />
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                <input type="checkbox" id="is_active_check" checked={formData.is_active} onChange={e => setFormData(p => ({...p, is_active: e.target.checked}))} className="rounded border-white/10 bg-surface-container text-primary" />
                <label htmlFor="is_active_check" className="text-sm font-bold text-on-surface cursor-pointer">شركة نشطة (يمكن اختيارها عند الشحن)</label>
              </div>
            </div>
            <div className="p-8 pt-4 flex gap-3">
              <button type="submit" className="flex-1 py-3 bg-primary text-on-primary-container font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg hover:shadow-[0_0_20px_var(--accent-glow)] transition-all">
                {editingId ? 'حفظ التعديلات' : 'إضافة الشركة'}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white/5 text-on-surface-variant font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Balance Adjustment Modal */}
      {balanceModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" dir="rtl">
          <div className="bg-surface-container-highest border border-amber-400/20 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-amber-400/10 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black font-headline text-amber-400 uppercase">تسوية حساب</h3>
                <p className="text-sm text-on-surface-variant mt-1">{balanceModal.name}</p>
              </div>
              <button onClick={() => setBalanceModal(null)} className="p-1 hover:bg-white/10 rounded-xl"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-8 space-y-5">
              {/* Show current balances */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-2xl border cursor-pointer transition-all ${settlementType === 'fees' ? 'border-error/60 bg-error/10' : 'border-white/10 bg-white/5 opacity-60'}`}
                  onClick={() => { setSettlementType('fees'); setAdjustmentStr(''); }}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-error mb-1">مصاريف الشحن عليك</p>
                  <p dir="ltr" className="text-lg font-headline font-black text-error">{(balanceModal.fees_owed || 0).toFixed(2)} EGP</p>
                  <p className="text-[9px] text-on-surface-variant mt-1">طلبات كارت / محفظة</p>
                </div>
                <div className={`p-4 rounded-2xl border cursor-pointer transition-all ${settlementType === 'cod' ? 'border-amber-400/60 bg-amber-400/10' : 'border-white/10 bg-white/5 opacity-60'}`}
                  onClick={() => { setSettlementType('cod'); setAdjustmentStr(''); }}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-1">مبالغ COD مستحقة لك</p>
                  <p dir="ltr" className="text-lg font-headline font-black text-amber-400">{(balanceModal.cod_pending || 0).toFixed(2)} EGP</p>
                  <p className="text-[9px] text-on-surface-variant mt-1">الشركة تردها لك</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">
                  {settlementType === 'fees' ? 'المبلغ الذي دفعته للشركة' : 'المبلغ الذي استلمته من الشركة'}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={adjustmentStr}
                  onChange={e => { const v = e.target.value.replace(/[^0-9.]/g,''); setAdjustmentStr(v); }}
                  className={`w-full bg-surface-container border rounded-xl py-3 px-4 text-sm font-bold text-on-surface outline-none transition-all ${settlementType === 'fees' ? 'border-error/30 focus:border-error/60' : 'border-amber-400/30 focus:border-amber-400/60'}`}
                  dir="ltr"
                  lang="en"
                  placeholder="مثال: 500"
                />
                {adjustmentStr && parseFloat(adjustmentStr) > 0 && (
                  <p className="text-xs font-bold mt-2 text-primary">
                    المتبقي بعد التسوية:{' '}
                    <span dir="ltr" className="inline-block">
                      {Math.max(0, (settlementType === 'fees' ? (balanceModal.fees_owed || 0) : (balanceModal.cod_pending || 0)) - parseFloat(adjustmentStr)).toFixed(2)} EGP
                    </span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">سبب التسوية</label>
                <input
                  value={adjNote}
                  onChange={e => setAdjNote(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-on-surface outline-none focus:border-amber-400/50 transition-all"
                  placeholder="مثال: سداد فاتورة شهر مارس"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleAdjustBalance} disabled={isAdjusting || !adjustmentStr || parseFloat(adjustmentStr) === 0} className="flex-1 py-3 bg-amber-400 text-black font-black text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-40 transition-all">
                  {isAdjusting ? '...' : 'تأكيد التعديل'}
                </button>
                <button onClick={() => setBalanceModal(null)} className="px-6 py-3 bg-white/5 text-on-surface-variant font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" dir="rtl">
          <div className="bg-surface-container-highest border border-error/20 w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center animate-in zoom-in-95">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${deleteError ? 'bg-amber-500/10 text-amber-400' : 'bg-error/10 text-error'}`}>
              <span className="material-symbols-outlined text-3xl">{deleteError ? 'block' : 'warning'}</span>
            </div>
            <h3 className="text-xl font-black text-on-surface mb-2">
              {deleteError ? 'لا يمكن الحذف' : 'تأكيد الحذف'}
            </h3>

            {deleteError ? (
              <>
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-6 text-right">
                  <p className="text-sm text-amber-300 font-medium leading-relaxed">{deleteError}</p>
                </div>
                <button
                  onClick={() => { setDeleteId(null); setDeleteError(''); }}
                  className="w-full py-3 bg-primary/10 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary/20 transition-colors"
                >
                  حسناً، فهمت
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-on-surface-variant mb-8">هل أنت متأكد أنك تريد حذف شركة الشحن هذه بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.</p>
                <div className="flex gap-3">
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 py-3 bg-error text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'جاري التحقق...' : 'نعم، احذف الشركة'}
                  </button>
                  <button
                    onClick={() => { setDeleteId(null); setDeleteError(''); }}
                    disabled={isDeleting}
                    className="flex-1 py-3 bg-white/5 text-on-surface-variant font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
