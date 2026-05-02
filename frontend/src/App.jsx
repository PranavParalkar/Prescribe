import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Auth (full-page, no sidebar)
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OAuthSuccess from './pages/OAuthSuccess'

// Dashboard pages (all use DashboardLayout with sidebar)
import DoctorDashboard         from './pages/DoctorDashboard'
import PatientDashboard        from './pages/PatientDashboard'
import PatientMedicalOrders    from './pages/PatientMedicalOrders'
import MedicalDashboard        from './pages/MedicalDashboard'
import UploadPrescription      from './pages/UploadPrescription'
import PrescriptionDetailsPage from './pages/PrescriptionDetailsPage'
import PrescriptionsList       from './pages/PrescriptionsList'
import SubscriptionPage        from './pages/SubscriptionPage'
import PatientDocumentsPage    from './pages/PatientDocumentsPage'
import PatientHistoryPage      from './pages/PatientHistoryPage'
import ProfileSettings       from './pages/ProfileSettings'
import AdminDashboard          from './pages/AdminDashboard'
import AdminDoctorsPage        from './pages/AdminDoctorsPage'
import AdminPatientsPage       from './pages/AdminPatientsPage'
import AdminMedicalsPage       from './pages/AdminMedicalsPage'

// ── Guards ────────────────────────────────────────────────────
function RequireAuth({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function GuestOnly({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

// ── Smart /dashboard redirect (role-aware) ────────────────────
function DashboardRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return user.role === 'doctor'
    ? <DoctorDashboard />
    : user.role === 'admin'
    ? <AdminDashboard />
    : user.role === 'medical'
    ? <MedicalDashboard />
    : <PatientDashboard />
}

// ── Routes ────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Auth pages (no sidebar) */}
        <Route path="/login"    element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
        <Route path="/oauth-success" element={<GuestOnly><OAuthSuccess /></GuestOnly>} />

        {/* ── Single /dashboard entry point (role-aware) ── */}
        <Route path="/dashboard" element={
          <RequireAuth><DashboardRedirect /></RequireAuth>
        }/>

        {/* Doctor-only routes (sidebar shows) */}
        <Route path="/new-rx" element={
          <RequireAuth role="doctor"><UploadPrescription /></RequireAuth>
        }/>
        <Route path="/prescriptions" element={
          <RequireAuth role="doctor"><PrescriptionsList /></RequireAuth>
        }/>
        <Route path="/patient-history" element={
          <RequireAuth role="doctor"><PatientHistoryPage /></RequireAuth>
        }/>

        {/* Patient-only — subscription & documents */}
        <Route path="/subscription" element={
          <RequireAuth role="patient"><SubscriptionPage /></RequireAuth>
        }/>
        <Route path="/documents" element={
          <RequireAuth role="patient"><PatientDocumentsPage /></RequireAuth>
        }/>
        <Route path="/patient/medical-orders" element={
          <RequireAuth role="patient"><PatientMedicalOrders /></RequireAuth>
        }/>

        {/* Shared — prescription detail (sidebar shows) */}
        <Route path="/prescription/:id" element={
          <RequireAuth><PrescriptionDetailsPage /></RequireAuth>
        }/>
        <Route path="/profile" element={
          <RequireAuth><ProfileSettings /></RequireAuth>
        }/>

        {/* Admin routes */}
        <Route path="/admin" element={
          <RequireAuth role="admin"><AdminDashboard /></RequireAuth>
        }/>
        <Route path="/admin/doctors" element={
          <RequireAuth role="admin"><AdminDoctorsPage /></RequireAuth>
        }/>
        <Route path="/admin/patients" element={
          <RequireAuth role="admin"><AdminPatientsPage /></RequireAuth>
        }/>
        <Route path="/admin/medicals" element={
          <RequireAuth role="admin"><AdminMedicalsPage /></RequireAuth>
        }/>

        {/* Legacy + catch-all → /login */}
        <Route path="/doctor/dashboard"  element={<Navigate to="/dashboard" replace />} />
        <Route path="/patient/dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/doctor/login"      element={<Navigate to="/login" replace />} />
        <Route path="/patient/login"     element={<Navigate to="/login" replace />} />
        <Route path="/"                  element={<Navigate to="/login" replace />} />
        <Route path="*"                  element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
