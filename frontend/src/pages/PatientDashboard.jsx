import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, ArrowRight, Lock, Crown, ShieldAlert, Clock, Copy, CheckCircle2, QrCode, X } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import DashboardLayout from '../components/layout/DashboardLayout'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import StatCard from '../components/ui/StatCard'
import SubscriptionBanner from '../components/ui/SubscriptionBanner'
import PatientVitalsChart from '../components/charts/PatientVitalsChart'
import MedicationReminders from '../components/ui/MedicationReminders'
import { getPrescriptionsByPatient, getSubscriptionStatus, getPendingOtp } from '../api/api'
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

export default function PatientDashboard() {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [search, setSearch]               = useState('')
  const [hasFullAccess, setHasFullAccess] = useState(true)
  const [freeLimit, setFreeLimit]         = useState(3)
  const [currentLimit, setCurrentLimit]   = useState(3)
  const [limitReached, setLimitReached]   = useState(false)
  const [subStatus, setSubStatus]         = useState(null)

  // OTP notification state
  const [pendingOtp, setPendingOtp]           = useState(null)
  const [otpTimeLeft, setOtpTimeLeft]         = useState(0)
  const [otpCopied, setOtpCopied]             = useState(false)
  const [showQR, setShowQR]                   = useState(false)

  useEffect(() => {
    // entityId is the patient UUID stored after registration
    const patientId = user?.entityId
    if (!patientId) {
      setError('Patient profile ID not found. Please log in again.')
      setLoading(false)
      return
    }

    // Fetch prescriptions and subscription status in parallel
    Promise.all([
      getPrescriptionsByPatient(patientId),
      getSubscriptionStatus(patientId).catch(() => null),
    ])
      .then(([rxData, subData]) => {
        // Handle new response format with subscription metadata
        if (rxData && rxData.prescriptions) {
          setPrescriptions((rxData.prescriptions || []).map(normaliseRx))
          setHasFullAccess(rxData.hasFullAccess ?? true)
          setFreeLimit(rxData.freeLimit ?? 3)
          setCurrentLimit(rxData.currentLimit ?? rxData.freeLimit ?? 3)
          setLimitReached(rxData.limitReached ?? false)
        } else {
          // Fallback for old response format (array)
          setPrescriptions((rxData || []).map(normaliseRx))
        }
        if (subData) setSubStatus(subData)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user?.entityId])

  // ── Poll for pending OTP every 10 seconds ──────────────────────
  useEffect(() => {
    const patientId = user?.entityId
    if (!patientId) return

    const poll = () => {
      getPendingOtp(patientId)
        .then(data => {
          if (data?.hasPendingOtp) {
            setPendingOtp(data)
          } else {
            setPendingOtp(null)
          }
        })
        .catch(() => {})
    }

    poll() // initial check
    const interval = setInterval(poll, 10_000)
    return () => clearInterval(interval)
  }, [user?.entityId])

  // ── OTP countdown timer ──────────────────────────────────────
  useEffect(() => {
    if (!pendingOtp?.expiresAt) { setOtpTimeLeft(0); return }
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(pendingOtp.expiresAt) - Date.now()) / 1000))
      setOtpTimeLeft(diff)
      if (diff <= 0) setPendingOtp(null)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [pendingOtp?.expiresAt])

  const copyOtp = () => {
    if (pendingOtp?.otp) {
      navigator.clipboard.writeText(pendingOtp.otp).then(() => {
        setOtpCopied(true)
        setTimeout(() => setOtpCopied(false), 2000)
      }).catch(() => {})
    }
  }

  const activeRx    = prescriptions.filter(rx => rx.status === 'Active')
  const doctorSet   = new Set(prescriptions.map(rx => rx.doctorId))

  const filtered = !search
    ? prescriptions
    : prescriptions.filter(rx =>
        rx.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
        rx.doctorName.toLowerCase().includes(search.toLowerCase())
      )

  return (
    <DashboardLayout>
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5">Patient Portal</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Prescriptions</h1>
          <p className="text-sm text-slate-400 mt-1">
            Hello, <span className="text-slate-600 font-semibold">{user?.name}</span>
            {user?.entityId && <span className="ml-2 text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">ID: {user.entityId}</span>}
          </p>
        </div>
        {user?.entityId && (
          <button
            onClick={() => setShowQR(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-navy-700 hover:bg-navy-800 shadow-elev-1 transition-all active:scale-95 w-full sm:w-auto"
          >
            <QrCode className="w-4 h-4" />
            Show My QR Code
          </button>
        )}
      </div>

      {/* ── Subscription Banner (only for free-tier users) ──── */}
      {!loading && !subStatus?.subscribed && (
        <SubscriptionBanner
          totalPrescriptions={prescriptions.length}
          freeLimit={freeLimit}
        />
      )}

      {/* ── OTP Notification Banner ───────────────────────────── */}
      {pendingOtp && otpTimeLeft > 0 && (
        <div className="mb-6 bg-gradient-to-r from-navy-50 via-white to-teal-50 border border-navy-200/50 rounded-2xl shadow-elev-2 overflow-hidden animate-[fadeIn_0.3s_ease-out]">
          <div className="h-1 bg-gradient-to-r from-navy-500 to-teal-500" />
          <div className="px-5 py-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-600 to-teal-500 flex items-center justify-center shadow-lg shadow-navy-200/40 shrink-0">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-slate-800">Access Request</p>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                    ${otpTimeLeft <= 30 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    {String(Math.floor(otpTimeLeft / 60)).padStart(2, '0')}:{String(otpTimeLeft % 60).padStart(2, '0')}
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{pendingOtp.doctorName}</span>
                  {pendingOtp.specialization && <span className="text-slate-400"> ({pendingOtp.specialization})</span>}
                  {' '}is requesting access to your medical records
                </p>

                {/* OTP Display */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {pendingOtp.otp.split('').map((digit, i) => (
                      <span key={i} className="w-9 h-11 flex items-center justify-center bg-white border-2 border-navy-200 rounded-lg text-lg font-bold text-navy-800 shadow-sm">
                        {digit}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={copyOtp}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-navy-600
                      bg-navy-50 hover:bg-navy-100 border border-navy-200/60 rounded-lg transition-all cursor-pointer"
                  >
                    {otpCopied ? (
                      <><CheckCircle2 className="w-3 h-3 text-teal-500" />Copied!</>
                    ) : (
                      <><Copy className="w-3 h-3" />Copy</>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Share this code with your doctor for verification</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Error banner ─────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* ── Loading skeletons ───────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-pulse">
          {[0,1,2].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl"/>
          ))}
        </div>
      ) : (
        <>
          {/* ── Metric panels ─────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Prescriptions" value={`${prescriptions.length} / ${currentLimit}`} color="navy" meta={limitReached ? 'Limit reached' : 'All records'}
              icon={<svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>}
            />
            <StatCard label="Active" value={activeRx.length} color="teal" meta="Currently valid"
              icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            />
            <StatCard label="Consulting Doctors" value={doctorSet.size} color="violet" meta="Unique specialists"
              icon={<svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>}
            />
            <StatCard
              label="Plan"
              value={subStatus?.subscribed ? 'Pro' : 'Free'}
              color={subStatus?.subscribed ? 'teal' : 'navy'}
              meta={subStatus?.subscribed ? `${subStatus.daysRemaining}d remaining · ${currentLimit} max` : `${Math.max(0, freeLimit - prescriptions.length)} free left`}
              icon={<Crown className="w-4.5 h-4.5" />}
            />
          </div>

          {/* ── Health Insights Charts & Reminders ──────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <PatientVitalsChart patientId={user?.entityId} />
            </div>
            <div className="lg:col-span-1 h-full">
              <MedicationReminders patientId={user?.entityId} />
            </div>
          </div>

          {/* ── Prescriptions list ─────────────────────────────── */}
          {prescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-xl border border-slate-100 shadow-elev-1">
              <svg className="w-10 h-10 mb-3 text-slate-200" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
              <p className="font-semibold text-slate-600 text-sm">No prescriptions yet</p>
              <p className="text-xs mt-1 text-slate-400">Your doctor will add prescriptions here</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 shadow-elev-2 overflow-hidden">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Records</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{filtered.length} prescription{filtered.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" strokeWidth={2}/>
                  <input
                    type="text"
                    placeholder="Search diagnoses…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8.5 pr-3.5 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 w-full sm:w-48 bg-surface-1 transition-all text-slate-700 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-surface-1 border-b border-slate-100">
                      {['Prescription', 'Doctor', 'Medications', 'Date', 'Status', ''].map((h, idx) => (
                        <th key={h || idx} className={`px-4 sm:px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] whitespace-nowrap ${
                          idx === 2 ? 'hidden lg:table-cell' : idx === 3 ? 'hidden sm:table-cell' : ''
                        }`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((rx, idx) => {
                      const isLocked = !hasFullAccess && idx >= freeLimit
                      return (
                        <tr key={rx.id} className={`group transition-colors duration-100 ${isLocked ? 'opacity-60' : 'hover:bg-slate-50/70'}`}>
                          <td className="px-4 sm:px-5 py-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">#{String(rx.id).slice(0,8).toUpperCase()}</p>
                            <p className="text-sm font-semibold text-slate-800 max-w-[160px] truncate">
                              {isLocked ? '••••••••' : rx.diagnosis}
                            </p>
                          </td>
                          <td className="px-4 sm:px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Avatar initials={rx.doctorName.split(' ').filter(n => n !== 'Dr.').map(n => n[0]).join('')} color="navy" size="sm"/>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-700 whitespace-nowrap truncate">{rx.doctorName}</p>
                                <p className="text-[11px] text-slate-400 truncate">{rx.specialty}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-5 py-4 text-xs text-slate-400 max-w-[180px] truncate hidden lg:table-cell">
                            {isLocked ? '••••••••' : (rx.medicines.map(m => m.name).join(', ') || '—')}
                          </td>
                          <td className="px-4 sm:px-5 py-4 text-xs font-medium text-slate-400 whitespace-nowrap hidden sm:table-cell">{rx.date}</td>
                          <td className="px-4 sm:px-5 py-4"><Badge status={rx.status}/></td>
                          <td className="px-4 sm:px-5 py-4">
                            {isLocked ? (
                              <Link
                                to="/subscription"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-600 transition-colors duration-150"
                              >
                                <Lock className="w-3 h-3" />
                                <span className="hidden sm:inline">Unlock</span>
                              </Link>
                            ) : (
                              <Link
                                to={`/prescription/${rx.id}`}
                                state={{ rx }}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-teal-600 group-hover:text-teal-600 transition-colors duration-150"
                              >
                                <span className="hidden sm:inline">View</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-150"/>
                              </Link>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── QR Code Modal ───────────────────────────────────── */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-[scaleIn_0.2s_ease-out] transform transition-all">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">My Profile QR</h3>
              <button
                onClick={() => setShowQR(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center">
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm mb-6">
                <QRCodeCanvas
                  value={JSON.stringify({ type: 'PATIENT_PROFILE', patientId: user.entityId })}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-sm font-medium text-slate-700 text-center mb-1">
                Share this with your doctor
              </p>
              <p className="text-xs text-slate-500 text-center max-w-[240px]">
                Scan this code at the clinic to instantly share your profile and request access.
              </p>
            </div>
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowQR(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
