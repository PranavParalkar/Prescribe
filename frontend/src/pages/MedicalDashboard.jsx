import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/api'
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, getLowStockAlerts, getExpiringAlerts, getMedicalDashboardStats, getFloatsForMedical, submitFloatQuote } from '../api/api'
import { Store, Package, CheckCircle, Clock, AlertCircle, Eye, ArrowRight, ShieldCheck, RefreshCw, IndianRupee, Plus, Pencil, Trash2, AlertTriangle, X, Search, ShoppingBag, Bell, BarChart3, Send } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import StatCard from '../components/ui/StatCard'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'floats', label: 'Float Requests', icon: Send },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'alerts', label: 'Alerts', icon: Bell },
]

export default function MedicalDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [inventory, setInventory] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [expiring, setExpiring] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [invSearch, setInvSearch] = useState('')

  // Modals
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [activeOrder, setActiveOrder] = useState(null)
  const [patientId, setPatientId] = useState('')

  // Confirm modal
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmOrder, setConfirmOrder] = useState(null)
  const [confirmForm, setConfirmForm] = useState({ availableItems: '', totalCost: 0 })

  // Float state
  const [nearbyFloats, setNearbyFloats] = useState([])
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [quoteFloat, setQuoteFloat] = useState(null)
  const [quoteForm, setQuoteForm] = useState({ availableItems: '', totalCost: 0 })

  // Item form
  const [itemForm, setItemForm] = useState({ medicineName:'', genericName:'', manufacturer:'', batchNumber:'', quantity:0, price:0, expiryDate:'', category:'', lowStockThreshold:10 })

  const fetchAll = useCallback(async () => {
    try {
      const [ordersRes, invRes, statsRes, lsRes, expRes] = await Promise.all([
        api.get('/api/medicals/orders/medical'),
        getInventory().catch(()=>[]),
        getMedicalDashboardStats().catch(()=>null),
        getLowStockAlerts().catch(()=>[]),
        getExpiringAlerts().catch(()=>[]),
      ])
      setOrders(ordersRes.data || [])
      setInventory(invRes || [])
      setStats(statsRes)
      setLowStock(lsRes || [])
      setExpiring(expRes || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  const fetchFloats = useCallback(async () => {
    try { const data = await getFloatsForMedical(); setNearbyFloats(data || []) }
    catch(e) { console.error(e) }
  }, [])

  useEffect(() => { fetchAll(); fetchFloats() }, [fetchAll, fetchFloats])

  const openAddItem = () => {
    setEditingItem(null)
    setItemForm({ medicineName:'', genericName:'', manufacturer:'', batchNumber:'', quantity:0, price:0, expiryDate:'', category:'', lowStockThreshold:10 })
    setShowItemModal(true)
  }

  const openEditItem = (item) => {
    setEditingItem(item)
    setItemForm({ medicineName:item.medicineName||'', genericName:item.genericName||'', manufacturer:item.manufacturer||'', batchNumber:item.batchNumber||'', quantity:item.quantity||0, price:item.price||0, expiryDate:item.expiryDate||'', category:item.category||'', lowStockThreshold:item.lowStockThreshold||10 })
    setShowItemModal(true)
  }

  const handleItemSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...itemForm, quantity: parseInt(itemForm.quantity), price: parseFloat(itemForm.price), lowStockThreshold: parseInt(itemForm.lowStockThreshold), expiryDate: itemForm.expiryDate || null }
      if (editingItem) { await updateInventoryItem(editingItem.id, payload) }
      else { await addInventoryItem(payload) }
      setShowItemModal(false)
      fetchAll()
    } catch(e) { alert('Error: ' + e.message) }
  }

  const handleDeleteItem = async (id) => {
    if (!confirm('Delete this item?')) return
    try { await deleteInventoryItem(id); fetchAll() } catch(e) { alert('Error: ' + e.message) }
  }

  const handleReadyClick = async (order) => {
    try { await api.post(`/api/medicals/orders/${order.id}/ready`); fetchAll() } catch(e) { alert('Error: ' + e.message) }
  }

  const handleCompleteClick = (order) => { setActiveOrder(order); setPatientId(''); setShowCompleteModal(true) }

  const handleCompleteSubmit = async (e) => {
    e.preventDefault()
    try { await api.post(`/api/medicals/orders/${activeOrder.id}/complete`, { patientId }); setShowCompleteModal(false); fetchAll() } catch(e) { alert('Error completing order. Verify Patient ID.') }
  }

  const handleConfirmClick = (order) => {
    setConfirmOrder(order)
    setConfirmForm({ availableItems: order.availableItems || '', totalCost: order.totalCost || 0 })
    setShowConfirmModal(true)
  }

  const handleConfirmSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/api/medicals/orders/${confirmOrder.id}/confirm`, {
        availableItems: confirmForm.availableItems,
        totalCost: parseFloat(confirmForm.totalCost)
      })
      setShowConfirmModal(false)
      fetchAll()
    } catch(e) { alert('Error confirming order: ' + (e.response?.data?.message || e.message)) }
  }

  const handleQuoteClick = (f) => {
    setQuoteFloat(f)
    setQuoteForm({ availableItems: '', totalCost: 0 })
    setShowQuoteModal(true)
  }

  const handleQuoteSubmit = async (e) => {
    e.preventDefault()
    try {
      await submitFloatQuote(quoteFloat.id, { availableItems: quoteForm.availableItems, totalCost: parseFloat(quoteForm.totalCost) })
      setShowQuoteModal(false)
      fetchFloats()
      alert('Quote submitted successfully!')
    } catch(e) { alert('Error: ' + e.message) }
  }

  const getStatusBadge = (status) => {
    const map = {
      'REQUESTED': ['bg-yellow-50 text-yellow-700 border-yellow-200', AlertCircle, 'New Request'],
      'PENDING_PAYMENT': ['bg-orange-50 text-orange-700 border-orange-200', Clock, 'Awaiting Payment'],
      'CONFIRMED': ['bg-blue-50 text-blue-700 border-blue-200', Clock, 'Confirmed'],
      'ACCEPTED': ['bg-indigo-50 text-indigo-700 border-indigo-200', CheckCircle, 'Paid'],
      'READY_FOR_PICKUP': ['bg-emerald-50 text-emerald-700 border-emerald-200', Package, 'Ready'],
      'COMPLETED': ['bg-slate-50 text-slate-600 border-slate-200', CheckCircle, 'Done'],
      'CANCELLED': ['bg-red-50 text-red-600 border-red-200', X, 'Cancelled'],
    }
    const [cls, Icon, label] = map[status] || ['bg-slate-50 text-slate-600 border-slate-200', Clock, status]
    return <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-bold uppercase tracking-wider border shadow-sm ${cls}`}><Icon className="w-3.5 h-3.5" />{label}</span>
  }

  const filteredInv = inventory.filter(i => i.medicineName?.toLowerCase().includes(invSearch.toLowerCase()) || i.genericName?.toLowerCase().includes(invSearch.toLowerCase()) || i.category?.toLowerCase().includes(invSearch.toLowerCase()))

  const totalAlerts = (lowStock?.length || 0) + (expiring?.length || 0)

  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <svg className="animate-spin h-8 w-8 text-teal-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p className="text-slate-500 font-medium">Loading dashboard...</p>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Store Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back, <span className="text-slate-600 font-semibold">{user?.name}</span>
          </p>
        </div>
        <button onClick={fetchAll} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-navy-700 hover:bg-navy-800 shadow-elev-1 transition-all duration-150 active:scale-95 cursor-pointer w-full sm:w-auto">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* ── Metric panels ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Inventory Items"
          value={stats?.totalInventoryItems ?? inventory.length}
          color="teal"
          meta="Total medicines in stock"
          icon={<Package className="w-4.5 h-4.5" />}
        />
        <StatCard
          label="Low Stock"
          value={stats?.lowStockCount ?? lowStock.length}
          color="amber"
          meta="Items below threshold"
          icon={<AlertTriangle className="w-4.5 h-4.5" />}
        />
        <StatCard
          label="Active Orders"
          value={orders.filter(o => o.status === 'CONFIRMED' || o.status === 'ACCEPTED').length}
          color="navy"
          meta="Pending fulfillment"
          icon={<ShoppingBag className="w-4.5 h-4.5" />}
        />
      </div>

      {/* Tabs */}
      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.id === 'alerts' && totalAlerts > 0 && <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{totalAlerts}</span>}
          </button>
        ))}
      </div>

      {/* ═══ ORDERS TAB ═══ */}
      {tab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-elev-2 overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center"><div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6"><Package className="w-10 h-10 text-slate-300" /></div><h3 className="text-xl font-bold text-slate-800 mb-2">No Orders Yet</h3><p className="text-slate-500 max-w-sm">Orders from patients will appear here.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500"><th className="p-5">Order</th><th className="p-5">Items</th><th className="p-5">Total</th><th className="p-5">Date</th><th className="p-5">Status</th><th className="p-5 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="p-5"><div className="text-sm font-bold text-slate-800 font-mono">{order.id?.split('-')[0]}</div></td>
                      <td className="p-5"><div className="text-sm text-slate-600 max-w-xs truncate">{order.items?.map(i => `${i.medicineName} x${i.quantity}`).join(', ') || order.availableItems || '—'}</div></td>
                      <td className="p-5"><div className="text-sm font-bold text-slate-800">₹{order.totalCost?.toFixed(2) || '0.00'}</div></td>
                      <td className="p-5"><div className="text-sm text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</div></td>
                      <td className="p-5">{getStatusBadge(order.status)}</td>
                      <td className="p-5 text-right">
                        {order.status === 'REQUESTED' && <button onClick={() => handleConfirmClick(order)} className="px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-all shadow-sm cursor-pointer"><Eye className="w-4 h-4 inline mr-1" />Review & Confirm</button>}
                        {(order.status === 'CONFIRMED' || order.status === 'ACCEPTED') && <button onClick={() => handleReadyClick(order)} className="px-4 py-2 bg-teal-500 text-white text-sm font-bold rounded-xl hover:bg-teal-600 transition-all shadow-sm cursor-pointer">Mark Ready</button>}
                        {order.status === 'READY_FOR_PICKUP' && <button onClick={() => handleCompleteClick(order)} className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-sm cursor-pointer animate-pulse hover:animate-none"><ShieldCheck className="w-4 h-4 inline mr-1" />Handover</button>}
                        {order.status === 'COMPLETED' && <span className="text-sm text-slate-400"><CheckCircle className="w-4 h-4 inline text-emerald-500 mr-1" />Done</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ FLOAT REQUESTS TAB ═══ */}
      {tab === 'floats' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-elev-2 overflow-hidden">
          {nearbyFloats.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center"><div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6"><Send className="w-10 h-10 text-slate-300" /></div><h3 className="text-xl font-bold text-slate-800 mb-2">No Float Requests</h3><p className="text-slate-500 max-w-sm">Nearby patient prescription requests will appear here.</p></div>
          ) : (
            <div className="divide-y divide-slate-100">
              {nearbyFloats.map(f => (
                <div key={f.id} className="p-5 hover:bg-slate-50/80 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-800">Float #{f.id?.split('-')[0]}</span>
                        <span className="text-xs text-slate-400">from {f.patientName || 'Patient'}</span>
                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${f.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{f.status}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">{f.medicineList || 'No details provided'}</p>
                      <p className="text-xs text-slate-400">{f.createdAt ? new Date(f.createdAt).toLocaleString() : ''}</p>
                      {f.quotes?.some(q => q.storeName) && <p className="text-xs text-indigo-500 mt-1 font-medium">{f.quotes.length} quote(s) submitted</p>}
                    </div>
                    {f.status === 'OPEN' && (
                      <button onClick={() => handleQuoteClick(f)} className="px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-all shadow-sm cursor-pointer shrink-0 flex items-center gap-1"><IndianRupee className="w-4 h-4" />Submit Quote</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ INVENTORY TAB ═══ */}
      {tab === 'inventory' && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="Search inventory..." value={invSearch} onChange={e => setInvSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white" /></div>
            <button onClick={openAddItem} className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold rounded-xl hover:from-teal-600 hover:to-emerald-600 shadow-md shadow-teal-500/20 flex items-center gap-2 cursor-pointer"><Plus className="w-4 h-4" />Add Medicine</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-elev-2 overflow-hidden">
            {filteredInv.length === 0 ? (
              <div className="p-12 text-center"><Package className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500 font-medium">No inventory items. Add your first medicine above.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500"><th className="p-4">Medicine</th><th className="p-4">Category</th><th className="p-4">Stock</th><th className="p-4">Price</th><th className="p-4">Expiry</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInv.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="p-4"><div className="text-sm font-bold text-slate-800">{item.medicineName}</div>{item.genericName && <div className="text-xs text-slate-400">{item.genericName}</div>}{item.manufacturer && <div className="text-xs text-slate-400">{item.manufacturer}</div>}</td>
                        <td className="p-4"><span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{item.category || 'General'}</span></td>
                        <td className="p-4"><span className={`text-sm font-bold ${item.lowStock ? 'text-red-600' : 'text-slate-800'}`}>{item.quantity}</span>{item.lowStock && <div className="text-[10px] text-red-500 font-bold">LOW STOCK</div>}</td>
                        <td className="p-4"><span className="text-sm font-bold text-slate-800">₹{item.price?.toFixed(2)}</span></td>
                        <td className="p-4">{item.expiryDate ? <span className={`text-sm ${item.expired ? 'text-red-600 font-bold' : item.expiringSoon ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>{item.expiryDate}{item.expired && ' ⚠ EXPIRED'}</span> : <span className="text-slate-400 text-sm">—</span>}</td>
                        <td className="p-4">{item.expired ? <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full font-bold border border-red-200">Expired</span> : item.lowStock ? <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full font-bold border border-amber-200">Low Stock</span> : <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full font-bold border border-emerald-200">In Stock</span>}</td>
                        <td className="p-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => openEditItem(item)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all cursor-pointer"><Pencil className="w-4 h-4" /></button><button onClick={() => handleDeleteItem(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"><Trash2 className="w-4 h-4" /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ ALERTS TAB ═══ */}
      {tab === 'alerts' && (
        <div className="space-y-6">
          {lowStock.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Low Stock ({lowStock.length})</h3>
              <div className="grid gap-3">{lowStock.map(item => (
                <div key={item.id} className="bg-white border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div><div className="font-bold text-slate-800">{item.medicineName}</div><div className="text-xs text-slate-500">{item.genericName || item.category || ''}</div></div>
                  <div className="text-right"><div className="text-lg font-black text-amber-600">{item.quantity}</div><div className="text-[10px] text-slate-400">Threshold: {item.lowStockThreshold}</div></div>
                </div>
              ))}</div>
            </div>
          )}
          {expiring.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4" />Expiring / Expired ({expiring.length})</h3>
              <div className="grid gap-3">{expiring.map(item => (
                <div key={item.id} className={`bg-white border rounded-2xl p-4 flex items-center justify-between shadow-sm ${item.expired ? 'border-red-300' : 'border-amber-200'}`}>
                  <div><div className="font-bold text-slate-800">{item.medicineName}</div><div className="text-xs text-slate-500">Batch: {item.batchNumber || 'N/A'}</div></div>
                  <div className="text-right"><div className={`text-sm font-bold ${item.expired ? 'text-red-600' : 'text-amber-600'}`}>{item.expiryDate}</div><div className="text-[10px] text-slate-400">{item.expired ? 'EXPIRED' : 'Expiring Soon'}</div></div>
                </div>
              ))}</div>
            </div>
          )}
          {totalAlerts === 0 && <div className="text-center py-16"><CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" /><h3 className="text-lg font-bold text-slate-800">All Clear!</h3><p className="text-slate-500">No stock or expiry alerts.</p></div>}
        </div>
      )}

      {/* ═══ ADD/EDIT ITEM MODAL ═══ */}
      {showItemModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleItemSubmit}>
              <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-teal-50 to-emerald-50/30">
                <h3 className="text-xl font-black text-slate-900">{editingItem ? 'Edit Medicine' : 'Add Medicine'}</h3>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key:'medicineName', label:'Medicine Name*', type:'text', required:true },
                  { key:'genericName', label:'Generic Name', type:'text' },
                  { key:'manufacturer', label:'Manufacturer', type:'text' },
                  { key:'batchNumber', label:'Batch Number', type:'text' },
                  { key:'category', label:'Category', type:'text' },
                ].map(f => <div key={f.key}><label className="block text-sm font-bold text-slate-700 mb-1">{f.label}</label><input type={f.type} required={f.required} value={itemForm[f.key]} onChange={e => setItemForm(p=>({...p,[f.key]:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm" /></div>)}
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-sm font-bold text-slate-700 mb-1">Quantity*</label><input type="number" required min="0" value={itemForm.quantity} onChange={e => setItemForm(p=>({...p,quantity:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm" /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-1">Price (₹)*</label><input type="number" required min="0" step="0.01" value={itemForm.price} onChange={e => setItemForm(p=>({...p,price:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm" /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-1">Low Alert</label><input type="number" min="1" value={itemForm.lowStockThreshold} onChange={e => setItemForm(p=>({...p,lowStockThreshold:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm" /></div>
                </div>
                <div><label className="block text-sm font-bold text-slate-700 mb-1">Expiry Date</label><input type="date" value={itemForm.expiryDate} onChange={e => setItemForm(p=>({...p,expiryDate:e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm" /></div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button type="button" onClick={() => setShowItemModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-md cursor-pointer">{editingItem ? 'Update' : 'Add Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ COMPLETE MODAL ═══ */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <form onSubmit={handleCompleteSubmit}>
              <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-emerald-50 to-teal-50/30">
                <h3 className="text-xl font-black text-slate-900">Verify Patient Handover</h3>
                <p className="text-sm text-slate-500 mt-1">Enter the Patient ID to complete.</p>
              </div>
              <div className="p-6"><input type="text" required value={patientId} onChange={e => setPatientId(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold tracking-wider uppercase" placeholder="PAT-XXXXXXXX" /></div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button type="button" onClick={() => setShowCompleteModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 shadow-md cursor-pointer">Verify & Complete</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ CONFIRM ORDER MODAL ═══ */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <form onSubmit={handleConfirmSubmit}>
              <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-amber-50 to-yellow-50/30">
                <h3 className="text-xl font-black text-slate-900">Review & Confirm Order</h3>
                <p className="text-sm text-slate-500 mt-1">Enter the available items and total cost for this request.</p>
              </div>
              <div className="p-6 space-y-4">
                {confirmOrder?.prescriptionId && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Prescription ID</p>
                    <p className="text-sm font-mono text-slate-700">{confirmOrder.prescriptionId}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Available Items*</label>
                  <textarea required rows={3} value={confirmForm.availableItems} onChange={e => setConfirmForm(p => ({...p, availableItems: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm" placeholder="e.g. Paracetamol 500mg x10, Amoxicillin 250mg x5..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Total Cost (₹)*</label>
                  <input type="number" required min="0" step="0.01" value={confirmForm.totalCost} onChange={e => setConfirmForm(p => ({...p, totalCost: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm" />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button type="button" onClick={() => setShowConfirmModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 shadow-md cursor-pointer">Confirm Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ QUOTE SUBMISSION MODAL ═══ */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <form onSubmit={handleQuoteSubmit}>
              <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-violet-50 to-indigo-50/30">
                <h3 className="text-xl font-black text-slate-900">Submit Quote</h3>
                <p className="text-sm text-slate-500 mt-1">Provide your price quote for this prescription request.</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Patient Needs</p>
                  <p className="text-sm text-slate-700">{quoteFloat?.medicineList || 'No details'}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Available Items*</label>
                  <textarea required rows={3} value={quoteForm.availableItems} onChange={e => setQuoteForm(p => ({...p, availableItems: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 text-sm" placeholder="List the items you can provide..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Total Cost (₹)*</label>
                  <input type="number" required min="0" step="0.01" value={quoteForm.totalCost} onChange={e => setQuoteForm(p => ({...p, totalCost: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 text-sm" />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button type="button" onClick={() => setShowQuoteModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 shadow-md cursor-pointer">Submit Quote</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
