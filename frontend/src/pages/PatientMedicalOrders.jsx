import { useState, useEffect } from 'react'
import { api } from '../api/api'
import { searchMedicines, placeOrder } from '../api/api'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Search, ShoppingCart, Store, Package, CheckCircle, Clock, Trash2, Plus, Minus, X, CreditCard, MapPin } from 'lucide-react'

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return }
    const s = document.createElement('script'); s.id = 'razorpay-script'; s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true); s.onerror = () => resolve(false); document.body.appendChild(s)
  })
}

export default function PatientMedicalOrders() {
  const [tab, setTab] = useState('search') // search | cart | orders
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [cart, setCart] = useState([]) // [{inventoryItemId, medicineName, storeName, medicalId, price, qty, maxQty}]
  const [payingOrderId, setPayingOrderId] = useState(null)

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    try { const res = await api.get('/api/medicals/orders/patient'); setOrders(res.data || []) }
    catch(e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    try { const res = await searchMedicines(searchQuery); setSearchResults(res || []) }
    catch(e) { console.error(e) } finally { setSearching(false) }
  }

  const addToCart = (item, store) => {
    const existing = cart.find(c => c.inventoryItemId === store.inventoryItemId)
    if (existing) { setCart(cart.map(c => c.inventoryItemId === store.inventoryItemId ? {...c, qty: Math.min(c.qty+1, c.maxQty)} : c)); return }
    setCart([...cart, { inventoryItemId: store.inventoryItemId, medicineName: item.medicineName, storeName: store.storeName, medicalId: store.medicalId, price: store.price, qty: 1, maxQty: store.availableQuantity }])
  }

  const updateQty = (id, delta) => { setCart(cart.map(c => c.inventoryItemId === id ? {...c, qty: Math.max(1, Math.min(c.qty+delta, c.maxQty))} : c)) }
  const removeFromCart = (id) => { setCart(cart.filter(c => c.inventoryItemId !== id)) }

  // Group cart by store
  const cartByStore = cart.reduce((acc, item) => {
    if (!acc[item.medicalId]) acc[item.medicalId] = { storeName: item.storeName, medicalId: item.medicalId, items: [] }
    acc[item.medicalId].items.push(item); return acc
  }, {})

  const handlePlaceOrder = async (medicalId) => {
    const storeCart = cartByStore[medicalId]
    if (!storeCart) return
    try {
      setPayingOrderId(medicalId)
      const { data: orderData } = await api.post('/api/medicals/orders/place', {
        medicalId, items: storeCart.items.map(i => ({ inventoryItemId: i.inventoryItemId, quantity: i.qty }))
      })

      // Create Razorpay payment
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) { alert('Failed to load payment gateway.'); setPayingOrderId(null); return }

      const { data: paymentOrder } = await api.post(`/api/medicals/orders/${orderData.id}/create-payment`)

      const options = {
        key: paymentOrder.razorpayKeyId, amount: paymentOrder.totalCost * 100, currency: 'INR',
        name: 'Prescribe', description: `Order #${orderData.id.split('-')[0]}`,
        order_id: paymentOrder.razorpayOrderId,
        handler: async (response) => {
          try {
            await api.post(`/api/medicals/orders/${orderData.id}/accept`, {
              razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature,
            })
            setCart(cart.filter(c => c.medicalId !== medicalId))
            setTab('orders'); fetchOrders()
            alert('Payment successful! Your order has been placed.')
          } catch(e) { alert('Payment verification failed.') }
          finally { setPayingOrderId(null) }
        },
        theme: { color: '#006b7a' },
        modal: { ondismiss: () => setPayingOrderId(null) },
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (r) => { alert(`Payment failed: ${r.error.description}`); setPayingOrderId(null) })
      rzp.open()
    } catch(e) { alert('Error: ' + e.message); setPayingOrderId(null) }
  }

  const getStatusBadge = (status) => {
    const map = {
      'CONFIRMED': ['bg-blue-100 text-blue-800', 'Order Placed'],
      'ACCEPTED': ['bg-indigo-100 text-indigo-800', 'Payment Verified'],
      'READY_FOR_PICKUP': ['bg-emerald-100 text-emerald-800', '✅ Ready for Pickup'],
      'COMPLETED': ['bg-slate-100 text-slate-600', 'Completed'],
      'CANCELLED': ['bg-red-100 text-red-600', 'Cancelled'],
    }
    const [cls, label] = map[status] || ['bg-slate-100 text-slate-600', status]
    return <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${cls}`}>{label}</span>
  }

  const totalCartItems = cart.reduce((a,c) => a + c.qty, 0)

  return (
    <DashboardLayout>
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Pharmacy</h1>
        <p className="text-slate-500 mt-1">Search medicines, place orders, and track pickups.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
        {[
          { id:'search', label:'Search Medicines', icon: Search },
          { id:'cart', label:`Cart (${totalCartItems})`, icon: ShoppingCart },
          { id:'orders', label:'My Orders', icon: Package },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* ═══ SEARCH TAB ═══ */}
      {tab === 'search' && (
        <div>
          <form onSubmit={handleSearch} className="flex gap-3 mb-6">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search for medicines (e.g. Paracetamol, Amoxicillin...)" className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" /></div>
            <button type="submit" disabled={searching} className="px-6 py-3 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition-all disabled:opacity-50 cursor-pointer">{searching ? 'Searching...' : 'Search'}</button>
          </form>
          {searchResults.length === 0 && !searching && <div className="text-center py-12 text-slate-400"><Search className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p className="font-medium">Search for a medicine to see availability across stores.</p></div>}
          {searchResults.map((result, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100"><h3 className="font-bold text-slate-800">{result.medicineName}</h3><p className="text-xs text-slate-500">{result.stores?.length || 0} store(s) have this in stock</p></div>
              <div className="divide-y divide-slate-100">
                {result.stores?.map((store, si) => (
                  <div key={si} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600"><Store className="w-4 h-4" /></div>
                      <div><div className="text-sm font-bold text-slate-800">{store.storeName}</div><div className="text-xs text-slate-400">Qty: {store.availableQuantity} available{store.expiryDate && ` • Exp: ${store.expiryDate}`}</div></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-black text-slate-800">₹{store.price?.toFixed(2)}</div>
                      <button onClick={() => addToCart(result, store)} className="px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 transition-all cursor-pointer flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ CART TAB ═══ */}
      {tab === 'cart' && (
        <div>
          {cart.length === 0 ? (
            <div className="text-center py-16 text-slate-400"><ShoppingCart className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="font-bold text-slate-600">Your cart is empty</p><p className="text-sm mt-1">Search for medicines and add them to your cart.</p></div>
          ) : (
            Object.values(cartByStore).map(storeGroup => {
              const storeTotal = storeGroup.items.reduce((a,i) => a + i.price * i.qty, 0)
              return (
                <div key={storeGroup.medicalId} className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
                  <div className="px-5 py-3 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100 flex items-center gap-2"><Store className="w-4 h-4 text-teal-600" /><span className="font-bold text-slate-800">{storeGroup.storeName}</span></div>
                  <div className="divide-y divide-slate-100">
                    {storeGroup.items.map(item => (
                      <div key={item.inventoryItemId} className="px-5 py-3 flex items-center justify-between">
                        <div><div className="text-sm font-bold text-slate-800">{item.medicineName}</div><div className="text-xs text-slate-400">₹{item.price?.toFixed(2)} each</div></div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-slate-100 rounded-lg">
                            <button onClick={() => updateQty(item.inventoryItemId, -1)} className="p-1.5 hover:bg-slate-200 rounded-l-lg cursor-pointer"><Minus className="w-3 h-3" /></button>
                            <span className="px-2 text-sm font-bold">{item.qty}</span>
                            <button onClick={() => updateQty(item.inventoryItemId, 1)} className="p-1.5 hover:bg-slate-200 rounded-r-lg cursor-pointer"><Plus className="w-3 h-3" /></button>
                          </div>
                          <span className="text-sm font-bold text-slate-800 w-16 text-right">₹{(item.price * item.qty).toFixed(2)}</span>
                          <button onClick={() => removeFromCart(item.inventoryItemId)} className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-800">Total: ₹{storeTotal.toFixed(2)}</span>
                    <button onClick={() => handlePlaceOrder(storeGroup.medicalId)} disabled={payingOrderId === storeGroup.medicalId} className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold rounded-xl hover:from-teal-600 hover:to-emerald-600 shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />{payingOrderId === storeGroup.medicalId ? 'Processing...' : 'Pay & Order'}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ═══ ORDERS TAB ═══ */}
      {tab === 'orders' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> : orders.length === 0 ? (
            <div className="p-12 text-center text-slate-500"><Package className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p className="font-medium">No orders yet. Search for medicines to get started.</p></div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map(order => (
                <div key={order.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1"><h3 className="font-bold text-slate-800">Order #{order.id?.split('-')[0]}</h3><span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{order.storeName || 'Store'}</span>{getStatusBadge(order.status)}</div>
                      <p className="text-xs text-slate-400">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}</p>
                      {order.items?.length > 0 && <div className="mt-2 text-sm text-slate-600">{order.items.map(i => `${i.medicineName} x${i.quantity}`).join(', ')}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      {order.totalCost && <div className="text-lg font-bold text-slate-800">₹{order.totalCost.toFixed(2)}</div>}
                      {order.status === 'READY_FOR_PICKUP' && <div className="mt-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"><MapPin className="w-3 h-3" />Show Patient ID at store</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}
