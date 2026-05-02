import { useState, useEffect } from 'react'
import { api } from '../api/api'

export default function PatientMedicalOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await api.get('/api/medicals/orders/patient')
      setOrders(res.data)
    } catch (err) {
      console.error('Error fetching patient orders', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptQuote = async (order) => {
    try {
      // Assuming Razorpay or payment logic would go here.
      // For now, we simulate success by calling accept
      await api.post(`/api/medicals/orders/${order.id}/accept`)
      alert('Order Accepted and Payment Successful!')
      fetchOrders()
    } catch (err) {
      console.error('Error accepting quote', err)
      alert('Failed to accept quote.')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REQUESTED': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">Forwarded to Store</span>
      case 'RESPONDED': return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Quote Received</span>
      case 'ACCEPTED': return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Paid - Ready for Pickup</span>
      case 'COMPLETED': return <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs rounded-full font-medium">Completed</span>
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs rounded-full font-medium">{status}</span>
    }
  }

  if (loading) return <div className="p-8">Loading your orders...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">My Medical Orders</h1>
        <p className="text-slate-500 mt-1">Track prescriptions you have forwarded to medical stores.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            You haven't forwarded any prescriptions to a medical store yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-800">Order #{order.id.split('-')[0]}</h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-slate-500 mb-1">
                    <span className="font-medium text-slate-700">Date:</span> {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  {order.availableItems && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                      <p className="font-medium text-slate-700 mb-1">Store Message:</p>
                      <p className="text-slate-600 whitespace-pre-wrap">{order.availableItems}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {order.totalCost && (
                    <div className="text-lg font-bold text-slate-800">
                      ${order.totalCost.toFixed(2)}
                    </div>
                  )}
                  {order.status === 'RESPONDED' && (
                    <button
                      onClick={() => handleAcceptQuote(order)}
                      className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                    >
                      Accept & Pay
                    </button>
                  )}
                  {order.status === 'ACCEPTED' && (
                    <div className="text-sm text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-lg text-center">
                      Payment confirmed.<br/>Provide Patient ID at store.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
