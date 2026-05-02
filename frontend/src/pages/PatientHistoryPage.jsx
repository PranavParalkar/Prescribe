import { useState, useEffect, useRef } from 'react'
import { Search, ShieldCheck, Clock, FileText, Download, Eye, X, AlertCircle, ArrowLeft, Loader2, KeyRound, CheckCircle2 } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { requestAccessOtp, verifyAccessOtp, getDoctorByEmail, getDocumentViewBlob, getDocumentDownloadUrl } from '../api/api'

// ── Category metadata (for display) ──────────────────────────────
const CATEGORY_META = {
  EYES:        { label: 'Eyes',        color: 'from-blue-400 to-blue-600' },
  HEART:       { label: 'Heart',       color: 'from-red-400 to-red-600' },
  DENTAL:      { label: 'Dental',      color: 'from-cyan-400 to-cyan-600' },
  ORTHOPEDIC:  { label: 'Orthopedic',  color: 'from-amber-400 to-amber-600' },
  DERMATOLOGY: { label: 'Dermatology', color: 'from-pink-400 to-pink-600' },
  ENT:         { label: 'ENT',         color: 'from-violet-400 to-violet-600' },
  NEUROLOGY:   { label: 'Neurology',   color: 'from-purple-400 to-purple-600' },
  GENERAL:     { label: 'General',     color: 'from-teal-400 to-teal-600' },
  PEDIATRIC:   { label: 'Pediatric',   color: 'from-emerald-400 to-emerald-600' },
  PSYCHIATRY:  { label: 'Psychiatry',  color: 'from-indigo-400 to-indigo-600' },
  OTHER:       { label: 'Other',       color: 'from-slate-400 to-slate-600' },
}

