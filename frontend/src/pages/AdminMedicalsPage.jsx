import { useState, useEffect } from 'react'
import { getAdminMedicals, deleteAdminMedical } from '../api/api'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Store, CheckCircle2, Trash2 } from 'lucide-react'

export default function AdminMedicalsPage() {
  const [medicals, setMedicals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMedicals()
  }, [])

  const fetchMedicals = async () => {
    try {
      setLoading(true)
      const data = await getAdminMedicals()
      setMedicals(data)
    } catch (err) {
      setError(err.message || 'Failed to fetch medical stores')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (medicalId) => {
    if (!window.confirm("Are you sure you want to delete this medical store? This action cannot be undone.")) return;
    try {
      await deleteAdminMedical(medicalId)
      setMedicals(prev => prev.filter(m => m.medicalId !== medicalId))
    } catch (err) {
      alert(err.message || 'Failed to delete medical store')
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
          <p className="text-slate-500 font-medium">Loading medical stores...</p>
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
              onClick={fetchMedicals}
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
            <Store className="w-6 h-6 text-teal-500" />
            Registered Medical Stores
          </h1>
          <p className="text-sm text-slate-500 mt-1">View all medical stores in the system</p>
        </div>
        <div className="bg-teal-50 border border-teal-100 text-teal-700 px-4 py-2 rounded-lg font-semibold text-sm shadow-sm">
          {medicals.length} Total Store{medicals.length !== 1 ? 's' : ''}
        </div>
      </div>

      {medicals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-elev-2 border border-slate-100 p-16 text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Medical Stores Found!</h3>
          <p className="text-slate-500 text-sm">There are currently no medical stores registered in the system.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
          {medicals.map(store => (
            <div key={store.id} className="bg-white rounded-2xl shadow-elev-2 border border-slate-100 overflow-hidden flex flex-col transition-all hover:shadow-elev-3 hover:border-teal-100 group">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-navy-50 flex items-center justify-center text-navy-700 font-bold text-lg group-hover:scale-110 group-hover:bg-teal-50 group-hover:text-teal-700 transition-all">
                    {store.storeName?.[0] || 'M'}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-50 text-slate-700 border border-slate-200">
                    {store.status || 'Verified'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                  {store.storeName}
                </h3>
                <p className="text-xs text-slate-500 mb-1">License: {store.licenseNumber}</p>
                <p className="text-xs text-slate-500 mb-5">ID: {store.medicalId}</p>
              </div>
              <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => handleDelete(store.medicalId)}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
