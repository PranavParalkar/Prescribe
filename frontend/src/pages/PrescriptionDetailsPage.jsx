import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, Calendar, RefreshCw, Activity } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import { api } from '../api/api'

export default function PrescriptionDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [showForwardModal, setShowForwardModal] = useState(false)
  const [medicalId, setMedicalId] = useState('')

  // Prescription is passed via route state from PatientDashboard list.
  // The rx object is already normalised by PatientDashboard's normaliseRx().
  const rx = location.state?.rx

  if (!rx) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
          <p className="text-lg font-semibold text-slate-600">Prescription not found</p>
          <button onClick={() => navigate('/dashboard')} className="text-sm font-semibold text-teal-600 hover:underline">
            Back to dashboard
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex items-start gap-3 mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 shadow-elev-1 transition-all shrink-0 mt-0.5 active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2}/>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5">Prescription Record</p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none break-all">
            #{String(rx.id).slice(0, 8).toUpperCase()}
              </h1>
              <Badge status={rx.status}/>
            </div>
            <button
              onClick={() => setShowForwardModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-all self-start sm:self-auto"
            >
              Forward to Pharmacy
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-1.5 break-words">{rx.diagnosis}</p>
        </div>
      </div>

      {/* ── Two-column responsive grid ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ════════════════════════════════════════════════════
            LEFT — Medication timeline (2/3)
        ════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Medications */}
          <section className="bg-white rounded-xl border border-slate-100 shadow-elev-2 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-surface-1 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.12em]">
                Medications
              </h2>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                {rx.medicines.length} {rx.medicines.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Timeline-style list */}
            <div className="relative px-4 sm:px-6 py-5">
              {/* Vertical timeline line */}
              {rx.medicines.length > 1 && (
                <div className="absolute left-[2.35rem] sm:left-[2.35rem] top-8 bottom-8 w-px bg-slate-100 hidden sm:block" />
              )}

              <div className="flex flex-col gap-5">
                {rx.medicines.map((m, i) => (
                  <div key={i} className="flex gap-4 group">
                    {/* Timeline dot / number */}
                    <div className="relative z-10 flex flex-col items-center shrink-0">
                      <div className="w-7 h-7 rounded-full bg-navy-700 border-2 border-white shadow-elev-1 flex items-center justify-center text-[10px] font-bold text-white">
                        {i + 1}
                      </div>
                    </div>

                    {/* Medicine card */}
                    <div className="flex-1 bg-surface-1 border border-slate-100 rounded-xl p-3 sm:p-4 group-hover:border-slate-200 group-hover:shadow-elev-1 transition-all duration-150">
                      {/* Medicine name row */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{m.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{m.dosage}</p>
                        </div>
                        {m.instructions && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-md font-semibold shrink-0">
                            {m.instructions}
                          </span>
                        )}
                      </div>

                      {/* Detail grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                        {[['Dosage', m.dosage], ['Frequency', m.frequency], ['Duration', m.duration]].map(([lbl, val]) => (
                          <div key={lbl}>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1">{lbl}</p>
                            <p className="text-xs font-semibold text-slate-800">{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Doctor notes — highlighted block */}
          {rx.notes && (
            <section className="bg-white rounded-xl border border-slate-100 shadow-elev-2 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-surface-1">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.12em]">Clinical Notes</h2>
              </div>
              <div className="px-4 sm:px-6 py-5">
                <div className="border-l-2 border-teal-400 pl-4 bg-teal-50/40 rounded-r-lg py-3 pr-4">
                  <p className="text-sm text-slate-700 leading-relaxed break-words">{rx.notes}</p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* ════════════════════════════════════════════════════
            RIGHT — Metadata card stack (1/3)
        ════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-4">

          {/* Status panel */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-elev-2 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-surface-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em]">Status</p>
            </div>
            <div className="px-4 py-4 flex items-center justify-between">
              <Badge status={rx.status}/>
              <span className="text-[11px] text-slate-400 font-medium">
                {rx.status === 'Active' ? 'Currently valid' : rx.status === 'Expired' ? 'No longer valid' : 'Awaiting approval'}
              </span>
            </div>
          </div>

          {/* Patient */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-elev-2 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-surface-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em]">Patient</p>
            </div>
            <div className="px-4 py-4 flex items-center gap-3">
              <Avatar initials={rx.patientName.split(' ').map(n => n[0]).join('')} color="teal" size="md"/>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">{rx.patientName}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">ID: {rx.patientId}</p>
              </div>
            </div>
          </div>

          {/* Doctor */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-elev-2 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-surface-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em]">Prescribing Doctor</p>
            </div>
            <div className="px-4 py-4 flex items-center gap-3">
              <Avatar initials={rx.doctorName.split(' ').filter(n => n !== 'Dr.').map(n => n[0]).join('')} color="navy" size="md"/>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">{rx.doctorName}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{rx.specialty}</p>
              </div>
            </div>
          </div>

          {/* Dates — clean info grid */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-elev-2 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-surface-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em]">Timeline</p>
            </div>
            <div className="px-4 py-4 flex flex-col divide-y divide-slate-50">
              {[
                { icon: Calendar,   label: 'Issued',    val: rx.date },
                { icon: Activity,   label: 'Expires',   val: rx.expiryDate },
                { icon: RefreshCw,  label: 'Follow-up', val: rx.followUp },
              ].map(({ icon: Icon, label, val }) => val && (
                <div key={label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75}/>
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Forward Modal */}
      {showForwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <form onSubmit={async (e) => {
              e.preventDefault()
              try {
                await api.post('/api/medicals/orders/forward', {
                  prescriptionId: rx.id,
                  medicalId: medicalId
                })
                setShowForwardModal(false)
                alert('Prescription forwarded successfully!')
              } catch (err) {
                console.error(err)
                alert('Failed to forward prescription. Make sure the Medical ID is valid.')
              }
            }}>
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Forward to Medical Store</h3>
                <p className="text-sm text-slate-500">Enter the UUID of the verified Medical Store.</p>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Medical Store ID</label>
                <input
                  type="text"
                  required
                  value={medicalId}
                  onChange={(e) => setMedicalId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                />
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowForwardModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Forward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}
