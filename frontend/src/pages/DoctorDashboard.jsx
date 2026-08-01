import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, QrCode, X, CheckCircle2 } from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner'
import DashboardLayout from '../components/layout/DashboardLayout'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import { getDoctorByEmail, getPrescriptionsByDoctor, requestAccessOtp } from '../api/api'
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

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [rxError, setRxError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [doctorProfile, setDoctorProfile] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadRx = async () => {
      try {
        let doctorId = user?.entityId
        let doc = null
        if (user?.email) {
          doc = await getDoctorByEmail(user.email)
          doctorId = doc?.doctorId
          setDoctorProfile(doc)
        }
        if (!doctorId) throw new Error('Doctor profile ID not found. Please log in again.')

        // Only fetch prescriptions if verified
        if (doc?.status === 'VERIFIED') {
          const data = await getPrescriptionsByDoctor(doctorId)
          if (!cancelled) setPrescriptions((data || []).map(normaliseRx))
        }
      } catch (err) {
        if (!cancelled) setRxError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadRx()

    return () => { cancelled = true }
  }, [user?.entityId, user?.email])

  const isVerified = doctorProfile?.status === 'VERIFIED'
  const activeRx  = prescriptions.filter(rx => rx.status === 'Active')
  const patientSet = new Set(prescriptions.map(rx => rx.patientId))
  const recent = prescriptions
    .slice()
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 5)

  // Block all features for unverified doctors
  if (!loading && doctorProfile && !isVerified) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Pending Verification</h2>
          <p className="text-sm text-slate-500 max-w-md mb-2">
            Your account is currently <span className="font-bold text-amber-600">{doctorProfile.status.toLowerCase()}</span>.
          </p>
          <p className="text-sm text-slate-400 max-w-md mb-8">
            You cannot access any dashboard features until an administrator has reviewed and approved your medical license. Please ensure you have uploaded your license document.
          </p>
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-navy-700 hover:bg-navy-800 shadow-elev-1 transition-all active:scale-95"
          >
            Go to Profile Settings
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back, <span className="text-slate-600 font-semibold">{user?.name}</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {doctorProfile?.status === 'VERIFIED' && (
            <button
              onClick={() => {
                setShowScanner(true)
                setScanSuccess(false)
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 shadow-sm transition-all active:scale-95 w-full sm:w-auto cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              Scan Patient QR
            </button>
          )}
          
          <Link
            to={doctorProfile?.status === 'VERIFIED' ? "/new-rx" : "#"}
            onClick={(e) => {
              if (doctorProfile?.status !== 'VERIFIED') {
                e.preventDefault();
                alert("You must be verified by an admin to issue prescriptions.");
              }
            }}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white shadow-elev-1 transition-all duration-150 w-full sm:w-auto ${
              doctorProfile?.status === 'VERIFIED' 
                ? 'bg-navy-700 hover:bg-navy-800 hover:shadow-elev-2 active:scale-95' 
                : 'bg-slate-400 cursor-not-allowed opacity-75'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            New Prescription
          </Link>
        </div>
      </div>

      {doctorProfile && doctorProfile.status !== 'VERIFIED' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-5 py-4 mb-8 flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="text-sm font-bold">Account Pending Verification</h3>
            <p className="text-sm mt-1">
              Your account is currently {doctorProfile.status.toLowerCase()}. You cannot issue prescriptions until an administrator has reviewed and approved your medical license.
            </p>
          </div>
        </div>
      )}

      {/* ── Metric panels ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="My Patients"
          value={loading ? '—' : patientSet.size}
          color="navy"
          meta="Unique patients treated"
          icon={<svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>}
        />
        <StatCard
          label="Active Prescriptions"
          value={loading ? '—' : activeRx.length}
          color="teal"
          meta="Currently active"
          icon={<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
        <StatCard
          label="Total Prescriptions"
          value={loading ? '—' : prescriptions.length}
          color="violet"
          meta={loading ? 'Loading…' : `${prescriptions.length - activeRx.length} revoked`}
          icon={<svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>}
        />
      </div>

      {/* ── Prescriptions section ──────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-elev-2 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Prescriptions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Issued by you to your patients</p>
          </div>
          <Link
            to="/new-rx"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-800 transition-colors"
          >
            Create new <ArrowRight className="w-3.5 h-3.5"/>
          </Link>
        </div>

        {rxError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 m-4">
            Could not load prescriptions: {rxError}
          </div>
        )}

        {loading ? (
          <div className="p-6 text-sm text-slate-400">Loading…</div>
        ) : prescriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-1">
              <svg className="w-7 h-7 text-teal-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-700">No prescriptions yet</p>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Create a new prescription to see it listed here.
            </p>
            <Link
              to="/new-rx"
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-navy-700 hover:bg-navy-800 shadow-elev-1 transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              New Prescription
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="bg-surface-1 border-b border-slate-100">
                  {['Patient', 'Diagnosis', 'Date', 'Status', ''].map((h, idx) => (
                    <th key={h || idx} className={`px-4 sm:px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] whitespace-nowrap ${
                      idx === 2 ? 'hidden sm:table-cell' : ''
                    }`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recent.map(rx => (
                  <tr key={rx.id} className="group hover:bg-slate-50/70 transition-colors duration-100">
                    <td className="px-4 sm:px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={rx.patientName.split(' ').map(n => n[0]).join('')} color="teal" size="sm"/>
                        <span className="text-sm font-semibold text-slate-800 whitespace-nowrap truncate max-w-[160px] sm:max-w-none">{rx.patientName}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-5 py-4 text-sm text-slate-600 max-w-[240px] truncate">{rx.diagnosis}</td>
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
        )}
      </div>

      {/* ── QR Scanner Modal ───────────────────────────────────── */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-[scaleIn_0.2s_ease-out] transform transition-all flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Scan Patient QR</h3>
              <button
                onClick={() => setShowScanner(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-0 bg-black relative flex-1 min-h-[300px]">
              {scanSuccess ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-teal-500 text-white z-10 p-6 text-center animate-[fadeIn_0.2s_ease-out]">
                  <CheckCircle2 className="w-16 h-16 mb-4" />
                  <h4 className="text-xl font-bold mb-2">Patient Detected!</h4>
                  <p className="text-sm text-teal-50">OTP access request sent. Please ask the patient to check their portal for the code.</p>
                </div>
              ) : (
                <Scanner
                  onScan={async (result) => {
                    if (result && result.length > 0) {
                      try {
                        const data = JSON.parse(result[0].rawValue)
                        if (data.type === 'PATIENT_PROFILE' && data.patientId) {
                          setScanSuccess(true)
                          try {
                            await requestAccessOtp(doctorProfile.doctorId, data.patientId)
                          } catch (err) {
                            console.error('Failed to request OTP:', err)
                            alert('Failed to request OTP. Make sure you have valid credentials.')
                            setScanSuccess(false)
                          }
                          setTimeout(() => {
                            setShowScanner(false)
                            setScanSuccess(false)
                          }, 3000)
                        }
                      } catch (err) {
                        // ignore invalid JSON
                        console.warn("Scanned non-patient QR code", err)
                      }
                    }
                  }}
                  formats={['qr_code']}
                  components={{ audio: false, finder: true }}
                />
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <p className="text-xs text-center text-slate-500">
                Point your camera at the patient's QR code on their dashboard.
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
