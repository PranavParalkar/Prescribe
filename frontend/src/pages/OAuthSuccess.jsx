import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function OAuthSuccess() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const { oauthLogin } = useAuth()
  
  // Track to avoid react strict mode double execution breaking navigation
  const hasAttempted = useRef(false)

  useEffect(() => {
    if (hasAttempted.current) return
    hasAttempted.current = true

    const params = new URLSearchParams(search)
    const token = params.get('token')

    if (token) {
      const role = sessionStorage.getItem('oauth_role') || 'patient'
      
      oauthLogin(token, role).then((result) => {
        if (result.success) {
          sessionStorage.removeItem('oauth_role')
          navigate('/dashboard', { replace: true })
        } else {
          console.error("OAuth flow failed to complete.", result.error)
          navigate('/login')
        }
      })
    } else {
      console.warn("No token found in OAuth success redirect URL")
      navigate('/login')
    }
  }, [search, navigate, oauthLogin])

  return (
    <div className="min-h-screen w-screen bg-surface-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span className="text-slate-600 font-medium">Completing your secure login...</span>
      </div>
    </div>
  )
}
