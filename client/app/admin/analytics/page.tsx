'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/components/LanguageProvider';
import { fetchApi } from '@/lib/api';

export default function AnalyticsDashboard() {
  const { t, dir } = useLang();

  const [revenue, setRevenue] = useState(0);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [chartData, setChartData] = useState<number[]>(Array(12).fill(5));
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [growthVelocity, setGrowthVelocity] = useState(0);

  useEffect(() => {
    async function fetchAnalytics() {
       setLoading(true);
       try {
         const data = await fetchApi('/analytics/dashboard');
         if (data) {
           setRevenue(data.revenue || 0);
         }
         
         const orders = await fetchApi('/orders');
         if (orders && Array.isArray(orders)) {
            // Top Products logic
            const productCounts: Record<string, number> = {};
            orders.forEach((o: any) => {
              const items = o.items || o.products || [];
              if (Array.isArray(items)) {
                items.forEach((item: any) => {
                  const name = item.name || item.product_name || 'Unknown';
                  productCounts[name] = (productCounts[name] || 0) + (item.quantity || 1);
                });
              }
            });
            
            const sortedProducts = Object.entries(productCounts)
               .sort((a, b) => b[1] - a[1])
               .slice(0, 3)
               .map((entry, i) => ({
                  name: entry[0],
                  sales: `${entry[1]} units`,
                  color: i === 0 ? 'primary' : i === 1 ? 'secondary' : 'on-surface-variant'
               }));
            
            while(sortedProducts.length < 3) {
               sortedProducts.push({ name: 'N/A', sales: '0 units', color: 'on-surface-variant' });
            }
            setTopProducts(sortedProducts);

            // Monthly Sales Chart logic
            const monthlyData = Array(12).fill(0);
            orders.forEach((o: any) => {
               let d = new Date();
               const dateStr = o.createdAt || o.created_at || Date.now() || o.date || o.order_date || o.createdAt;
               if (dateStr) d = new Date(dateStr);
               else if (o._id && typeof o._id === 'string' && o._id.length >= 8) { 
                  const timestamp = parseInt(o._id.substring(0, 8), 16) * 1000;
                  if (!isNaN(timestamp)) d = new Date(timestamp);
               }
               
               if (!isNaN(d.getTime())) {
                  const amtValue = o.total_amount || o.total || o.amount || o.totalPrice || 0;
                  const amt = parseFloat(amtValue) || 0;
                  monthlyData[d.getMonth()] += amt;
               }
            });
            
            const maxVal = Math.max(...monthlyData, 1);
            const scaledData = monthlyData.map(val => {
               if (val === 0) return 5;
               const pct = (val / maxVal) * 75 + 25; 
               return Math.min(100, pct);
            });
            setChartData(scaledData);

            // Regions logic
            const cities: Record<string, number> = {};
            orders.forEach((o: any) => {
               const city = o.shipping_city || o.city || o.address?.city || 'Other';
               cities[city] = (cities[city] || 0) + 1;
            });
            const sortedRegions = Object.entries(cities)
               .sort((a, b) => b[1] - a[1])
               .slice(0, 4)
               .map(([name, count]) => ({ 
                  name, 
                  percentage: Math.round((count / orders.length) * 100),
                  count 
               }));
            setRegions(sortedRegions);

            // Total Orders
            setTotalOrders(orders.length);

            // Growth Velocity & Health Status
            const now = new Date();
            const currentMonth = now.getMonth();
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            
            let thisMonthOrders = 0;
            let lastMonthOrders = 0;
            let deliveredOrders = 0;
            
            orders.forEach((o: any) => {
               if (o.status === 'delivered') deliveredOrders++;

               let d = new Date();
               const dateStr = o.createdAt || o.created_at || Date.now() || o.date || o.order_date || o.createdAt;
               if (dateStr) d = new Date(dateStr);
               else if (o._id && typeof o._id === 'string' && o._id.length >= 8) { 
                  const timestamp = parseInt(o._id.substring(0, 8), 16) * 1000;
                  if (!isNaN(timestamp)) d = new Date(timestamp);
               }
               
               if (!isNaN(d.getTime())) {
                  if (d.getMonth() === currentMonth) thisMonthOrders++;
                  else if (d.getMonth() === lastMonth) lastMonthOrders++;
               }
            });
            
            if (lastMonthOrders === 0) {
               setGrowthVelocity(thisMonthOrders > 0 ? 100 : 0);
            } else {
               setGrowthVelocity(Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100));
            }

            const fullfillRate = orders.length > 0 ? (deliveredOrders / orders.length) * 100 : 100;
            setHealthStatus(parseFloat(fullfillRate.toFixed(1)));
         }
       } catch (err) {
         console.error('Failed to load dashboard metrics', err);
       }
       setLoading(false);
    }
    fetchAnalytics();
  }, []);

  const hasRegion = (name: string) => {
     return regions.some(r => {
        const rName = r.name?.toLowerCase() || '';
        if (name === 'Cairo') return rName.includes('cairo') || rName.includes('القاهرة');
        if (name === 'Alexandria') return rName.includes('alex') || rName.includes('الإسكندرية');
        if (name === 'Giza') return rName.includes('giza') || rName.includes('الجيزة');
        if (name === 'Dakahlia') return rName.includes('dak') || rName.includes('mans') || rName.includes('المنصورة') || rName.includes('الدقهلية');
        return rName.includes(name.toLowerCase());
     });
  };

  return (
    <main className="min-h-screen bg-[#0a0f0b] text-[#f9fef5] p-8 relative overflow-hidden" dir={dir}>
      {/* Background Glow Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#91f78e]/5 blur-[120px] rounded-xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#2ff801]/5 blur-[100px] rounded-xl -z-10"></div>

      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-20">
        <div>
          <h1 className="text-4xl md:text-5xl font-black font-headline  text-[#91f78e] uppercase mb-1 drop-shadow-[0_0_15px_rgba(145,247,142,0.3)]">
            {t('admin_analytics_title')}
          </h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#151b15] border border-[#91f78e]/10 rounded-xl w-fit">
             <div className="w-2 h-2 rounded-xl bg-[#2ff801]"></div>
             <p className="text-[#a7ada4] font-black text-[9px] uppercase ">{t('admin_system_health')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="px-5 py-3 bg-[#151b15] border border-[#91f78e]/15 rounded-2xl flex items-center gap-4 shadow-2xl backdrop-blur-xl">
              <span className="material-symbols-outlined text-[#91f78e] text-lg">calendar_today</span>
              <select className="bg-transparent border-none text-[10px] font-black uppercase ] outline-none text-[#f9fef5] cursor-pointer appearance-none pr-8 relative">
                <option>{t('admin_filter_last_30_days')}</option>
                <option>{t('admin_filter_year_to_date')}</option>
                <option>{t('admin_filter_all_time')}</option>
              </select>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 relative z-10">
        {/* Revenue Card */}
        <section className="col-span-12 lg:col-span-8 bg-[#151b15]/80 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-[#91f78e]/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col justify-between group">
           <div className="relative z-10">
              <div className="flex justify-between items-start">
                 <div>
                    <span className="text-[10px] font-black uppercase ] text-[#a7ada4] mb-3 block">{t('admin_net_total_revenue')}</span>
                    <h2 className="text-6xl font-black font-headline text-[#f9fef5]  flex items-baseline gap-3">
                       {loading ? '...' : `$${revenue.toLocaleString()}`}
                       <span className="text-[#91f78e] text-xl opacity-50">.00</span>
                    </h2>
                 </div>
                 <div className="p-4 bg-[#91f78e]/5 border border-[#91f78e]/20 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                    <span className="material-symbols-outlined text-[#91f78e] text-3xl">insights</span>
                 </div>
              </div>

              {/* Monthly Flow Chart */}
              <div className="mt-20 h-64 flex items-end gap-[2%] px-2" dir="ltr">
                 {chartData.map((h, i) => (
                    <div key={i} className="flex-1 group/bar relative h-full flex flex-col justify-end">
                       <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-[#202820] border border-[#91f78e]/30 px-4 py-2 rounded-xl text-[10px] font-black text-[#f9fef5] opacity-0 group-hover/bar:opacity-100 transition-all duration-300 z-30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] scale-75 group-hover/bar:scale-100 whitespace-nowrap">
                          {t('admin_revenue')}: <span className="text-[#91f78e]">{t('status_healthy')}</span>
                       </div>
                       
                       <div 
                          className={`w-full bg-[#91f78e]/5 border border-[#91f78e]/15 rounded-t-2xl hover:bg-[#91f78e]/30 transition-all duration-700 cursor-pointer relative ${h > 10 ? 'group-hover/bar:shadow-[0_0_40px_rgba(145,247,142,0.3)]' : ''}`} 
                          style={{ height: `${h}%` }}
                       >
                          <div className={`absolute top-0 left-0 w-full h-[4px] bg-[#91f78e] shadow-[0_0_15px_#91f78e] rounded-xl ${h > 10 ? 'opacity-100' : 'opacity-20'}`}></div>
                          {h > 50 && <div className="absolute inset-0 bg-gradient-to-t from-transparent to-[#91f78e]/20"></div>}
                       </div>
                       
                       <span className="mt-5 text-[8px] font-black uppercase text-[#a7ada4]  text-center opacity-40 group-hover/bar:opacity-100 transition-all">
                          {['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][i]}
                       </span>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Right Sidebar Stats */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-8">
           <div className="bg-[#151b15]/60 backdrop-blur-lg rounded-[2.5rem] p-10 border border-[#91f78e]/10 shadow-xl flex flex-col items-center text-center">
              <span className="text-[10px] font-black uppercase ] text-[#a7ada4] mb-6">{t('admin_system_health')}</span>
              <div className="relative mb-6">
                 <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="transparent" stroke="#202820" strokeWidth="12" />
                    <circle 
                       cx="64" cy="64" r="56" fill="transparent" stroke="#2ff801" strokeWidth="12" 
                       strokeDasharray={352} strokeDashoffset={352 - (352 * healthStatus / 100)}
                       className="transition-all duration-[1.5s] ease-in-out drop-shadow-[0_0_8px_rgba(47,248,1,0.5)]"
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black ">{healthStatus}%</span>
                    <span className="text-[8px] font-bold text-[#2ff801] uppercase ">{t('status_healthy')}</span>
                 </div>
              </div>
              <p className="text-sm font-black text-[#f9fef5] mb-1">{t('admin_system_health')}: {t('status_healthy')}</p>
              <p className="text-[10px] text-[#a7ada4] font-medium leading-relaxed">{t('admin_fulfillment_desc')}</p>
           </div>

           <div className="bg-[#151b15]/60 backdrop-blur-lg rounded-[2.5rem] p-8 border border-[#91f78e]/10 shadow-xl">
              <h3 className="text-[10px] font-black uppercase ] text-[#a7ada4] mb-6 px-2">{t('admin_top_products')}</h3>
              <div className="space-y-4">
                 {topProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-3xl bg-[#0a0f0b]/40 border border-white/5 hover:border-[#91f78e]/40 transition-all group overflow-hidden relative">
                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#91f78e] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-[#91f78e]/10 flex items-center justify-center text-xs font-black text-[#91f78e] group-hover:bg-[#91f78e]/20 transition-colors">
                             {p.name === 'N/A' ? '?' : p.name[0]}
                          </div>
                          <div>
                             <p className="text-sm font-black  text-[#f9fef5] mb-0.5">{p.name}</p>
                             <p className="text-[9px] text-[#a7ada4] uppercase font-black ">{p.sales}</p>
                          </div>
                       </div>
                       <span className="material-symbols-outlined text-[18px] text-[#a7ada4] group-hover:text-[#91f78e] transition-colors">arrow_outward</span>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Egypt Geographic Data Cluster */}
        <section className="col-span-12 lg:col-span-7 bg-[#151b15]/80 backdrop-blur-3xl rounded-[2.5rem] p-12 border border-[#91f78e]/10 shadow-2xl relative min-h-[600px] flex flex-col group">
           <div className="flex justify-between items-center mb-12">
              <div>
                 <h3 className="text-2xl font-headline font-black  text-[#91f78e] uppercase drop-shadow-[0_0_10px_rgba(145,247,142,0.2)]">{t('admin_global_order_cartography')}</h3>
                 <p className="text-xs text-[#a7ada4] font-bold uppercase  mt-1 opacity-70">{t('admin_regional_distribution')}</p>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-[#0a0f0b] rounded-2xl border border-[#2ff801]/30 shadow-inner">
                 <div className="w-2 h-2 rounded-xl bg-[#2ff801] animate-[ping_1.5s_infinite] shadow-[0_0_10px_#2ff801]"></div>
                 <span className="text-[9px] font-black uppercase ] text-[#2ff801]">{t('status_healthy')}</span>
              </div>
           </div>

           <div className="relative flex-grow flex items-center justify-center overflow-hidden rounded-[2rem] bg-[#0a0f0b]/40 border border-white/5 p-12 group-hover:border-[#91f78e]/20 transition-colors duration-700">
              <svg viewBox="0 0 600 600" className="w-full h-full max-h-[450px] drop-shadow-[0_0_40px_rgba(47,248,1,0.2)] transform group-hover:scale-[1.02] transition-transform duration-1000">
                 {/* Precision Egypt Map Path */}
                 <path 
                    d="M130,100 L400,100 L415,130 L430,120 L450,140 L445,170 L465,185 L475,220 L460,240 L470,260 L455,420 L135,420 L110,280 L100,180 L115,130 Z" 
                    fill="rgba(47,248,1,0.03)" 
                    stroke="rgba(145,247,142,0.25)" 
                    strokeWidth="1.5" 
                    className="transition-all duration-1000 hover:fill-[#91f78e]/5"
                 />
                 
                 {/* Grid */}
                 <path d="M150,100 L150,420 M250,100 L250,420 M350,100 L350,420 M130,150 L475,150 M130,250 L465,250 M130,350 L460,350" fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="0.5" />

                 {/* The Nile */}
                 <path 
                    d="M280,420 Q275,300 290,200 T285,100" 
                    fill="none" stroke="#2ff801" strokeOpacity="0.15" strokeWidth="3" strokeLinecap="round" className="animate-pulse"
                 />
                 
                 {/* Cairo */}
                 <g className={`transition-all duration-700 hover:opacity-100 ${hasRegion('Cairo') ? 'opacity-100' : 'opacity-40'}`}>
                    <circle cx="290" cy="160" r="30" fill="url(#radCairo)" className={hasRegion('Cairo') ? "animate-pulse" : ""} />
                    <circle cx="290" cy="160" r={hasRegion('Cairo') ? "8" : "3"} fill="#f9fef5" className="shadow-[0_0_15px_#fff]" />
                    <text x="305" y="165" fill="#91f78e" fontSize="10" fontWeight="bold">CAIRO</text>
                 </g>

                 {/* Alexandria */}
                 <g className={`transition-all duration-700 hover:opacity-100 ${hasRegion('Alexandria') ? 'opacity-100' : 'opacity-40'}`}>
                    <circle cx="230" cy="115" r="22" fill="url(#radAlex)" className={hasRegion('Alexandria') ? "animate-pulse" : ""} />
                    <circle cx="230" cy="115" r={hasRegion('Alexandria') ? "6" : "3"} fill="#f9fef5" />
                 </g>

                 {/* Dakahlia */}
                 <g className={`transition-all duration-700 hover:opacity-100 ${hasRegion('Dakahlia') ? 'opacity-100' : 'opacity-40'}`}>
                    <circle cx="310" cy="130" r="20" fill="url(#radDak)" className={hasRegion('Dakahlia') ? "animate-pulse" : ""} />
                    <circle cx="310" cy="130" r={hasRegion('Dakahlia') ? "6" : "2"} fill="#f9fef5" />
                 </g>

                 {/* Giza */}
                 <g className={`transition-all duration-700 hover:opacity-100 ${hasRegion('Giza') ? 'opacity-100' : 'opacity-40'}`}>
                    <circle cx="280" cy="175" r="15" fill="url(#radGiza)" className={hasRegion('Giza') ? "animate-pulse" : ""} />
                    <circle cx="280" cy="175" r={hasRegion('Giza') ? "5" : "2"} fill="#2ff801" />
                 </g>

                 <defs>
                    <radialGradient id="radCairo" cx="50%" cy="50%" r="50%">
                       <stop offset="0%" stopColor="#91f78e" stopOpacity="0.5" />
                       <stop offset="100%" stopColor="#91f78e" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="radAlex" cx="50%" cy="50%" r="50%">
                       <stop offset="0%" stopColor="#2ff801" stopOpacity="0.4" />
                       <stop offset="100%" stopColor="#2ff801" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="radDak" cx="50%" cy="50%" r="50%">
                       <stop offset="0%" stopColor="#91f78e" stopOpacity="0.4" />
                       <stop offset="100%" stopColor="#91f78e" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="radGiza" cx="50%" cy="50%" r="50%">
                       <stop offset="0%" stopColor="#2ff801" stopOpacity="0.3" />
                       <stop offset="100%" stopColor="#2ff801" stopOpacity="0" />
                    </radialGradient>
                 </defs>
              </svg>

              {/* Region Legend Overlay */}
              <div className="absolute bottom-8 right-8 p-6 bg-[#151b15]/90 backdrop-blur-xl rounded-[2rem] border border-[#91f78e]/20 shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-500">
                 <p className="text-[9px] font-black uppercase ] text-[#a7ada4] mb-4 border-b border-white/5 pb-2">{t('admin_regional_distribution')}</p>
                 <div className="space-y-3">
                    {regions.length > 0 ? regions.map((r, i) => (
                       <div key={i} className={`flex items-center gap-4 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-2 h-2 rounded-xl ${i === 0 ? 'bg-[#91f78e]' : i === 1 ? 'bg-[#2ff801]' : 'bg-[#a7ada4]'} shadow-[0_0_10px_currentColor]`}></div>
                          <span className="text-[10px] font-black uppercase text-[#f9fef5] ">{r.name}</span>
                          <span className="text-[9px] font-black text-[#91f78e] ml-auto">{r.percentage}%</span>
                       </div>
                    )) : <p className="text-[9px] opacity-30">{t('admin_recent_orders_empty')}</p>}
                 </div>
              </div>
           </div>
        </section>

        {/* Region Performance */}
        <section className="col-span-12 lg:col-span-5 bg-[#151b15]/60 backdrop-blur-3xl rounded-[2.5rem] p-12 border border-[#91f78e]/10 shadow-2xl flex flex-col justify-between">
           <div>
              <h3 className="text-2xl font-headline font-black  text-[#91f78e] uppercase mb-10">{t('admin_regional_distribution')}</h3>
              <div className="space-y-8">
                 {regions.length === 0 ? (
                    <div className="py-20 text-center opacity-10 flex flex-col items-center">
                       <span className="material-symbols-outlined text-6xl mb-4">analytics</span>
                       <p className="text-[10px] font-black uppercase ">{t('admin_recent_orders_empty')}</p>
                    </div>
                 ) : (
                    regions.map((reg, i) => (
                       <div key={i} className="space-y-3 group cursor-pointer">
                          <div className={`flex justify-between items-end ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                             <div>
                                <span className="text-[11px] font-black uppercase  text-[#f9fef5] group-hover:text-[#91f78e] transition-colors">{reg.name}</span>
                                <p className="text-[9px] font-bold text-[#a7ada4] uppercase ">{t('admin_col_items')}: {reg.count}</p>
                             </div>
                             <span className="text-sm font-black text-[#91f78e] ">{reg.percentage}%</span>
                          </div>
                          <div className="h-2.5 w-full bg-white/5 rounded-xl overflow-hidden relative p-[1px]">
                             <div 
                                className="h-full bg-gradient-to-r from-[#91f78e] to-[#2ff801] rounded-xl transition-all duration-[1.5s] ease-out shadow-[0_0_15px_rgba(145,247,142,0.6)]" 
                                style={{ width: `${reg.percentage}%` }}
                             />
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>

           <div className="grid grid-cols-2 gap-6 mt-12 pb-2">
              <div className="p-6 rounded-3xl bg-[#0a0f0b]/80 border border-white/5 hover:border-[#91f78e]/30 transition-all text-center">
                 <p className="text-[9px] font-black uppercase text-[#a7ada4] mb-2 ">{t('admin_aggregate_orders')}</p>
                 <p className="text-3xl font-black text-[#91f78e] ">{loading ? '...' : totalOrders.toLocaleString()}</p>
              </div>
              <div className="p-6 rounded-3xl bg-[#0a0f0b]/80 border border-white/5 hover:border-[#2ff801]/30 transition-all text-center">
                 <p className="text-[9px] font-black uppercase text-[#a7ada4] mb-2 ">{t('admin_growth_velocity')}</p>
                 <p className={`text-3xl font-black  ${growthVelocity >= 0 ? 'text-[#2ff801]' : 'text-red-500'}`}>
                    {loading ? '...' : `${growthVelocity > 0 ? '+' : ''}${growthVelocity}%`}
                 </p>
              </div>
           </div>
        </section>
      </div>

      <footer className="mt-20 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30">
         <div className="flex items-center gap-8 text-[10px] font-black uppercase ]">
            <span className="flex items-center gap-3"><div className="w-2 h-2 rounded-xl bg-[#2ff801] shadow-[0_0_8px_#2ff801]"></div> {t('status_healthy')}</span>
            <span className="flex items-center gap-3"><div className="w-2 h-2 rounded-xl bg-[#2ff801]"></div> {t('admin_order_fulfillment_rate')}: {loading ? '...' : `${healthStatus}%`}</span>
         </div>
         <p className="text-[9px] font-black uppercase ] font-headline">{t('admin_since_launch')} 2024 © Naqaa E-commerce Analytics</p>
      </footer>
    </main>
  );
}
