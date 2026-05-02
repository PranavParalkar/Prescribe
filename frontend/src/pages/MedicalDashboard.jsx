import { useState, useEffect } from 'react'
import { api } from '../api/api'
import { Store, Package, CheckCircle, Clock, AlertCircle, Eye, ArrowRight, ShieldCheck } from 'lucide-react'

export default function MedicalDashboard() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Respond Modal State
  const [showRespondModal, setShowRespondModal] = useState(false)
  const [activeOrder, setActiveOrder] = useState(null)
  const [availableItems, setAvailableItems] = useState('')
  const [totalCost, setTotalCost] = useState('')

  // Complete Modal State
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [patientId, setPatientId] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await api.get('/api/medicals/orders/medical')
      setOrders(res.data)
    } catch (err) {
      console.error('Error fetching orders', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRespondClick = (order) => {
    setActiveOrder(order)
    setAvailableItems(order.availableItems || '')
    setTotalCost(order.totalCost || '')
    setShowRespondModal(true)
  }

  const handleRespondSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/api/medicals/orders/${activeOrder.id}/respond`, {
        availableItems,
        totalCost: parseFloat(totalCost)
      })
      setShowRespondModal(false)
      fetchOrders()
    } catch (err) {
      console.error('Error responding to order', err)
      alert('Error responding to order')
    }
  }

  const handleCompleteClick = (order) => {
    setActiveOrder(order)
    setPatientId('')
    setShowCompleteModal(true)
  }

  const handleCompleteSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/api/medicals/orders/${activeOrder.id}/complete`, {
        patientId
      })
      setShowCompleteModal(false)
      fetchOrders()
    } catch (err) {
      console.error('Error completing order', err)
      alert('Error completing order. Please verify Patient ID.')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REQUESTED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full font-bold uppercase tracking-wider border border-yellow-200 shadow-sm"><AlertCircle className="w-3.5 h-3.5" /> New Request</span>
      case 'RESPONDED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-bold uppercase tracking-wider border border-blue-200 shadow-sm"><Clock className="w-3.5 h-3.5" /> Waiting for Patient</span>
      case 'ACCEPTED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full font-bold uppercase tracking-wider border border-emerald-200 shadow-sm"><CheckCircle className="w-3.5 h-3.5" /> Ready for Pickup</span>
      case 'COMPLETED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-700 text-xs rounded-full font-bold uppercase tracking-wider border border-slate-200 shadow-sm"><Package className="w-3.5 h-3.5" /> Completed</span>
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs rounded-full font-medium">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <svg className="animate-spin h-8 w-8 text-teal-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-slate-500 font-medium">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Store className="w-6 h-6 text-white" />
            </div>
            Store Dashboard
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage incoming prescription orders and provide quotations.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-teal-600 leading-none">{orders.filter(o => o.status === 'REQUESTED').length}</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">New Orders</span>
          </div>
          <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-emerald-600 leading-none">{orders.filter(o => o.status === 'ACCEPTED').length}</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">To Fulfill</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Active Orders</h3>
            <p className="text-slate-500 max-w-sm mx-auto">When patients forward their prescriptions to your store, they will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-5">Order ID</th>
                  <th className="p-5">Date</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-all duration-300 group">
                    <td className="p-5 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 group-hover:scale-110 transition-transform">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800 font-mono">
                            {order.id.split('-')[0]}
                          </div>
                          <div className="text-xs text-slate-500 font-medium">Ref: {order.prescriptionId.split('-')[0]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 align-middle">
                      <div className="text-sm font-semibold text-slate-700">
                        {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-5 align-middle">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="p-5 align-middle text-right">
                      {order.status === 'REQUESTED' && (
                        <div className="flex justify-end gap-2">
                          <a
                            href={`/prescription/${order.prescriptionId}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
                          >
                            <Eye className="w-4 h-4" /> View Rx
                          </a>
                          <button
                            onClick={() => handleRespondClick(order)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all shadow-md shadow-teal-500/20"
                          >
                            Quote <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {order.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleCompleteClick(order)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20 animate-pulse hover:animate-none"
                        >
                          <ShieldCheck className="w-4 h-4" /> Verify & Handover
                        </button>
                      )}
                      {order.status === 'RESPONDED' && (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                          Awaiting Customer
                        </span>
                      )}
                      {order.status === 'COMPLETED' && (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-400">
                          <CheckCircle className="w-4 h-4 text-emerald-500" /> Done
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Respond Modal */}
      {showRespondModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <form onSubmit={handleRespondSubmit}>
              <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-teal-50 to-emerald-50/30">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-teal-600 mb-4">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Provide Quotation</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Review the prescription and enter availability and total cost.</p>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Medicines Available</label>
                  <textarea
                    required
                    value={availableItems}
                    onChange={(e) => setAvailableItems(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none h-28 bg-slate-50 focus:bg-white transition-colors"
                    placeholder="e.g. Paracetamol 500mg (10 tabs)&#10;Amoxicillin 250mg (Not available)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Total Estimated Cost (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={totalCost}
                      onChange={(e) => setTotalCost(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50 focus:bg-white transition-colors font-bold text-slate-800"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowRespondModal(false)}
                  className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-md shadow-teal-500/20 transition-all"
                >
                  Submit Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <form onSubmit={handleCompleteSubmit}>
              <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-emerald-50 to-teal-50/30">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-600 mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Verify Patient Handover</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">To securely complete this order, enter the unique Patient ID provided by the customer.</p>
              </div>
              <div className="p-8">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Patient Unique ID</label>
                  <input
                    type="text"
                    required
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors font-mono font-bold tracking-wider text-slate-800 uppercase"
                    placeholder="PAT-XXXXXXXX"
                  />
                  <p className="text-xs font-medium text-slate-400 mt-2">The patient can find this ID in their profile or documents.</p>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all"
                >
                  Verify & Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
