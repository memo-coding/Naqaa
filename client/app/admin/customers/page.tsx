'use client';
import { useState, useEffect, useMemo } from 'react';
import { useLang } from '@/components/LanguageProvider';
import { useCMS } from '@/components/CMSProvider';
import { fetchApi } from '@/lib/api';

export default function CustomersDirectory() {
  const { t, dir } = useLang();
  const { data: cms } = useCMS();

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [registeredFilter, setRegisteredFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => { setCurrentPage(1); }, [searchQuery, cityQuery, tierFilter, sortBy, registeredFilter]);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const [profilesData, ordersData] = await Promise.all([
          fetchApi('/auth/users'),
          fetchApi('/orders'),
        ]);

        const registeredMap = new Map<string, any>();
        if (profilesData && Array.isArray(profilesData)) {
          profilesData.filter((p: any) => p.role !== 'admin').forEach((p: any) => {
            registeredMap.set(p._id?.toString(), p);
          });
        }

        const customerMap = new Map<string, any>();

        // Build from orders — covers both registered & guest
        if (ordersData && Array.isArray(ordersData)) {
          ordersData.forEach((o: any) => {
            const uid = o.user_id?.toString() || null;
            // Use correct field names from Order model
            const email = (o.customer_email || '').toLowerCase().trim();
            const phone = o.customer_phone || 'N/A';
            const name  = o.customer_name  || 'Guest';
            const city  = o.shipping_city  || '';
            const key   = uid || email || o._id;

            const existing = customerMap.get(key);
            const orderTotal = Number(o.total_amount) || 0;
            const orderDate  = new Date(o.createdAt);

            if (existing) {
              existing.orderCount += 1;
              existing.spendNum  += orderTotal;
              if (orderDate > existing._latestOrderDate) {
                existing._latestOrderDate = orderDate;
                if (phone !== 'N/A') existing.phone = phone;
                if (city) existing.city = city;
              }
            } else {
              const isRegistered = uid && registeredMap.has(uid);
              const reg          = isRegistered ? registeredMap.get(uid) : null;

              customerMap.set(key, {
                id: key,
                name: reg?.name || name,
                email: reg?.email || email || 'N/A',
                phone,
                city,
                createdAt: reg?.createdAt ? new Date(reg.createdAt) : orderDate,
                _latestOrderDate: orderDate,
                orderCount: 1,
                spendNum: orderTotal,
                isRegistered: !!isRegistered,
              });
            }
          });
        }

        const result = Array.from(customerMap.values()).map((c) => ({
          ...c,
          spend: `EGP ${c.spendNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          loyaltyKey:
            c.spendNum >= (cms.tierPlatinumThreshold || 1000)
              ? 'tier_platinum'
              : c.spendNum >= (cms.tierGoldThreshold || 500)
              ? 'tier_gold'
              : 'tier_new',
        }));

        setCustomers(result);
      } catch (err) {
        console.error('Failed to load customers:', err);
      }
      setLoading(false);
    }
    fetchCustomers();
  }, []);

  // Full Arabic normalization — covers all letter variants for fuzzy matching
  const normalizeAr = (str: string) =>
    str
      .toLowerCase()
      // Alef variants → ا
      .replace(/[إأآٱٲٳٵ]/g, 'ا')
      // Hamza variants → ء
      .replace(/[ئؤ]/g, 'ء')
      // Teh marbuta → ه  (القاهرة = القاهره)
      .replace(/ة/g, 'ه')
      // Yeh variants → ي  (على = علي)
      .replace(/[ىیۍ]/g, 'ي')
      // Waw with hamza → و
      .replace(/ؤ/g, 'و')
      // Kashida (tatweel) ـ
      .replace(/ـ/g, '')
      // Tashkeel / diacritics
      .replace(/[\u064b-\u065f\u0670]/g, '')
      // Normalize spaces
      .replace(/\s+/g, ' ')
      .trim();

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (searchQuery) {
      const q = normalizeAr(searchQuery);
      result = result.filter(
        (c) =>
          normalizeAr(c.name).includes(q) ||
          normalizeAr(c.email).includes(q) ||
          c.phone.includes(searchQuery)
      );
    }

    if (cityQuery) {
      const q = normalizeAr(cityQuery);
      result = result.filter((c) => normalizeAr(c.city || '').includes(q));
    }

    if (tierFilter !== 'all') result = result.filter((c) => c.loyaltyKey === tierFilter);
    if (registeredFilter === 'registered') result = result.filter((c) => c.isRegistered);
    if (registeredFilter === 'guest')      result = result.filter((c) => !c.isRegistered);

    switch (sortBy) {
      case 'highest_spend': result.sort((a, b) => b.spendNum - a.spendNum); break;
      case 'most_orders':   result.sort((a, b) => b.orderCount - a.orderCount); break;
      case 'oldest':        result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); break;
      default:              result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); break;
    }

    return result;
  }, [customers, searchQuery, cityQuery, tierFilter, sortBy, registeredFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const registeredCount = customers.filter((c) => c.isRegistered).length;
  const guestCount = customers.filter((c) => !c.isRegistered).length;

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full" dir={dir}>
      {/* Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
        <div>
          <h2 className="text-4xl font-black font-headline  text-on-surface uppercase mb-1">
            {t('admin_customers_title') || 'Customers Directory'}
          </h2>
          <p className="text-on-surface-variant font-medium text-sm">
            {t('admin_customers_desc') || 'All customers who placed orders'}
          </p>
        </div>
        {/* Summary badges */}
        <div className={`flex gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
          <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-center">
            <p className="text-[8px] font-black uppercase  text-primary mb-0.5">{dir === 'rtl' ? 'مسجلون' : 'Registered'}</p>
            <p className="text-lg font-black text-on-surface">{loading ? '…' : registeredCount}</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-secondary/10 border border-secondary/20 text-center">
            <p className="text-[8px] font-black uppercase  text-secondary mb-0.5">{dir === 'rtl' ? 'ضيوف' : 'Guests'}</p>
            <p className="text-lg font-black text-on-surface">{loading ? '…' : guestCount}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface-container-low p-6 rounded-3xl border border-white/5 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center group flex-wrap">
        {/* Search + City */}
        <div className={`flex flex-col sm:flex-row gap-3 w-full lg:w-auto ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
          <div className="w-full sm:w-64 relative">
            <span className={`absolute top-1/2 -translate-y-1/2 ${dir === 'rtl' ? 'right-4' : 'left-4'} material-symbols-outlined text-on-surface-variant`}>search</span>
            <input
              type="text"
              placeholder={dir === 'rtl' ? 'الاسم، البريد أو الهاتف...' : 'Name, email, or phone...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-surface-container border border-white/10 rounded-xl py-3 ${dir === 'rtl' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} text-sm font-bold text-on-surface outline-none focus:border-primary/50 transition-all`}
            />
          </div>
          <div className="w-full sm:w-44 relative">
            <span className={`absolute top-1/2 -translate-y-1/2 ${dir === 'rtl' ? 'right-4' : 'left-4'} material-symbols-outlined text-on-surface-variant text-lg`}>location_city</span>
            <input
              type="text"
              placeholder={dir === 'rtl' ? 'فلتر المدينة...' : 'Filter by city...'}
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              className={`w-full bg-surface-container border border-white/10 rounded-xl py-3 ${dir === 'rtl' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} text-sm font-bold text-on-surface outline-none focus:border-primary/50 transition-all`}
            />
          </div>
        </div>

        <div className={`flex flex-wrap gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
          {/* Registered / Guest filter */}
          <div className={`flex bg-surface-container border border-white/10 rounded-xl p-1 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
            {(['all', 'registered', 'guest'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setRegisteredFilter(f)}
                className={`px-4 py-2 text-[10px] font-black uppercase  rounded-lg transition-all ${registeredFilter === f ? 'bg-primary text-black shadow-[0_0_15px_rgba(145,247,142,0.3)]' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {f === 'all' ? (dir === 'rtl' ? 'الكل' : 'All') : f === 'registered' ? (dir === 'rtl' ? 'مسجلون' : 'Registered') : (dir === 'rtl' ? 'ضيوف' : 'Guests')}
              </button>
            ))}
          </div>

          {/* Tier filter */}
          <div className={`flex bg-surface-container border border-white/10 rounded-xl p-1 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
            {(['all', 'tier_platinum', 'tier_gold', 'tier_new'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-4 py-2 text-[10px] font-black uppercase  rounded-lg transition-all ${tierFilter === tier ? 'bg-primary text-black shadow-[0_0_15px_rgba(145,247,142,0.3)]' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {tier === 'all' ? (dir === 'rtl' ? 'كل الفئات' : 'All Tiers') : t(tier)}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-surface-container border border-white/10 rounded-xl py-3 px-4 pl-10 text-[10px] font-black  uppercase text-on-surface outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="newest">{dir === 'rtl' ? 'الأحدث' : 'Newest'}</option>
              <option value="oldest">{dir === 'rtl' ? 'الأقدم' : 'Oldest'}</option>
              <option value="highest_spend">{dir === 'rtl' ? 'الأعلى إنفاقاً' : 'Highest Spend'}</option>
              <option value="most_orders">{dir === 'rtl' ? 'الأكثر طلبات' : 'Most Orders'}</option>
            </select>
            <span className="absolute top-1/2 -translate-y-1/2 left-3 material-symbols-outlined text-on-surface-variant pointer-events-none text-lg">sort</span>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-3xl bg-surface-container animate-pulse border border-white/5" />
          ))
        ) : paginatedCustomers.length === 0 ? (
          <div className="text-center py-20 text-on-surface-variant col-span-full opacity-60">
            <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
            <p className="text-sm font-bold uppercase ">{dir === 'rtl' ? 'لم يتم العثور على عملاء' : 'No customers found'}</p>
          </div>
        ) : (
          paginatedCustomers.map((cust) => (
            <div key={cust.id} className="p-6 rounded-3xl bg-surface-container border border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden shadow-sm flex flex-col h-full">
              <div className={`absolute top-0 ${dir === 'rtl' ? 'left-0 -ml-10' : 'right-0 -mr-10'} w-24 h-24 bg-primary/5 rounded-xl -mt-10 blur-2xl group-hover:bg-primary/10 transition-all`}></div>

              {/* Header row */}
              <div className={`relative z-10 flex justify-between items-start mb-4 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-xl shadow-[0_0_15px_rgba(145,247,142,0.1)] shrink-0">
                    {cust.name[0]}
                  </div>
                  <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                    <h4 className="font-headline font-black text-base text-on-surface  mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]">{cust.name}</h4>
                    <p className="text-[9px] text-on-surface-variant font-bold uppercase  whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]" dir="ltr">{cust.email}</p>
                  </div>
                </div>

                {/* Registered / Guest badge */}
                <span className={`px-2.5 py-1 text-[8px] font-black uppercase  rounded-xl shrink-0 flex items-center gap-1 ${
                  cust.isRegistered
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : 'bg-white/5 text-on-surface-variant border border-white/10'
                }`}>
                  <span className="material-symbols-outlined text-[12px]">{cust.isRegistered ? 'verified_user' : 'person_outline'}</span>
                  {cust.isRegistered ? (dir === 'rtl' ? 'مسجّل' : 'Registered') : (dir === 'rtl' ? 'ضيف' : 'Guest')}
                </span>
              </div>

              {/* Info row */}
              <div className={`grid grid-cols-2 gap-3 mb-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                <div className="bg-surface-container-low p-3 rounded-xl border border-white/5">
                  <p className="text-[8px] text-on-surface-variant uppercase font-black  mb-1">{dir === 'rtl' ? 'الهاتف' : 'Phone'}</p>
                  <p className="text-[10px] font-bold text-on-surface" dir="ltr">{cust.phone}</p>
                </div>
                <div className="bg-surface-container-low p-3 rounded-xl border border-white/5">
                  <p className="text-[8px] text-on-surface-variant uppercase font-black  mb-1">{dir === 'rtl' ? 'المدينة' : 'City'}</p>
                  <p className="text-[10px] font-bold text-on-surface">{cust.city || '—'}</p>
                </div>
              </div>

              {/* Footer row */}
              <div className={`mt-auto flex justify-between items-end pt-4 border-t border-white/5 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                  <p className="text-[8px] font-black uppercase ] text-on-surface-variant mb-1">{t('admin_lifetime_value')}</p>
                  <p className="text-sm font-black text-on-surface">{cust.spend}</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] font-black uppercase ] text-on-surface-variant mb-1">{dir === 'rtl' ? 'الطلبات' : 'Orders'}</p>
                  <p className="text-sm font-black text-on-surface">{cust.orderCount}</p>
                </div>
                <div className={dir === 'rtl' ? 'text-left' : 'text-right'}>
                  <p className="text-[8px] font-black uppercase ] text-on-surface-variant mb-1">{t('admin_tier')}</p>
                  <p className="text-[10px] font-black font-headline text-primary uppercase">{t(cust.loyaltyKey)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-2xl border border-white/5 shadow-sm mt-8">
          <div className="text-xs text-on-surface-variant font-medium">
            {t('admin_showing') || 'Showing'} {((currentPage - 1) * ITEMS_PER_PAGE) + 1} {t('admin_to') || 'to'} {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)} {t('admin_of') || 'of'} {filteredCustomers.length}
          </div>
          <div className={`flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === page ? 'bg-primary text-black shadow-[0_0_10px_rgba(145,247,142,0.3)]' : 'bg-surface-container hover:bg-white/5 text-on-surface-variant border border-white/5'}`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
