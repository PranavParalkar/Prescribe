import { useState, useEffect } from 'react'
import { getPendingDoctors, approveDoctor, rejectDoctor, getDoctorLicenseUrl } from '../api/api'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Sparkles, FileText, CheckCircle2, XCircle } from 'lucide-react'

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPendingDoctors()
  }, [])

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true)
      const data = await getPendingDoctors()
      setDoctors(data)
    } catch (err) {
      setError(err.message || 'Failed to fetch pending doctors')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (doctorId) => {
    try {
      await approveDoctor(doctorId)
      setDoctors(doctors.filter(d => d.doctorId !== doctorId))
    } catch (err) {
      alert(err.message || 'Failed to approve doctor')
    }
  }

  const handleReject = async (doctorId) => {
    try {
      await rejectDoctor(doctorId)
      setDoctors(doctors.filter(d => d.doctorId !== doctorId))
    } catch (err) {
      alert(err.message || 'Failed to reject doctor')
    }
  }

  const handleViewLicense = async (doctorId) => {
    try {
      const data = await getDoctorLicenseUrl(doctorId)
      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (err) {
      alert(err.message || 'Failed to load license document')
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
          <p className="text-slate-500 font-medium">Loading pending doctors...</p>
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
              onClick={fetchPendingDoctors}
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
            <Sparkles className="w-6 h-6 text-teal-500" />
            Verification Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">Review and approve pending doctor registrations</p>
        </div>
        <div className="bg-teal-50 border border-teal-100 text-teal-700 px-4 py-2 rounded-lg font-semibold text-sm shadow-sm">
          {doctors.length} Pending Request{doctors.length !== 1 ? 's' : ''}
        </div>
      </div>

      {doctors.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-elev-2 border border-slate-100 p-16 text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">All Caught Up!</h3>
          <p className="text-slate-500 text-sm">There are currently no pending doctor verifications.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
          {doctors.map(doctor => (
            <div key={doctor.doctorId} className="bg-white rounded-2xl shadow-elev-2 border border-slate-100 overflow-hidden flex flex-col transition-all hover:shadow-elev-3 hover:border-teal-100 group">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-navy-50 flex items-center justify-center text-navy-700 font-bold text-lg group-hover:scale-110 group-hover:bg-teal-50 group-hover:text-teal-700 transition-all">
                    {doctor.firstName?.[0] || 'D'}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                    Pending
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                  Dr. {doctor.firstName} {doctor.lastName}
                </h3>
                <p className="text-sm font-semibold text-teal-600 mb-5">{doctor.specialization || 'General Physician'}</p>
                
                {doctor.licenseDocumentUrl ? (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between transition-colors hover:border-teal-200 hover:bg-white">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-teal-100/50 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-teal-600" />
                      </div>
                      <span className="text-xs text-slate-700 font-semibold truncate">License Document</span>
                    </div>
                    <button
                      onClick={() => handleViewLicense(doctor.doctorId)}
                      className="text-xs text-navy-600 hover:text-white hover:bg-navy-700 font-semibold shrink-0 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 hover:border-navy-700 transition-all"
                    >
                      View
                    </button>
                  </div>
                ) : (
                  <div className="bg-red-50 p-3.5 rounded-xl border border-red-100 flex items-center gap-2.5">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-xs font-medium text-red-700">No document uploaded</span>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button
                  onClick={() => handleReject(doctor.doctorId)}
                  className="flex-1 py-2.5 px-4 text-sm font-semibold text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded-xl transition-all shadow-sm hover:shadow active:scale-95"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(doctor.doctorId)}
                  className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-sm hover:shadow-elev-2 shadow-teal-200 active:scale-95"
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
