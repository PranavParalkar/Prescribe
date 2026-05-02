import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, ArrowRight } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import { getDoctorByEmail, getPrescriptionsByDoctor } from '../api/api'
import { useAuth } from '../context/AuthContext'

/** Normalise a backend Prescription entity into the shape the UI expects. */
function normaliseRx(rx) {
  const patient = rx.patient || {}
  const doctor  = rx.doctor  || {}
  const v = rx.currentVersion || {}
  return {
    id:          rx.id,
    patientId:   patient.id || patient.patientId || '',
    patientName: `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() || 'Patient',
    doctorId:    doctor.id || doctor.doctorId || '',
    doctorName:  `Dr. ${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim(),
    specialty:   doctor.specialization || '',
    date:        rx.createdAt ? rx.createdAt.split('T')[0] : '',
    status:      rx.status ? rx.status.charAt(0) + rx.status.slice(1).toLowerCase() : 'Active',
    diagnosis:   v.diagnosis || rx.diagnosis || '',
    notes:       v.notes || rx.notes || '',
    medicines:   ((v.medicines || rx.medicines) || []).map(m => ({
      name:         m.medicineName || m.name || '',
      dosage:       m.dosage       || '',
      frequency:    m.frequency    || '',
      duration:     m.duration     || '',
      instructions: m.instructions || '',
    })),
  }
}

export default function PrescriptionsList() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        let doctorId = user?.entityId
        if (!doctorId && user?.email) {
          const doc = await getDoctorByEmail(user.email)
          doctorId = doc?.doctorId
        }
        if (!doctorId) throw new Error('Doctor profile ID not found. Please log in again.')

        const data = await getPrescriptionsByDoctor(doctorId)
        if (!cancelled) setPrescriptions((data || []).map(normaliseRx))
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [user?.entityId, user?.email])

  const filtered = prescriptions.filter(rx => {
    const q = search.toLowerCase()
    const matchSearch = !q || rx.patientName.toLowerCase().includes(q) || rx.diagnosis.toLowerCase().includes(q) || rx.medicines.some(m => m.name.toLowerCase().includes(q))
    return matchSearch && (statusFilter === 'All' || rx.status === statusFilter)
  })

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5">Doctor Portal</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">All Prescriptions</h1>
          <p className="text-sm text-slate-400 mt-1">Complete prescription history</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-elev-2 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Records</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {loading ? 'Loading…' : `${filtered.length} prescription${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" strokeWidth={2}/>
              <input
                type="text"
                placeholder="Search patients, diagnoses…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8.5 pr-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 w-full sm:w-52 bg-surface-1 transition-all text-slate-700 placeholder-slate-400"
              />
            </div>
            <div className="relative flex items-center w-full sm:w-auto">
              <SlidersHorizontal className="absolute left-2.5 w-3 h-3 text-slate-400 pointer-events-none" strokeWidth={2}/>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-7 pr-7 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-teal-500 bg-surface-1 text-slate-600 cursor-pointer hover:border-slate-300 transition-colors w-full"
              >
                {['All', 'Active', 'Revoked'].map(s => <option key={s}>{s}</option>)}
              </select>
              <svg className="absolute right-2 w-3 h-3 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-1 border-b border-slate-100">
                {[
                  { key: 'Patient',    w: '', hide: '' },
                  { key: 'Diagnosis',  w: '', hide: 'hidden md:table-cell' },
                  { key: 'Medicines',  w: '', hide: 'hidden lg:table-cell' },
                  { key: 'Date',       w: 'w-28', hide: 'hidden sm:table-cell' },
                  { key: 'Status',     w: 'w-28', hide: '' },
                  { key: '',           w: 'w-16', hide: '' },
                ].map(({ key, w, hide }) => (
                  <th key={key} className={`px-4 sm:px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] whitespace-nowrap ${w} ${hide}`}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-medium">Loading prescriptions…</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-slate-200" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
                      <p className="text-sm font-medium">No prescriptions found</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(rx => (
                <tr key={rx.id} className="group hover:bg-slate-50/70 transition-colors duration-100">
                  <td className="px-4 sm:px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={rx.patientName.split(' ').map(n => n[0]).join('')} color="teal" size="sm"/>
                      <span className="text-sm font-semibold text-slate-800 whitespace-nowrap truncate max-w-[120px] sm:max-w-none">{rx.patientName}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-5 py-4 text-sm text-slate-600 max-w-[180px] truncate hidden md:table-cell">{rx.diagnosis}</td>
                  <td className="px-4 sm:px-5 py-4 text-xs text-slate-400 max-w-[200px] truncate hidden lg:table-cell">{rx.medicines.map(m => m.name).join(', ')}</td>
                  <td className="px-4 sm:px-5 py-4 text-xs font-medium text-slate-400 whitespace-nowrap hidden sm:table-cell">{rx.date}</td>
                  <td className="px-4 sm:px-5 py-4"><Badge status={rx.status}/></td>
                  <td className="px-4 sm:px-5 py-4">
                    <Link
                      to={`/prescription/${rx.id}`}
                      state={{ rx }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-teal-600 group-hover:text-teal-600 transition-colors duration-150"
                    >
                      <span className="hidden sm:inline">View</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-150"/>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
