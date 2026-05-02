import { useState, useEffect } from 'react'
import { api } from '../api/api'

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
      case 'REQUESTED': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">New Request</span>
      case 'RESPONDED': return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Waiting for Patient</span>
      case 'ACCEPTED': return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Ready for Pickup</span>
      case 'COMPLETED': return <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs rounded-full font-medium">Completed</span>
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs rounded-full font-medium">{status}</span>
    }
  }

  if (loading) return <div className="p-8">Loading dashboard...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Medical Orders Dashboard</h1>
        <p className="text-slate-500 mt-1">Manage prescription requests from doctors and patients.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No orders found.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold">Order ID</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="text-sm font-medium text-slate-800">
                      {order.id.split('-')[0]}...
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="p-4 text-right">
                    {order.status === 'REQUESTED' && (
                      <button
                        onClick={() => handleRespondClick(order)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Respond with Quote
                      </button>
                    )}
                    {order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleCompleteClick(order)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Verify & Complete
                      </button>
                    )}
                    {order.status === 'RESPONDED' && (
                      <span className="text-sm text-slate-400">Waiting...</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Respond Modal */}
      {showRespondModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <form onSubmit={handleRespondSubmit}>
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Respond to Order</h3>
                <p className="text-sm text-slate-500">Provide availability and cost details.</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Available Items</label>
                  <textarea
                    required
                    value={availableItems}
                    onChange={(e) => setAvailableItems(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none h-24"
                    placeholder="e.g. Paracetamol 500mg, Amoxicillin 250mg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Cost ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowRespondModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Send Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <form onSubmit={handleCompleteSubmit}>
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Verify Patient</h3>
                <p className="text-sm text-slate-500">Enter the patient's unique ID to verify identity and hand over medicines.</p>
              </div>
              <div className="p-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Patient ID</label>
                  <input
                    type="text"
                    required
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                    placeholder="Enter Patient ID"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                >
                  Complete Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
