import { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { Activity, TrendingUp, Users, Heart, Weight, Thermometer, Droplets, Plus, Trash2, X } from 'lucide-react'
import { getPatientAnalytics, getVitalRecords, addVitalRecord, deleteVitalRecord } from '../../api/api'

const COLORS = ['#00aaba', '#008a9a', '#4dd4e0', '#006b7a', '#80e3eb', '#b3f1f6', '#1ac5d5', '#00baca']

const CHART_TABS = [
  { id: 'vitals', label: 'Vitals', icon: Heart },
  { id: 'timeline', label: 'Rx Timeline', icon: Activity },
  { id: 'medicines', label: 'Medicines', icon: TrendingUp },
  { id: 'doctors', label: 'Doctors', icon: Users },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs font-bold text-slate-800 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs text-slate-600">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function PatientVitalsChart({ patientId }) {
  const [chartTab, setChartTab] = useState('vitals')
  const [analytics, setAnalytics] = useState(null)
  const [vitals, setVitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showVitalForm, setShowVitalForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [vitalForm, setVitalForm] = useState({
    systolicBp: '', diastolicBp: '', weightKg: '', heartRate: '',
    bloodSugar: '', temperature: '', notes: '', recordedDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (!patientId) return
    setLoading(true)
    Promise.all([
      getPatientAnalytics(patientId).catch(() => null),
      getVitalRecords(patientId).catch(() => []),
    ]).then(([analyticsData, vitalsData]) => {
      setAnalytics(analyticsData)
      setVitals(vitalsData || [])
    }).finally(() => setLoading(false))
  }, [patientId])

  const handleAddVital = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {}
      if (vitalForm.systolicBp) payload.systolicBp = parseInt(vitalForm.systolicBp)
      if (vitalForm.diastolicBp) payload.diastolicBp = parseInt(vitalForm.diastolicBp)
      if (vitalForm.weightKg) payload.weightKg = parseFloat(vitalForm.weightKg)
      if (vitalForm.heartRate) payload.heartRate = parseInt(vitalForm.heartRate)
      if (vitalForm.bloodSugar) payload.bloodSugar = parseFloat(vitalForm.bloodSugar)
      if (vitalForm.temperature) payload.temperature = parseFloat(vitalForm.temperature)
      if (vitalForm.notes) payload.notes = vitalForm.notes
      payload.recordedDate = vitalForm.recordedDate

      const saved = await addVitalRecord(patientId, payload)
      setVitals(prev => [...prev, saved].sort((a, b) => a.recordedDate.localeCompare(b.recordedDate)))
      setShowVitalForm(false)
      setVitalForm({
        systolicBp: '', diastolicBp: '', weightKg: '', heartRate: '',
        bloodSugar: '', temperature: '', notes: '', recordedDate: new Date().toISOString().split('T')[0],
      })
    } catch (err) {
      alert('Failed to save vital record: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVital = async (recordId) => {
    if (!confirm('Delete this vital record?')) return
    try {
      await deleteVitalRecord(patientId, recordId)
      setVitals(prev => prev.filter(v => v.id !== recordId))
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-elev-2 p-8 mb-8 animate-pulse">
        <div className="h-6 w-48 bg-slate-100 rounded-lg mb-4" />
        <div className="h-64 bg-slate-50 rounded-xl" />
      </div>
    )
  }

  const vitalsChartData = vitals.map(v => ({
    date: v.recordedDate,
    systolic: v.systolicBp,
    diastolic: v.diastolicBp,
    weight: v.weightKg,
    heartRate: v.heartRate,
    bloodSugar: v.bloodSugar,
  }))

  const hasBpData = vitals.some(v => v.systolicBp || v.diastolicBp)
  const hasWeightData = vitals.some(v => v.weightKg)

  return (
    <div className="mb-8 space-y-0">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">Analytics</p>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Health Insights</h2>
        </div>
        <button
          onClick={() => setShowVitalForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Record Vitals
        </button>
      </div>

      {/* Chart tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5">
        {CHART_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setChartTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chartTab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ VITALS CHART ═══ */}
      {chartTab === 'vitals' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-elev-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50/50 to-cyan-50/30">
            <h3 className="text-sm font-bold text-slate-800">Vitals Over Time</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Blood pressure, weight, and heart rate trends</p>
          </div>
          {vitals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Heart className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-600">No vitals recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Click "Record Vitals" to start tracking</p>
            </div>
          ) : (
            <div className="p-5 space-y-6">
              {/* BP Chart */}
              {hasBpData && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-teal-500" />Blood Pressure (mmHg)
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={vitalsChartData}>
                      <defs>
                        <linearGradient id="systolicGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00aaba" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00aaba" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="diastolicGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4dd4e0" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4dd4e0" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="systolic" name="Systolic" stroke="#00aaba" fill="url(#systolicGrad)" strokeWidth={2.5} dot={{ r: 4, fill: '#00aaba', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                      <Area type="monotone" dataKey="diastolic" name="Diastolic" stroke="#4dd4e0" fill="url(#diastolicGrad)" strokeWidth={2.5} dot={{ r: 4, fill: '#4dd4e0', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Weight Chart */}
              {hasWeightData && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Weight className="w-3.5 h-3.5 text-teal-500" />Weight (kg)
                  </p>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={vitalsChartData}>
                      <defs>
                        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#008a9a" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#008a9a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="weight" name="Weight" stroke="#008a9a" fill="url(#weightGrad)" strokeWidth={2.5} dot={{ r: 4, fill: '#008a9a', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recent readings table */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Readings</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">BP</th>
                        <th className="py-2 pr-4">Weight</th>
                        <th className="py-2 pr-4">HR</th>
                        <th className="py-2 pr-4">Sugar</th>
                        <th className="py-2 pr-4">Temp</th>
                        <th className="py-2 pr-4">Notes</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[...vitals].reverse().slice(0, 10).map(v => (
                        <tr key={v.id} className="text-xs text-slate-600 hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 pr-4 font-medium text-slate-700">{v.recordedDate}</td>
                          <td className="py-2.5 pr-4">{v.systolicBp && v.diastolicBp ? `${v.systolicBp}/${v.diastolicBp}` : '—'}</td>
                          <td className="py-2.5 pr-4">{v.weightKg ? `${v.weightKg} kg` : '—'}</td>
                          <td className="py-2.5 pr-4">{v.heartRate ? `${v.heartRate} bpm` : '—'}</td>
                          <td className="py-2.5 pr-4">{v.bloodSugar ? `${v.bloodSugar} mg/dL` : '—'}</td>
                          <td className="py-2.5 pr-4">{v.temperature ? `${v.temperature}°C` : '—'}</td>
                          <td className="py-2.5 pr-4 max-w-[120px] truncate">{v.notes || '—'}</td>
                          <td className="py-2.5">
                            <button onClick={() => handleDeleteVital(v.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ PRESCRIPTION TIMELINE ═══ */}
      {chartTab === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-elev-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50/50 to-cyan-50/30">
            <h3 className="text-sm font-bold text-slate-800">Prescription Timeline</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Number of medicines per prescription over time</p>
          </div>
          {!analytics?.prescriptionTimeline?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Activity className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-600">No prescription data yet</p>
            </div>
          ) : (
            <div className="p-5">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={analytics.prescriptionTimeline}>
                  <defs>
                    <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00aaba" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00aaba" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
                        <p className="text-xs font-bold text-slate-800">{d.date}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{d.diagnosis}</p>
                        <p className="text-[11px] text-slate-500">{d.doctorName}</p>
                        <p className="text-xs font-bold text-teal-600 mt-1">{d.medicineCount} medicine(s)</p>
                      </div>
                    )
                  }} />
                  <Area type="monotone" dataKey="medicineCount" name="Medicines" stroke="#00aaba" fill="url(#rxGrad)" strokeWidth={2.5}
                    dot={{ r: 5, fill: '#00aaba', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ═══ MEDICINE FREQUENCY ═══ */}
      {chartTab === 'medicines' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-elev-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50/50 to-cyan-50/30">
            <h3 className="text-sm font-bold text-slate-800">Most Prescribed Medicines</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Frequency of medicines across all prescriptions</p>
          </div>
          {!analytics?.medicineFrequency?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <TrendingUp className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-600">No medicine data yet</p>
            </div>
          ) : (
            <div className="p-5">
              <ResponsiveContainer width="100%" height={Math.max(200, analytics.medicineFrequency.length * 44)}>
                <BarChart data={analytics.medicineFrequency} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="medicineName" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Times Prescribed" radius={[0, 6, 6, 0]} barSize={24}>
                    {analytics.medicineFrequency.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ═══ DOCTOR DISTRIBUTION ═══ */}
      {chartTab === 'doctors' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-elev-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50/50 to-cyan-50/30">
            <h3 className="text-sm font-bold text-slate-800">Doctor Distribution</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Prescriptions per consulting doctor</p>
          </div>
          {!analytics?.doctorDistribution?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Users className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-600">No doctor data yet</p>
            </div>
          ) : (
            <div className="p-5 flex flex-col lg:flex-row items-center gap-8">
              <div className="w-full lg:w-1/2">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={analytics.doctorDistribution}
                      dataKey="prescriptionCount"
                      nameKey="doctorName"
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={100}
                      paddingAngle={3}
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      {analytics.doctorDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
                          <p className="text-xs font-bold text-slate-800">{d.doctorName}</p>
                          {d.specialty && <p className="text-[11px] text-slate-400">{d.specialty}</p>}
                          <p className="text-xs font-bold text-teal-600 mt-1">{d.prescriptionCount} prescription(s)</p>
                        </div>
                      )
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full lg:w-1/2 space-y-2">
                {analytics.doctorDistribution.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-700 truncate">{d.doctorName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{d.specialty || 'General'}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{d.prescriptionCount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ VITAL FORM MODAL ═══ */}
      {showVitalForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto animate-[scaleIn_0.2s_ease-out]">
            <form onSubmit={handleAddVital}>
              <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-teal-50 to-cyan-50/30 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Record Vitals</h3>
                  <p className="text-sm text-slate-500 mt-1">Add your latest health measurements</p>
                </div>
                <button type="button" onClick={() => setShowVitalForm(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date *</label>
                  <input type="date" required value={vitalForm.recordedDate} onChange={e => setVitalForm(p => ({ ...p, recordedDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm" />
                </div>

                {/* BP */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-teal-500" /> Blood Pressure
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Systolic (e.g. 120)" value={vitalForm.systolicBp} onChange={e => setVitalForm(p => ({ ...p, systolicBp: e.target.value }))}
                      className="px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm" />
                    <input type="number" placeholder="Diastolic (e.g. 80)" value={vitalForm.diastolicBp} onChange={e => setVitalForm(p => ({ ...p, diastolicBp: e.target.value }))}
                      className="px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm" />
                  </div>
                </div>

                {/* Weight & HR */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Weight className="w-4 h-4 text-teal-500" /> Weight (kg)
                    </label>
                    <input type="number" step="0.1" placeholder="e.g. 72.5" value={vitalForm.weightKg} onChange={e => setVitalForm(p => ({ ...p, weightKg: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-teal-500" /> Heart Rate (bpm)
                    </label>
                    <input type="number" placeholder="e.g. 72" value={vitalForm.heartRate} onChange={e => setVitalForm(p => ({ ...p, heartRate: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm" />
                  </div>
                </div>

                {/* Sugar & Temp */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Blood Sugar (mg/dL)</label>
                    <input type="number" step="0.1" placeholder="e.g. 95" value={vitalForm.bloodSugar} onChange={e => setVitalForm(p => ({ ...p, bloodSugar: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-teal-500" /> Temperature (°C)
                    </label>
                    <input type="number" step="0.1" placeholder="e.g. 36.6" value={vitalForm.temperature} onChange={e => setVitalForm(p => ({ ...p, temperature: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm" />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Notes</label>
                  <textarea rows={2} placeholder="e.g. Taken after morning walk" value={vitalForm.notes} onChange={e => setVitalForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm resize-none" />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button type="button" onClick={() => setShowVitalForm(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer">
                  {saving ? 'Saving…' : 'Save Vitals'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