export default function PatientHistoryPage() {
  const { user } = useAuth()

  // Step management: 'search' → 'otp' → 'documents'
  const [step, setStep] = useState('search')

  // Step 1: Search
  const [patientId, setPatientId] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)

  // Step 2: OTP
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpExpiry, setOtpExpiry] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState(null)
  const otpRefs = useRef([])

  // Step 3: Documents
  const [documents, setDocuments] = useState([])
  const [category, setCategory] = useState('')
  const [patientName, setPatientName] = useState('')
  const [viewingDoc, setViewingDoc] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [docError, setDocError] = useState(null)

  // Doctor ID resolution
  const [doctorId, setDoctorId] = useState(user?.entityId || null)

  useEffect(() => {
    if (!doctorId && user?.email) {
      getDoctorByEmail(user.email)
        .then(doc => setDoctorId(doc?.doctorId))
        .catch(() => {})
    }
  }, [user?.email, doctorId])

  // ── Countdown timer ─────────────────────────────────────────────
  useEffect(() => {
    if (!otpExpiry) return
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(otpExpiry) - Date.now()) / 1000))
      setTimeLeft(diff)
      if (diff <= 0) {
        setOtpError('OTP has expired. Please request a new one.')
      }
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [otpExpiry])

  useEffect(() => {
    return () => {
      if (viewingDoc?.isObjectUrl && viewingDoc.url) {
        URL.revokeObjectURL(viewingDoc.url)
      }
    }
  }, [viewingDoc])

  // ── Step 1: Request OTP ──────────────────────────────────────────
  const handleRequestOtp = async (e) => {
    e.preventDefault()
    if (!patientId.trim() || !doctorId) return
    setSearchLoading(true)
    setSearchError(null)

    try {
      const res = await requestAccessOtp(doctorId, patientId.trim())
      setOtpExpiry(res.expiresAt)
      setOtp(['', '', '', '', '', ''])
      setOtpError(null)
      setStep('otp')
      // Focus first OTP input after transition
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err) {
      setSearchError(err.message || 'Failed to request OTP')
    } finally {
      setSearchLoading(false)
    }
  }

  // ── OTP Input handlers ──────────────────────────────────────────
  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[idx] = val.slice(-1)
    setOtp(next)
    if (val && idx < 5) {
      otpRefs.current[idx + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      e.preventDefault()
      setOtp(pasted.split(''))
      otpRefs.current[5]?.focus()
    }
  }

  // ── Step 2: Verify OTP ──────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const otpCode = otp.join('')
    if (otpCode.length !== 6 || !doctorId) return
    setOtpLoading(true)
    setOtpError(null)

    try {
      const res = await verifyAccessOtp(doctorId, {
        patientId: patientId.trim(),
        otp: otpCode,
      })
      setDocuments(res.documents || [])
      setCategory(res.category || '')
      setPatientName(res.patientName || 'Patient')
      setStep('documents')
    } catch (err) {
      setOtpError(err.message || 'OTP verification failed')
    } finally {
      setOtpLoading(false)
    }
  }

  // ── Document actions ────────────────────────────────────────────
  const handleView = async (doc) => {
    setViewLoading(true)
    setDocError(null)
    try {
      const { blob, contentType } = await getDocumentViewBlob(doc.id)
      const objectUrl = URL.createObjectURL(blob)

      setViewingDoc((prev) => {
        if (prev?.isObjectUrl && prev.url) {
          URL.revokeObjectURL(prev.url)
        }
        return {
          id: doc.id,
          url: objectUrl,
          fileName: doc.fileName,
          contentType: contentType || doc.contentType,
          isObjectUrl: true,
        }
      })
    } catch (err) {
      setDocError(err.message)
    } finally {
      setViewLoading(false)
    }
  }

  const closeViewer = () => {
    setViewingDoc((prev) => {
      if (prev?.isObjectUrl && prev.url) {
        URL.revokeObjectURL(prev.url)
      }
      return null
    })
  }

  const handleDownload = async (docId) => {
    try {
      const { url } = await getDocumentDownloadUrl(docId)
      window.open(url, '_blank')
    } catch (err) {
      setDocError(err.message)
    }
  }

  const handleReset = () => {
    setStep('search')
    setPatientId('')
    setOtp(['', '', '', '', '', ''])
    setOtpExpiry(null)
    setTimeLeft(0)
    setDocuments([])
    setCategory('')
    setPatientName('')
    setSearchError(null)
    setOtpError(null)
    setDocError(null)
  }

  const fileSizeLabel = (bytes) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const catMeta = CATEGORY_META[category] || { label: category, color: 'from-slate-400 to-slate-600' }
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-6">

        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="mb-8">
          {step !== 'search' && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-teal-600
                mb-3 transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Start Over
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-700 to-teal-600 flex items-center justify-center shadow-lg shadow-navy-200/30">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Patient History</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {step === 'search' && 'Enter a patient ID to request access to their medical records'}
                {step === 'otp' && 'Enter the OTP sent to the patient\'s registered email'}
                {step === 'documents' && `Viewing ${catMeta.label} records for ${patientName}`}
              </p>
            </div>
          </div>
        </div>

        {/* ── Step Progress ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-8">
          {[
            { key: 'search', label: 'Patient ID', num: 1 },
            { key: 'otp', label: 'Verify OTP', num: 2 },
            { key: 'documents', label: 'View Records', num: 3 },
          ].map(({ key, label, num }, idx) => {
            const isActive = step === key
            const isDone = (step === 'otp' && num === 1) || (step === 'documents' && num <= 2)
            return (
              <div key={key} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all duration-300
                  ${isDone ? 'bg-teal-500 text-white' : isActive ? 'bg-navy-700 text-white ring-4 ring-navy-100' : 'bg-slate-100 text-slate-400'}`}
                >
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : num}
                </div>
                <span className={`text-[11px] font-semibold whitespace-nowrap hidden sm:block transition-colors
                  ${isActive ? 'text-slate-700' : isDone ? 'text-teal-600' : 'text-slate-400'}`}
                >
                  {label}
                </span>
                {idx < 2 && <div className={`flex-1 h-px ${isDone ? 'bg-teal-300' : 'bg-slate-200'}`} />}
              </div>
            )
          })}
        </div>

        {/* ═══ Step 1: Search Patient ═══════════════════════════ */}
        {step === 'search' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-elev-2 overflow-hidden animate-[fadeIn_0.3s_ease-out]">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Find Patient</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Enter the patient's unique ID to request document access</p>
            </div>
            <form onSubmit={handleRequestOtp} className="px-6 py-6">
              {searchError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-xs text-red-600 animate-[fadeIn_0.2s_ease-out]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {searchError}
                </div>
              )}

              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Patient ID
              </label>
              <div className="flex gap-3">
                <input
                  id="patient-id-input"
                  type="text"
                  value={patientId}
                  onChange={e => setPatientId(e.target.value)}
                  placeholder="e.g. PAT-a1b2c3d4"
                  required
                  className="flex-1 px-4 py-3 text-sm border border-slate-200 rounded-xl bg-white
                    focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all
                    text-slate-700 placeholder-slate-300 font-mono"
                />
                <button
                  type="submit"
                  disabled={!patientId.trim() || searchLoading || !doctorId}
                  className="px-6 py-3 bg-gradient-to-r from-navy-700 to-teal-600 text-white text-sm font-bold rounded-xl
                    hover:from-navy-800 hover:to-teal-700 transition-all duration-200 shadow-md shadow-navy-200/30
                    disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2
                    hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  {searchLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  Request Access
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1.5">
                <KeyRound className="w-3 h-3" />
                An OTP will be sent to the patient's registered email address for verification
              </p>
            </form>
          </div>
        )}

        {/* ═══ Step 2: Enter OTP ════════════════════════════════ */}
        {step === 'otp' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-elev-2 overflow-hidden animate-[fadeIn_0.3s_ease-out]">
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Enter Verification Code</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ask the patient for the 6-digit code sent to their email
                  </p>
                </div>
                {timeLeft > 0 && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                    ${timeLeft <= 30 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}
                  >
                    <Clock className="w-3 h-3" />
                    {mm}:{ss}
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="px-6 py-8">
              {otpError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-xs text-red-600 animate-[fadeIn_0.2s_ease-out]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {otpError}
                </div>
              )}

              {/* OTP inputs */}
              <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => otpRefs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all duration-200
                      ${digit ? 'border-teal-400 bg-teal-50/30 text-slate-800' : 'border-slate-200 text-slate-500'}
                      focus:border-navy-500 focus:ring-4 focus:ring-navy-100`}
                  />
                ))}
              </div>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOtpError(null)
                    handleRequestOtp({ preventDefault: () => {} })
                  }}
                  disabled={searchLoading || timeLeft > 0}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Resend OTP
                </button>
                <button
                  type="submit"
                  disabled={otp.join('').length !== 6 || otpLoading || timeLeft <= 0}
                  className="px-8 py-2.5 bg-gradient-to-r from-navy-700 to-teal-600 text-white text-sm font-bold rounded-xl
                    hover:from-navy-800 hover:to-teal-700 transition-all duration-200 shadow-md shadow-navy-200/30
                    disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2
                    hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  {otpLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  Verify
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ═══ Step 3: View Documents ══════════════════════════ */}
        {step === 'documents' && (
          <div className="animate-[fadeIn_0.3s_ease-out]">
            {/* Results header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${catMeta.color} flex items-center justify-center shadow-md`}>
                  <FileText className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">{patientName}'s Records</h2>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {documents.length} {catMeta.label} document{documents.length !== 1 ? 's' : ''} · Patient ID: {patientId}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border
                bg-gradient-to-r ${catMeta.color} text-white shadow-sm`}
              >
                {catMeta.label}
              </span>
            </div>

            {docError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-xs text-red-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {docError}
                <button onClick={() => setDocError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-md cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-elev-1">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${catMeta.color} flex items-center justify-center mb-4 opacity-40`}>
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <p className="text-sm font-bold text-slate-600">No {catMeta.label.toLowerCase()} documents found</p>
                <p className="text-xs text-slate-400 mt-1.5 max-w-[260px] text-center">
                  This patient has no uploaded documents in the {catMeta.label} category
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documents.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="group bg-white border border-slate-100 rounded-xl shadow-elev-1 hover:shadow-elev-3
                      hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden"
                    style={{ animationDelay: `${idx * 50}ms`, animation: 'slideUp 0.3s ease-out backwards' }}
                  >
                    {/* Card header accent */}
                    <div className={`h-1 bg-gradient-to-r ${catMeta.color} opacity-60 group-hover:opacity-100 transition-opacity`} />

                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: 'linear-gradient(135deg, rgba(0,170,186,0.08), rgba(0,106,122,0.08))' }}
                        >
                          <FileText className="w-4.5 h-4.5 text-teal-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors">{doc.fileName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            {fileSizeLabel(doc.fileSize)}
                            {doc.documentDate && <span className="ml-1.5">· {doc.documentDate}</span>}
                          </p>
                        </div>
                      </div>

                      {doc.description && (
                        <p className="text-[11px] text-slate-500 mb-3 line-clamp-2 leading-relaxed">{doc.description}</p>
                      )}

                      <div className="flex items-center gap-1 pt-3 border-t border-slate-100/80 mt-auto">
                        <button
                          onClick={() => handleView(doc)}
                          disabled={viewLoading}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-navy-700
                            hover:bg-navy-50 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        <button
                          onClick={() => handleDownload(doc.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-teal-600
                            hover:bg-teal-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Document Viewer Modal ────────────────────────────────── */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] mx-4 flex flex-col animate-[scaleIn_0.2s_ease-out] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-50 to-navy-50 border border-teal-100/50 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{viewingDoc.fileName}</p>
                  <p className="text-[10px] text-slate-400">Document Preview</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handleDownload(viewingDoc.id)
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-teal-600
                    bg-teal-50 hover:bg-teal-100 border border-teal-200/50 rounded-lg transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
                <button
                  onClick={closeViewer}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-50 overflow-hidden">
              {viewingDoc.fileName?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={viewingDoc.url}
                  className="w-full h-full border-0"
                  title={`Preview: ${viewingDoc.fileName}`}
                />
              ) : viewingDoc.contentType?.startsWith('image/') ||
                    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(viewingDoc.fileName) ? (
                <div className="w-full h-full flex items-center justify-center p-8">
                  <img
                    src={viewingDoc.url}
                    alt={viewingDoc.fileName}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500">Preview not available</p>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handleDownload(viewingDoc.id)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white
                      bg-gradient-to-r from-teal-500 to-navy-700 rounded-xl shadow-md cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download to view
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
