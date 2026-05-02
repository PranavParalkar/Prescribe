import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import { MOCK_PRESCRIPTIONS } from '../data/mockData'
import { useAuth } from '../context/AuthContext'

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{value || '—'}</p>
    </div>
  )
}

export default function PrescriptionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const rx = MOCK_PRESCRIPTIONS.find(p => p.id === id)
  const role = user?.role || 'patient'

  if (!rx) {
    return (
      <DashboardLayout role={role}>
        <div className="flex flex-col items-center justify-center h-80 gap-3 text-slate-400">
          <svg className="w-12 h-12 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
          </svg>
          <p className="font-semibold text-lg">Prescription not found</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role={role}>
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">Prescription #{rx.id}</h1>
            <Badge status={rx.status}/>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">{rx.diagnosis}</p>
        </div>
      </div>

      <div className="max-w-3xl flex flex-col gap-5">

        {/* Patient & Doctor */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">People</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Patient */}
            <div className="flex items-center gap-3 bg-teal-50 rounded-xl p-4">
              <Avatar initials={rx.patientName.split(' ').map(n=>n[0]).join('')} color="teal" size="md"/>
              <div>
                <p className="text-xs text-teal-600 font-medium uppercase tracking-wide">Patient</p>
                <p className="text-sm font-bold text-slate-800">{rx.patientName}</p>
              </div>
            </div>
            {/* Doctor */}
            <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-4">
              <Avatar initials={rx.doctorName.split(' ').filter(n=>n!=='Dr.').map(n=>n[0]).join('')} color="blue" size="md"/>
              <div>
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Doctor</p>
                <p className="text-sm font-bold text-slate-800">{rx.doctorName}</p>
                <p className="text-xs text-slate-400">{rx.specialty}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Dates</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <InfoRow label="Issued" value={rx.date}/>
            <InfoRow label="Expires" value={rx.expiryDate}/>
            <InfoRow label="Follow-up" value={rx.followUp}/>
          </div>
        </div>

        {/* Medicines */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Medicines ({rx.medicines.length})</h2>
          <div className="flex flex-col gap-3">
            {rx.medicines.map((m, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                </div>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <p className="text-xs text-slate-400">Medicine</p>
                    <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Dosage</p>
                    <p className="text-sm font-semibold text-slate-800">{m.dosage}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Frequency</p>
                    <p className="text-sm font-semibold text-slate-800">{m.frequency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Duration</p>
                    <p className="text-sm font-semibold text-slate-800">{m.duration}</p>
                  </div>
                </div>
                {m.instructions && (
                  <div className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg font-medium border border-amber-100 shrink-0">
                    ⚠ {m.instructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {rx.notes && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Doctor's Notes</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{rx.notes}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
