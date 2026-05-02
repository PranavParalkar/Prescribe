import { useState, useEffect } from 'react'
import { NavLink, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Menu,
  X,
  Crown,
  Sparkles,
  Archive,
  History,
  Settings,
  Users,
  UserCheck,
  ShieldAlert,
  ShoppingBag
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getSubscriptionStatus, getDoctorByEmail } from '../../api/api'

const logo = '/logo.png'

const DOCTOR_LINKS = [
  { to: '/dashboard',        label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/new-rx',           label: 'New Prescription',  icon: FilePlus },
  { to: '/prescriptions',    label: 'Prescriptions',     icon: FileText },
  { to: '/patient-history',  label: 'Patient History',   icon: History },
  { to: '/profile',          label: 'My Profile',        icon: Settings },
]

const DOCTOR_LINKS_UNVERIFIED = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/profile',    label: 'My Profile', icon: Settings },
]

const PATIENT_LINKS_FREE = [
  { to: '/dashboard', label: 'My Prescriptions', icon: FileText },
  { to: '/documents', label: 'My Documents', icon: Archive },
  { to: '/patient/medical-orders', label: 'Pharmacy Orders', icon: ShoppingBag },
  { to: '/subscription', label: 'Subscription', icon: Crown },
  { to: '/profile', label: 'My Profile', icon: Settings },
]

const PATIENT_LINKS_PRO = [
  { to: '/dashboard', label: 'My Prescriptions', icon: FileText },
  { to: '/documents', label: 'My Documents', icon: Archive },
  { to: '/patient/medical-orders', label: 'Pharmacy Orders', icon: ShoppingBag },
  { to: '/profile', label: 'My Profile', icon: Settings },
]

