import { useState, useEffect } from 'react'
import { api } from '../api/api'
import DashboardLayout from '../components/layout/DashboardLayout'

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function PatientMedicalOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [payingOrderId, setPayingOrderId] = useState(null)

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
      setPayingOrderId(order.id)
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        alert('Failed to load Razorpay. Please check your internet connection.')
        setPayingOrderId(null)
        return
      }

      // Step 1: Create payment order
      const { data: paymentOrder } = await api.post(`/api/medicals/orders/${order.id}/create-payment`)
      
      const options = {
        key: paymentOrder.razorpayKeyId,
        amount: paymentOrder.totalCost * 100,
        currency: 'INR',
        name: 'Prescribe',
        description: `Payment for Order #${order.id.split('-')[0]}`,
        order_id: paymentOrder.razorpayOrderId,
        handler: async (response) => {
          try {
            await api.post(`/api/medicals/orders/${order.id}/accept`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            alert('Order Accepted and Payment Successful!')
            fetchOrders()
          } catch (err) {
            console.error('Error verifying payment', err)
            alert('Payment verification failed.')
          } finally {
            setPayingOrderId(null)
          }
        },
        theme: {
          color: '#006b7a',
        },
        modal: {
          ondismiss: () => {
            setPayingOrderId(null)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        alert(`Payment failed: ${response.error.description}`)
        setPayingOrderId(null)
      })
      rzp.open()
    } catch (err) {
      console.error('Error initiating payment', err)
      alert('Failed to initiate payment.')
      setPayingOrderId(null)
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

  if (loading) return <DashboardLayout><div className="p-8">Loading your orders...</div></DashboardLayout>

  return (
    <DashboardLayout>
    <div className="max-w-6xl">
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
                    <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">{order.storeName || 'Unknown Store'}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-slate-500 mb-1">
                    <span className="font-medium text-slate-700">Date:</span> {new Date(order.createdAt).toLocaleDateString()}
                    <span className="mx-2">•</span>
                    <span className="font-medium text-slate-700">Store ID:</span> {order.medicalIdString || order.medicalId}
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
                      disabled={payingOrderId === order.id}
                      className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {payingOrderId === order.id ? 'Loading...' : 'Accept & Pay'}
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
    </DashboardLayout>
  )
}
