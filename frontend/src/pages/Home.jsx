import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 flex flex-col items-center justify-center p-4">

      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
          <svg className="w-11 h-11 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Prescribe</h1>
          <p className="text-slate-500 mt-1 text-base">Digital Prescription Management</p>
        </div>
      </div>

      {/* Role cards */}
      <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Doctor card */}
        <Link to="/login?role=doctor" className="group">
          <div className="bg-white border border-slate-100 rounded-2xl p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-200">
              <svg className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5 0 1.93-1.57 3.5-3.5 3.5s-3.5-1.57-3.5-3.5c0-1.93 1.57-3.5 3.5-3.5zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Doctor</h2>
            <p className="text-sm text-slate-400 leading-snug">Create &amp; manage prescriptions for your patients</p>
            <div className="mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-blue-600 group-hover:gap-2 transition-all">
              Sign in <span>→</span>
            </div>
          </div>
        </Link>

        {/* Patient card */}
        <Link to="/login?role=patient" className="group">
          <div className="bg-white border border-slate-100 rounded-2xl p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-teal-100 rounded-xl flex items-center justify-center group-hover:bg-teal-600 transition-colors duration-200">
              <svg className="w-7 h-7 text-teal-600 group-hover:text-white transition-colors duration-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Patient</h2>
            <p className="text-sm text-slate-400 leading-snug">View and track your active prescriptions</p>
            <div className="mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-teal-600 group-hover:gap-2 transition-all">
              Sign in <span>→</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <p className="mt-10 text-xs text-slate-400">
        Prototype — Mock data only. No real medical data.
      </p>
    </div>
  )
}