const ADMIN_LINKS = [
  { to: '/dashboard', label: 'Pending Requests', icon: ShieldAlert },
  { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/admin/patients', label: 'Patients', icon: Users },
]

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [doctorVerified, setDoctorVerified] = useState(null)
  const isDoctor = user?.role === 'doctor'
  const isAdmin = user?.role === 'admin'

  // Determine sidebar links based on role + verification
  let links
  if (isAdmin) {
    links = ADMIN_LINKS
  } else if (isDoctor) {
    links = doctorVerified === true ? DOCTOR_LINKS : DOCTOR_LINKS_UNVERIFIED
  } else {
    links = isSubscribed ? PATIENT_LINKS_PRO : PATIENT_LINKS_FREE
  }

  // Fetch subscription status for patient users
  useEffect(() => {
    if (user?.role === 'patient' && user?.entityId) {
      getSubscriptionStatus(user.entityId)
        .then(data => setIsSubscribed(data?.subscribed === true))
        .catch(() => {})
    }
  }, [user?.role, user?.entityId])

  // Fetch doctor verification status
  useEffect(() => {
    if (user?.role === 'doctor' && user?.email) {
      getDoctorByEmail(user.email)
        .then(doc => setDoctorVerified(doc?.status === 'VERIFIED'))
        .catch(() => setDoctorVerified(false))
    }
  }, [user?.role, user?.email])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [navigate])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = user?.name?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <div className="flex h-screen w-screen bg-surface-bg overflow-hidden relative">

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ═════════════════════════════════════════════════════════
          SIDEBAR
      ═════════════════════════════════════════════════════════ */}
      <aside
        className={`
          relative flex flex-col shrink-0 sticky top-0 h-screen
          bg-navy-950 border-r border-white/[0.06]
          transition-all duration-300 ease-in-out z-50
          ${collapsed ? 'w-[58px]' : 'w-80'}
          max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:w-64
          ${mobileMenuOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'}
        `}
      >
        {/* ── Logo ─────────────────────────────────────────── */}
        <div className={`flex items-center h-14 border-b border-white/[0.06] px-3.5 shrink-0 overflow-hidden`}>
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center shrink-0 group-hover:bg-teal-500 transition-colors">
                <img src={logo} alt="Prescribe Logo" />
            </div>
            <span
              className={`
                text-white font-bold text-sm tracking-tight whitespace-nowrap group-hover:text-teal-300
                transition-[opacity,transform,color] duration-200
                ${collapsed ? 'opacity-0 -translate-x-2 pointer-events-none' : 'opacity-100 translate-x-0'}
              `}
            >
              Prescribe
            </span>
          </Link>
        </div>

        {/* ── Collapse toggle (desktop only) ───────────────────────────────── */}
        <button
          onClick={() => setCollapsed(p => !p)}
          className="
            absolute -right-3 top-[12px] z-50
            w-6 h-6 rounded-full bg-navy-800 border border-white/10
            flex items-center justify-center
            text-white/40 hover:text-white/80
            transition-all duration-150 hover:scale-110
            shadow-elev-2
            max-lg:hidden
          "
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
            : <ChevronLeft  className="w-3 h-3" strokeWidth={2.5} />
          }
        </button>

        {/* ── Close button (mobile only) ───────────────────────────────── */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="
            absolute right-3 top-3 z-50
            w-8 h-8 rounded-lg bg-white/10
            flex items-center justify-center
            text-white/60 hover:text-white
            transition-all duration-150
            lg:hidden
          "
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>

        {/* ── Role label ───────────────────────────────────── */}
        <div
          className={`
            px-3.5 pt-4 pb-2 overflow-hidden
            transition-[opacity] duration-150
            ${collapsed ? 'opacity-0' : 'opacity-100'}
          `}
        >
          <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em] whitespace-nowrap">
            {isAdmin ? 'Admin Portal' : (isDoctor ? 'Doctor Portal' : 'Patient Portal')}
          </p>
        </div>

        {/* ── Nav links ────────────────────────────────────── */}
        <nav className="flex-1 px-2 py-1 flex flex-col gap-0.5 overflow-hidden">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) => `
                group relative flex items-center gap-3 rounded-md
                transition-all duration-150
                ${collapsed ? 'px-2 py-2.5 justify-center' : 'px-2.5 py-2'}
                ${isActive
                  ? 'text-white bg-white/[0.08]'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/[0.05]'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator — thin left border style */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-teal-400" />
                  )}

                  <Icon
                    className={`shrink-0 transition-colors duration-150
                      ${collapsed ? 'w-5 h-5 ml-3' : 'w-[17px] h-[17px]'}
                      ${isActive ? 'text-teal-400' : 'text-current'}
                    `}
                    strokeWidth={isActive ? 2 : 1.75}
                  />

                  <span
                    className={`
                      text-[15px] font-medium whitespace-nowrap leading-none
                      transition-[opacity,transform,width] duration-200 overflow-hidden
                      ${collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}
                    `}
                  >
                    {label}
                  </span>

                  {/* Tooltip in collapsed mode */}
                  {collapsed && (
                    <span className="
                      absolute left-full ml-3 px-2.5 py-1.5 rounded-md
                      bg-navy-800 border border-white/10
                      text-xs font-medium text-white whitespace-nowrap
                      opacity-0 group-hover:opacity-100
                      translate-x-1 group-hover:translate-x-0
                      transition-all duration-150 pointer-events-none
                      shadow-elev-3 z-50
                    ">
                      {label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Divider ──────────────────────────────────────── */}
        <div className="mx-3 border-t border-white/[0.06]" />

        {/* ── Profile section ──────────────────────────────── */}
        <div className={`px-2 py-3 flex items-center gap-2.5 overflow-hidden ${collapsed ? 'justify-center' : ''}`}>
          {/* Avatar */}
          <Link 
            to="/profile"
            className="w-7 h-7 rounded-lg bg-white/8 border border-white/[0.1] flex items-center justify-center text-[10px] font-bold text-white/70 shadow-sm hover:border-teal-400 group/avatar shrink-0 transition-all overflow-hidden"
          >
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </Link>

          {/* Name + role */}
          <Link
            to="/profile"
            className={`
              flex-1 min-w-0 group/name
              transition-[opacity,width] duration-200
              ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
            `}
          >
            <p className="text-[12px] font-semibold text-white/80 group-hover/name:text-teal-400 truncate leading-none transition-colors">{user?.name}</p>
            <p className="text-[10px] text-white/30 capitalize mt-0.5 leading-none">{user?.role}</p>
          </Link>

          {/* Logout icon button */}
          <button
            onClick={handleLogout}
            title="Sign out"
            className="
              w-7 h-7 rounded-md flex items-center justify-center shrink-0
              text-white/25 hover:text-red-400 hover:bg-red-500/10
              transition-all duration-150
            "
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </aside>

      {/* ═════════════════════════════════════════════════════════
          MAIN AREA
      ═════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-100 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-30 shadow-elev-1">
          <div className="flex items-center gap-2.5">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" strokeWidth={2} />
            </button>
            <div className="w-1 h-4 rounded-full bg-teal-500" />
            <span className="text-sm font-semibold text-slate-500 max-sm:hidden">
              {isAdmin ? 'Admin Portal' : (user?.role === 'doctor' ? 'Doctor Portal' : 'Patient Portal')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Premium badge for subscribed patients */}
            {!isDoctor && isSubscribed && (
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-full px-3 py-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Premium</span>
              </div>
            )}
            <span className="text-xs text-slate-400 font-medium hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <Link 
              to="/profile" 
              className="w-7 h-7 rounded-lg bg-navy-50 border border-navy-100 flex items-center justify-center text-[10px] font-bold text-navy-700 hover:border-teal-500 hover:scale-105 transition-all shadow-sm shrink-0 overflow-hidden"
            >
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
