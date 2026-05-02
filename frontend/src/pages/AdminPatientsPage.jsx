import { useState, useEffect } from 'react'
import { getAdminPatients } from '../api/api'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Users, CheckCircle2 } from 'lucide-react'

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const data = await getAdminPatients()
      setPatients(data)
    } catch (err) {
      setError(err.message || 'Failed to fetch patients')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <svg className="animate-spin h-8 w-8 text-teal-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-500 font-medium">Loading patients...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100 max-w-md w-full text-center shadow-sm">
            <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Error Loading Data</h3>
            <p className="text-sm text-slate-600">{error}</p>
            <button 
              onClick={fetchPatients}
              className="mt-6 w-full px-4 py-2 bg-navy-700 text-white rounded-xl hover:bg-navy-800 transition-colors font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-500" />
            Registered Patients
          </h1>
          <p className="text-sm text-slate-500 mt-1">View all patients in the system</p>
        </div>
        <div className="bg-teal-50 border border-teal-100 text-teal-700 px-4 py-2 rounded-lg font-semibold text-sm shadow-sm">
          {patients.length} Total Patient{patients.length !== 1 ? 's' : ''}
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-elev-2 border border-slate-100 p-16 text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Patients Found!</h3>
          <p className="text-slate-500 text-sm">There are currently no patients registered in the system.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
          {patients.map(patient => (
            <div key={patient.patientId} className="bg-white rounded-2xl shadow-elev-2 border border-slate-100 overflow-hidden flex flex-col transition-all hover:shadow-elev-3 hover:border-teal-100 group">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-navy-50 flex items-center justify-center text-navy-700 font-bold text-lg group-hover:scale-110 group-hover:bg-teal-50 group-hover:text-teal-700 transition-all">
                    {patient.firstName?.[0] || 'P'}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-50 text-slate-700 border border-slate-200">
                    Patient
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                  {patient.firstName} {patient.lastName}
                </h3>
                <p className="text-sm font-semibold text-teal-600 mb-2">{patient.email}</p>
                <p className="text-xs text-slate-500 mb-1">Phone: {patient.phone}</p>
                <p className="text-xs text-slate-500 mb-5">ID: {patient.patientId}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
