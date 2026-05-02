import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function PatientLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/patient/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-slide-up">
        <Link to="/" className="text-teal-600 hover:text-teal-800 mb-6 inline-block">← Back</Link>
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-teal-500 rounded-2xl flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Patient Login</h2>
          <p className="text-gray-600 mt-2">View your prescriptions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              placeholder="patient@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-teal-500 text-white py-3 rounded-xl font-semibold hover:bg-teal-600 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}
