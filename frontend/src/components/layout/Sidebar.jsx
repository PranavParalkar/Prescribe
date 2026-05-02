import { NavLink } from 'react-router-dom'

export default function Sidebar({ role }) {
  const isDoctor = role === 'doctor'

  const doctorLinks = [
    {
      to: '/doctor/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
      ),
    },
    {
      to: '/doctor/upload',
      label: 'New Prescription',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4"/>
        </svg>
      ),
    },
    {
      to: '/doctor/prescriptions',
      label: 'Prescriptions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      ),
    },
  ]

  const patientLinks = [
    {
      to: '/patient/dashboard',
      label: 'My Prescriptions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      ),
    },
    {
      to: '/patient/medical-orders',
      label: 'Pharmacy Orders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
      ),
    },
  ]

  const medicalLinks = [
    {
      to: '/dashboard',
      label: 'Orders Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
      ),
    },
  ]

  const links = isDoctor ? doctorLinks : role === 'medical' ? medicalLinks : patientLinks
  
  let activeColor = 'bg-teal-600 text-white shadow-sm'
  let hoverColor = 'hover:bg-teal-50 hover:text-teal-700'
  let sidebarBg = 'bg-white'
  let borderColor = 'border-slate-100'
  let textColor = 'text-slate-500'
  
  if (isDoctor) {
    activeColor = 'bg-white/20 text-white shadow-sm'
    hoverColor = 'hover:bg-white/10 hover:text-white'
    sidebarBg = 'bg-gradient-to-b from-navy-900 to-navy-800'
    borderColor = 'border-navy-700'
    textColor = 'text-white/70'
  } else if (role === 'medical') {
    activeColor = 'bg-blue-600 text-white shadow-sm'
    hoverColor = 'hover:bg-blue-50 hover:text-blue-700'
  }

  return (
    <aside className={`w-56 shrink-0 flex flex-col ${sidebarBg} border-r ${borderColor} min-h-screen`}>
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive ? activeColor : `${textColor} ${hoverColor}`
              }`
            }
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom badge */}
      <div className="p-4">
        <div className={`rounded-xl ${isDoctor ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-100'} border px-3 py-3 text-center`}>
          <p className={`text-xs font-semibold ${isDoctor ? 'text-white/60' : 'text-slate-400'} uppercase tracking-wider mb-0.5`}>Mode</p>
          <p className={`text-sm font-bold ${isDoctor ? 'text-white' : role === 'medical' ? 'text-blue-600' : 'text-teal-600'}`}>
            {isDoctor ? '👨‍⚕️ Doctor' : role === 'medical' ? '🏥 Medical' : '🧑‍💼 Patient'}
          </p>
        </div>
      </div>
    </aside>
  )
}
