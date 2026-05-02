import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [role, setRole] = useState('doctor')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [step, setStep] = useState('email') // 'email' | 'otp'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { sendOtp, verifyOtpLogin } = useAuth()
  const navigate = useNavigate()
  const isDoctor = role === 'doctor'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (step === 'email') {
      const result = await sendOtp(email, true)
      setLoading(false)
      if (result.success) {
        setStep('otp')
      } else {
        setError(result.error)
      }
    } else {
      const result = await verifyOtpLogin(email, otpCode, role)
      setLoading(false)
      if (result.success) {
        navigate('/dashboard', { replace: true })
      } else {
        setError(result.error)
      }
    }
  }



  return (
    <div className="min-h-screen w-screen bg-surface-bg flex flex-col lg:flex-row">
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

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-6 sm:mb-8 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-navy-700 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
              </svg>
            </div>
            <span className="text-navy-900 font-bold text-lg tracking-tight">
              Prescribe
            </span>
          </div>

          {/* Heading */}
          <div className="mb-6 sm:mb-7">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Sign in to your Prescribe account
            </p>
          </div>

          {/* Role toggle */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6 gap-1">
            {[
              { key: "doctor", label: "Doctor" },
              { key: "patient", label: "Patient" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setRole(key);
                  setError("");
                }}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  role === key
                    ? "bg-white text-navy-800 shadow-elev-1"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  role === 'doctor' ? "doctor@prescribe.app" : "patient@prescribe.app"
                }
                required
                disabled={step === 'otp'}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-surface-1 text-slate-800 placeholder-slate-400 outline-none hover:border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all disabled:opacity-50"
              />
            </div>

            {step === 'otp' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    OTP Code
                  </label>
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setError(''); }}
                    className="text-xs text-teal-600 hover:text-teal-800 font-semibold transition-colors"
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
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-surface-1 text-slate-800 placeholder-slate-400 outline-none hover:border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all tracking-[0.25em] font-mono"
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3.5 py-3 font-medium">
                <svg
                  className="w-4 h-4 shrink-0 text-red-500"
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
                  Signing in…
                </>
              ) : step === 'email' ? (
                "Send OTP"
              ) : (
                "Verify OTP & Sign In"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-5 sm:mt-6 pt-5 border-t border-slate-100 flex items-center justify-center">
            <span className="text-xs text-slate-400">
              No account?{" "}
              <Link
                to="/register"
                className="font-semibold text-teal-600 hover:text-teal-800 transition-colors"
              >
                Sign up
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
