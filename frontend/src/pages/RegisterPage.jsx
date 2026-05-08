import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { uploadDoctorLicense } from '../api/api'

export default function RegisterPage() {
  const [role, setRole] = useState('doctor')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [licenseFile, setLicenseFile] = useState(null)
  const [licenseNumber, setLicenseNumber] = useState('')
  
  const [step, setStep] = useState('form') // 'form' | 'otp'
  const [otpCode, setOtpCode] = useState('')
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { sendOtp, verifyOtpLogin } = useAuth()
  const navigate = useNavigate()

  const isDoctor = role === 'doctor'
  const isMedical = role === 'medical'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (step === 'form') {
      const result = await sendOtp(email)
      setLoading(false)
      if (result.success) {
        setStep('otp')
      } else {
        setError(result.error)
      }
    } else {
      let extra = { name, specialty, licenseNumber, isRegistering: true }

      // Capture geolocation for medical stores
      if (isMedical) {
        try {
          const pos = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
          )
          extra.latitude = pos.coords.latitude
          extra.longitude = pos.coords.longitude
        } catch { /* geolocation unavailable — will be null */ }
      }

      const result = await verifyOtpLogin(email, otpCode, role, extra)
      
      if (result.success) {
        if (isDoctor && licenseFile && result.profile.entityId) {
          try {
            await uploadDoctorLicense(result.profile.entityId, licenseFile)
          } catch (uploadErr) {
            console.error("Failed to upload license:", uploadErr)
            // Still navigate, but maybe show a toast in a real app
          }
        }
        setLoading(false)
        navigate('/dashboard', { replace: true })
      } else {
        setLoading(false)
        setError(result.error)
      }
    }
  }

  const inputCls = 'w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 outline-none hover:border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all disabled:opacity-50'

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left panel — branding */}
      <div className="hidden py-88 lg:flex flex-col justify-between w-[400px] shrink-0 p-10 rounded-r-full bg-navy-900 relative overflow-hidden">
        {/* Subtle background grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,1.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,1.5) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* Top — logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg  flex items-center justify-center">
            <img src="/logo.png" alt="Prescribe Logo" />
          </div>
          <div>
            <span className="text-white font-bold text-2xl tracking-tight block leading-none">
              Prescribe
            </span>
          </div>
        </div>

        {/* Middle — quote */}
        <div className="relative z-10">
          <div className="w-8 h-0.5 bg-teal-500 rounded mb-6" />
          <p className="text-xl font-semibold leading-snug text-white/90 mb-4">
            Prescription management, simplified for modern healthcare.
          </p>
          <p className="text-xs text-white/40 font-medium uppercase tracking-widest">
            Secure · Digital · Instant
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 sm:mb-8 text-center">
            <img src="/logo.png" alt="Prescribe" className="h-10 mx-auto" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
            Create an account
          </h2>
          <p className="text-sm text-slate-400 mb-6 sm:mb-7">
            Get started with Prescribe for free
          </p>

          {/* Role toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            {[
              { key: "doctor", label: "Doctor" },
              { key: "patient", label: "Patient" },
              { key: "medical", label: "Medical Store" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setRole(key);
                  setError("");
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  role === key
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                {isMedical ? "Store Name" : "Full name"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isDoctor ? "Dr. John Smith" : isMedical ? "My Pharmacy" : "Your full name"}
                required
                className={inputCls}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={step === 'otp'}
                className={inputCls}
              />
            </div>

            {isDoctor && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Specialty
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className={inputCls}
                  required
                >
                  <option value="">Select specialty…</option>
                  {[
                    "General Physician",
                    "Cardiologist",
                    "Dermatologist",
                    "Neurologist",
                    "Orthopedic",
                    "Pediatrician",
                    "Psychiatrist",
                    "Other",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {isMedical && step === 'form' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  License Number
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. LIC-12345678"
                  required
                  className={inputCls}
                />
              </div>
            )}

            {isDoctor && step === 'form' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  License Document (PDF/Image)
                </label>
                <input
                  type="file"
                  onChange={(e) => setLicenseFile(e.target.files[0])}
                  required
                  accept="image/*,application/pdf"
                  className={inputCls}
                />
              </div>
            )}

            {step === 'otp' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    OTP Code
                  </label>
                  <button
                    type="button"
                    onClick={() => { setStep('form'); setError(''); }}
                    className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold"
                  >
                    Change Email
                  </button>
                </div>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 outline-none hover:border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all tracking-[0.25em] font-mono"
                />
              </div>
            )}



            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-navy-700 hover:bg-navy-800 disabled:opacity-60 disabled:cursor-not-allowed mt-1 flex items-center justify-center gap-2 shadow-elev-1 hover:shadow-elev-2 transition-all"
              // style={{
              //   background: loading
              //     ? "#64B5F6"
              //     : "linear-gradient(135deg, #0369a1, #0e7490)",
              // }}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Processing…
                </>
              ) : step === 'form' ? (
                "Send OTP"
              ) : (
                "Verify OTP & Register"
              )}
            </button>
          </form>

          <p className="mt-5 sm:mt-6 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-cyan-600 hover:underline"
            >
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-slate-300 leading-relaxed">
            By creating an account you agree to our{" "}
            <button className="text-slate-400 hover:underline">Terms</button>{" "}
            and{" "}
            <button className="text-slate-400 hover:underline">
              Privacy Policy
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
