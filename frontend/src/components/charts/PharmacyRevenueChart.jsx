import { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ComposedChart, Line,
} from 'recharts'
import { TrendingUp, IndianRupee, ShoppingBag, BarChart3 } from 'lucide-react'
import { getMedicalAnalytics } from '../../api/api'

const COLORS = ['#00aaba', '#008a9a', '#4dd4e0', '#006b7a', '#80e3eb', '#b3f1f6', '#1ac5d5', '#00baca', '#007a8a', '#d9f8fb']

const SUB_TABS = [
  { id: 'revenue', label: 'Revenue Trend', icon: TrendingUp },
  { id: 'medicines', label: 'Top Sellers', icon: BarChart3 },
]

export default function PharmacyRevenueChart() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subTab, setSubTab] = useState('revenue')

  useEffect(() => {
    getMedicalAnalytics()
      .then(data => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-slate-100 rounded-xl" />
        <div className="h-64 bg-slate-50 rounded-xl" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-elev-2 p-16 text-center">
        <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">No Analytics Data</h3>
        <p className="text-sm text-slate-500">Complete some orders to see your analytics.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-5 text-white shadow-lg shadow-teal-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Total Revenue</p>
          </div>
          <p className="text-2xl font-black">₹{analytics.totalRevenue?.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-5 text-white shadow-lg shadow-slate-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Total Orders</p>
          </div>
          <p className="text-2xl font-black">{analytics.totalOrders}</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg shadow-cyan-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Avg Order Value</p>
          </div>
          <p className="text-2xl font-black">₹{analytics.averageOrderValue?.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* ── Chart sub-tabs ── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ WEEKLY REVENUE CHART ═══ */}
      {subTab === 'revenue' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-elev-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50/50 to-cyan-50/30">
            <h3 className="text-sm font-bold text-slate-800">Weekly Revenue</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Revenue and order count over the last 12 weeks</p>
          </div>
          {!analytics.weeklyRevenue?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <TrendingUp className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-600">No revenue data yet</p>
              <p className="text-xs text-slate-400 mt-1">Complete orders to see trends</p>
            </div>
          ) : (
            <div className="p-5">
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={analytics.weeklyRevenue}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00aaba" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00aaba" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    yAxisId="revenue"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
                        <p className="text-xs font-bold text-slate-800 mb-1">{label}</p>
                        <p className="text-xs text-teal-600 font-bold">₹{payload[0]?.value?.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-slate-500">{payload[1]?.value} order(s)</p>
                      </div>
                    )
                  }} />
                  <Area yAxisId="revenue" type="monotone" dataKey="revenue" name="Revenue" stroke="#00aaba" fill="url(#revenueGrad)" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#00aaba', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  <Line yAxisId="orders" type="monotone" dataKey="orderCount" name="Orders" stroke="#006b7a" strokeWidth={2}
                    dot={{ r: 3, fill: '#006b7a', strokeWidth: 2, stroke: '#fff' }} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ═══ TOP SELLING MEDICINES ═══ */}
      {subTab === 'medicines' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-elev-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50/50 to-cyan-50/30">
            <h3 className="text-sm font-bold text-slate-800">Top Selling Medicines</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Most sold medicines by quantity</p>
          </div>
          {!analytics.topSellingMedicines?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <BarChart3 className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-600">No sales data yet</p>
            </div>
          ) : (
            <div className="p-5">
              <ResponsiveContainer width="100%" height={Math.max(240, analytics.topSellingMedicines.length * 48)}>
                <BarChart data={analytics.topSellingMedicines} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="medicineName" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={140} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
                        <p className="text-xs font-bold text-slate-800">{d.medicineName}</p>
                        <p className="text-xs text-teal-600 font-bold mt-0.5">Qty: {d.quantitySold}</p>
                        <p className="text-xs text-slate-500">Revenue: ₹{d.revenue?.toLocaleString('en-IN')}</p>
                      </div>
                    )
                  }} />
                  <Bar dataKey="quantitySold" name="Quantity Sold" radius={[0, 8, 8, 0]} barSize={28}>
                    {analytics.topSellingMedicines.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Revenue breakdown list */}
              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Revenue Breakdown</p>
                <div className="space-y-2">
                  {analytics.topSellingMedicines.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{m.medicineName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-slate-800">₹{m.revenue?.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-slate-400">{m.quantitySold} units</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
