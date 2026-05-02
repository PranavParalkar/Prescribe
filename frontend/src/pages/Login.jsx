import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Login() {
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') === 'patient' ? 'patient' : 'doctor'

  const [role, setRole] = useState(defaultRole)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const isDoctor = role === 'doctor'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 400)) // tiny mock delay
    const result = login(email, password, role)
    setLoading(false)
    if (result.success) {
      navigate(isDoctor ? '/doctor/dashboard' : '/patient/dashboard')
    } else {
      setError(result.error)
    }
  }

  const fillDemo = () => {
    setEmail(isDoctor ? 'doctor@prescribe.app' : 'patient@prescribe.app')
    setPassword(isDoctor ? 'doctor123' : 'patient123')
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isDoctor ? 'bg-gradient-to-br from-blue-600 to-blue-900' : 'bg-gradient-to-br from-teal-500 to-teal-800'}`}>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">

        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </Link>

        {/* Role tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-7">
          {['doctor', 'patient'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 capitalize ${
                role === r
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {r === 'doctor' ? '👨‍⚕️ Doctor' : '🧑‍💼 Patient'}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="mb-7">
          <h2 className="text-2xl font-bold text-slate-900">
            {isDoctor ? 'Doctor Sign In' : 'Patient Sign In'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isDoctor ? 'Access your prescription dashboard' : 'View your prescriptions'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isDoctor ? 'doctor@prescribe.app' : 'patient@prescribe.app'}
            required
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          <Button type="submit" fullWidth disabled={loading} className={`mt-1 py-3 rounded-xl ${isDoctor ? '' : 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-400'}`}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Signing in…
              </span>
            ) : 'Sign In'}
          </Button>
        </form>

        {/* Demo hint */}
        <div className="mt-5 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 mb-2">This is a demo. Use test credentials:</p>
          <button
            type="button"
            onClick={fillDemo}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Fill demo credentials
          </button>
        </div>
      </div>
    </div>
  )
}
