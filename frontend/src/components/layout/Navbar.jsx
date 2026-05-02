import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'

export default function Navbar({ role }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const roleLabel = role === 'doctor' ? 'Doctor Portal' : 'Patient Portal'
  const roleColor = role === 'doctor' ? 'text-blue-600' : 'text-teal-600'

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100 shadow-sm">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <div className="leading-tight">
            <span className="font-bold text-slate-800 text-sm">Prescribe</span>
            <p className={`text-xs font-medium ${roleColor}`}>{roleLabel}</p>
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* User info */}
          {user && (
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50">
              <Avatar initials={user.avatar} color={role === 'doctor' ? 'blue' : 'teal'} size="sm" />
              <div className="leading-tight">
                <p className="text-xs font-semibold text-slate-700">{user.name}</p>
                {user.specialty && <p className="text-xs text-slate-400">{user.specialty}</p>}
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
