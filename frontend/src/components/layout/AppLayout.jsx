import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const avatarBg = user?.role === 'doctor' ? 'bg-cyan-100 text-cyan-800' : 'bg-teal-100 text-teal-800'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Top Navbar ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

          {/* Left — logo + name */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Prescribe" className="h-9 w-auto" />
          </div>

          {/* Right — user chip + logout */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${avatarBg}`}>
                  {user.avatar || user.name?.slice(0,2).toUpperCase()}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-slate-700 leading-none">{user.name}</p>
                  <p className="text-[11px] text-slate-400 capitalize mt-0.5">{user.role}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 px-3 py-2 rounded-xl transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
