import { createContext, useContext, useState } from 'react'
import { authLogin, authRegister, createDoctor, createPatient, getDoctorByEmail, getPatientByEmail, sendAuthOtp, verifyAuthOtp } from '../api/api'

const AuthContext = createContext(null)

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Decode payload from a JWT without verifying — used only to get email/sub. */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return {}
  }
}

/** Persist auth state to localStorage. */
function saveSession(token, profile) {
  localStorage.setItem('prescribe_token', token)
  localStorage.setItem('prescribe_user', JSON.stringify(profile))
}

/** Clear auth state from localStorage. */
function clearSession() {
  localStorage.removeItem('prescribe_token')
  localStorage.removeItem('prescribe_user')
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('prescribe_user')) } catch { return null }
  })

  /**
   * Login with email + password.
   * Role is passed from the UI toggle (doctor | patient) since JWT doesn't
   * store role claims in this backend implementation.
   */
  const login = async (email, password, role) => {
    try {
      const { token } = await authLogin({ email, password })

      // Temporarily save token so the subsequent api calls have auth header set
      localStorage.setItem('prescribe_token', token)

      const payload = decodeJwtPayload(token)
      const emailFromToken = payload.sub || email

      let entityId = null
      let name = emailFromToken.split('@')[0]

      try {
        if (role === 'doctor') {
          try {
            const doc = await getDoctorByEmail(emailFromToken)
            entityId = doc.doctorId
            if (doc.firstName) name = `Dr. ${doc.firstName} ${doc.lastName}`.trim()
          } catch (err) {
            // If auth user exists but doctor profile doesn't, auto-create one.
            const base = emailFromToken.split('@')[0] || 'Doctor'
            const parts = base.replace(/[._-]+/g, ' ').trim().split(/\s+/).filter(Boolean)
            const firstName = parts[0] || 'Doctor'
            const lastName = parts.slice(1).join(' ') || firstName

            const doc = await createDoctor({
              firstName,
              lastName,
              specialization: 'General Physician',
              licenseNumber: `LIC-${Date.now()}`,
              phone: '',
              email: emailFromToken,
            })
            entityId = doc.doctorId
            name = `Dr. ${doc.firstName ?? firstName} ${doc.lastName ?? lastName}`.trim()
          }
        } else {
          try {
            const pat = await getPatientByEmail(emailFromToken)
            entityId = pat.patientId
            if (pat.firstName) name = `${pat.firstName} ${pat.lastName}`.trim()
          } catch (err) {
            // If auth user exists but patient profile doesn't, auto-create one.
            const base = emailFromToken.split('@')[0] || 'Patient'
            const parts = base.replace(/[._-]+/g, ' ').trim().split(/\s+/).filter(Boolean)
            const firstName = parts[0] || 'Patient'
            const lastName = parts.slice(1).join(' ') || firstName

            const pat = await createPatient({
              firstName,
              lastName,
              dob: null,
              gender: null,
              phone: '',
              email: emailFromToken,
            })
            entityId = pat.patientId
            name = `${pat.firstName ?? firstName} ${pat.lastName ?? lastName}`.trim()
          }
        }
      } catch (err) {
        console.warn('Could not fetch complete profile on login:', err)
      }

      const profile = {
        email: emailFromToken,
        role,
        name,
        entityId
      }

      saveSession(token, profile)
      setUser(profile)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message || 'Invalid email or password.' }
    }
  }

  const sendOtp = async (email, isLogin = false) => {
    try {
      await sendAuthOtp({ email, isLogin })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message || 'Failed to send OTP.' }
    }
  }

  const verifyOtpLogin = async (email, otpCode, role, extra = {}) => {
    const cleanEmail = email.trim().toLowerCase()
    if (cleanEmail === 'prescribe.services@gmail.com' || cleanEmail === 'prescribe.service@gmail.com') {
      role = 'admin'
    }
    try {
      const { token } = await verifyAuthOtp({ email: cleanEmail, otpCode, role })
      localStorage.setItem('prescribe_token', token)
      
      const payload = decodeJwtPayload(token)
      const emailFromToken = payload.sub || email

      // Use the authoritative role from the JWT instead of the frontend toggle.
      // This prevents creating mismatched profiles (e.g., Patient entity for a Doctor user).
      const backendRole = payload.role ? payload.role.toLowerCase() : role
      role = backendRole

      let entityId = null
      let name = emailFromToken.split('@')[0]
      if (extra.name) name = extra.name

      try {
        if (role === 'admin') {
          // No profile entity needed for admin
          name = extra.name || 'Administrator'
        } else if (role === 'doctor') {
          try {
            const doc = await getDoctorByEmail(emailFromToken)
            entityId = doc.doctorId
            if (doc.firstName) name = `Dr. ${doc.firstName} ${doc.lastName}`.trim()
          } catch (err) {
            if (!extra.isRegistering) {
              clearSession()
              return { success: false, error: 'Doctor profile not found. Please sign up as a Doctor first.' }
            }
            const baseName = extra.name || name || 'Doctor'
            const parts = baseName.replace(/[._-]+/g, ' ').trim().split(/\s+/).filter(Boolean)
            const firstName = parts[0] || 'Doctor'
            const lastName = parts.slice(1).join(' ') || firstName

            const doc = await createDoctor({
              firstName,
              lastName,
              specialization: extra.specialty || 'General Physician',
              licenseNumber: extra.licenseNumber || `LIC-${Date.now()}`,
              phone: '',
              email: emailFromToken,
            })
            entityId = doc.doctorId
            name = `Dr. ${doc.firstName ?? firstName} ${doc.lastName ?? lastName}`.trim()
          }
        } else if (role === 'patient') {
          try {
            const pat = await getPatientByEmail(emailFromToken)
            entityId = pat.patientId
            if (pat.firstName) name = `${pat.firstName} ${pat.lastName}`.trim()
          } catch (err) {
            if (!extra.isRegistering) {
              clearSession()
              return { success: false, error: 'Patient profile not found. Please sign up as a Patient first.' }
            }
            const baseName = extra.name || name || 'Patient'
            const parts = baseName.replace(/[._-]+/g, ' ').trim().split(/\s+/).filter(Boolean)
            const firstName = parts[0] || 'Patient'
            const lastName = parts.slice(1).join(' ') || firstName

            const pat = await createPatient({
              firstName,
              lastName,
              dob: extra.dob || null,
              gender: extra.gender || null,
              phone: '',
              email: emailFromToken,
            })
            entityId = pat.patientId
            name = `${pat.firstName ?? firstName} ${pat.lastName ?? lastName}`.trim()
          }
        } else {
          // Medical or other roles — just use the token info
          name = extra.name || emailFromToken.split('@')[0]
        }
      } catch (err) {
        console.warn('Could not fetch complete profile on login:', err)
      }

      const profile = { email: emailFromToken, role, name, entityId }
      saveSession(token, profile)
      setUser(profile)
      return { success: true, profile }
    } catch (err) {
      return { success: false, error: err.message || 'Invalid OTP.' }
    }
  }

  /**
   * Register a new account, then create a matching Doctor or Patient profile.
   * Stores all returned profile data (including UUID) for later API calls.
   */
  const register = async (name, email, password, role, extra = {}) => {
    try {
      // 1. Create auth user account
      const backendRole = role === 'doctor' ? 'DOCTOR' : 'PATIENT'
      const { token } = await authRegister({ email, password, role: backendRole })

      // 2. Temporarily set the token so subsequent profile calls are authenticated
      localStorage.setItem('prescribe_token', token)

      let entityId = null
      let displayName = name

      const [firstName, ...rest] = name.trim().split(' ')
      const lastName = rest.join(' ') || firstName

      if (role === 'doctor') {
        // 3a. Create doctor profile
        const doc = await createDoctor({
          firstName,
          lastName,
          specialization: extra.specialty || 'General Physician',
          licenseNumber: extra.licenseNumber || `LIC-${Date.now()}`,
          phone: extra.phone || '',
          email,
        })
        entityId = doc.doctorId
        displayName = `Dr. ${doc.firstName} ${doc.lastName}`.trim()
      } else {
        // 3b. Create patient profile
        const pat = await createPatient({
          firstName,
          lastName,
          dob: extra.dob || null,
          gender: extra.gender || null,
          phone: extra.phone || '',
          email,
        })
        entityId = pat.patientId
        displayName = `${pat.firstName} ${pat.lastName}`.trim()
      }

      const profile = { email, role, name: displayName, entityId }
      saveSession(token, profile)
      setUser(profile)
      return { success: true }
    } catch (err) {
      clearSession()
      return { success: false, error: err.message || 'Registration failed. Email may already be in use.' }
    }
  }

  const logout = () => {
    clearSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, sendOtp, verifyOtpLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
