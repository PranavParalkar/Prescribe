import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Crown, Shield, Zap, Clock, ArrowLeft, Sparkles, Lock } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { getSubscriptionStatus, createSubscriptionOrder, verifySubscriptionPayment } from '../api/api'

// ── Razorpay script loader ─────────────────────────────────────────────────
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

export default function SubscriptionPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [subStatus, setSubStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.entityId) return
    getSubscriptionStatus(user.entityId)
      .then(setSubStatus)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user?.entityId])

  const handleSubscribe = async () => {
    setError(null)
    setPaying(true)

    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay. Please check your internet connection.')
      }

      const order = await createSubscriptionOrder(user.entityId)

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Prescribe',
        description: `${order.planName} — Monthly Subscription`,
        order_id: order.orderId,
        handler: async (response) => {
          try {
            const result = await verifySubscriptionPayment({
              patientId: user.entityId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            setSubStatus(result)
            setSuccess(true)
            setPaying(false)
          } catch (err) {
            setError(err.message)
            setPaying(false)
          }
        },
        prefill: {
          email: user?.email || '',
          contact: '',
        },
        theme: {
          color: '#006b7a',
        },
        modal: {
          ondismiss: () => {
            setPaying(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        setError(`Payment failed: ${response.error.description}`)
        setPaying(false)
      })
      rzp.open()
    } catch (err) {
      setError(err.message)
      setPaying(false)
    }
  }

  // ── Success State ───────────────────────────────────────────────────────
  if (success) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md animate-[scaleIn_0.4s_ease-out]">
            {/* Success circle */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-200">
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Prescribe Pro!</h2>
            <p className="text-sm text-slate-500 mb-1">Your subscription is now active.</p>
            <p className="text-xs text-slate-400 mb-8">
              Valid until <span className="font-semibold text-slate-600">{subStatus?.endDate?.split('T')[0]}</span>
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-navy-700 text-white rounded-xl font-semibold text-sm hover:bg-navy-800 transition-all duration-200 shadow-elev-2 hover:shadow-elev-3 cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* ── Back link ──────────────────────────────────────────── */}
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-amber-700 tracking-wide uppercase">Subscription Plans</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">
            Choose Your Plan
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Start free with 3 prescriptions, then unlock unlimited access for just ₹29/month.
          </p>
        </div>

        {/* ── Error ──────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6 text-center">
            {error}
          </div>
        )}

        {/* ── Loading ────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[0, 1].map(i => (
              <div key={i} className="h-96 bg-slate-100 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Active subscription banner ──────────────────────── */}
            {subStatus?.subscribed && (
              <div className="bg-gradient-to-r from-teal-50 to-navy-50 border border-teal-200/60 rounded-2xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Prescribe Pro — Active</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Your subscription is active until{' '}
                      <span className="font-semibold text-slate-700">{subStatus.endDate?.split('T')[0]}</span>
                      {subStatus.daysRemaining > 0 && ` (${subStatus.daysRemaining} days remaining)`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Pricing cards ───────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ─── Free Plan ───────────────────────────────────── */}
              <div className="relative bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-elev-1">
                <div className="mb-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Starter</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-800">₹0</span>
                    <span className="text-sm text-slate-400">/forever</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Get started with essential features</p>
                </div>

                <div className="flex-1 space-y-3 mb-6">
                  {[
                    'Up to 3 prescriptions',
                    'View prescription details',
                    'Search & filter records',
                    'Basic dashboard access',
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-4.5 h-4.5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-slate-500" strokeWidth={3} />
                      </div>
                      <span className="text-sm text-slate-600">{f}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="w-full py-2.5 rounded-xl bg-slate-50 text-center text-sm font-semibold text-slate-400">
                    {subStatus?.subscribed
                      ? 'Upgraded'
                      : (subStatus?.totalPrescriptions ?? 0) >= (subStatus?.freeLimit ?? 3)
                        ? 'Limit Reached'
                        : 'Current Plan'
                    }
                  </div>
                </div>
              </div>

              {/* ─── Pro Plan ────────────────────────────────────── */}
              <div className="relative bg-gradient-to-br from-white to-teal-50/30 border-2 border-teal-500/30 rounded-2xl p-6 flex flex-col shadow-elev-3">
                {/* Popular badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-teal-500 to-navy-700 text-white text-[10px] font-bold uppercase tracking-[0.12em] px-4 py-1 rounded-full shadow-lg">
                    Recommended
                  </div>
                </div>

                <div className="mb-6 mt-2">
                  <p className="text-[10px] font-bold text-teal-600 uppercase tracking-[0.15em] mb-2">Prescribe Pro</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-800">₹29</span>
                    <span className="text-sm text-slate-400">/month</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Unlimited access to all your prescriptions</p>
                </div>

                <div className="flex-1 space-y-3 mb-6">
                  {[
                    { text: 'Unlimited prescriptions', icon: Zap },
                    { text: 'Full prescription history', icon: Clock },
                    { text: 'Priority access to records', icon: Shield },
                    { text: 'Secure document downloads', icon: Lock },
                    { text: 'Premium support', icon: Crown },
                  ].map(({ text, icon: Icon }, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-4.5 h-4.5 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                        <Icon className="w-3 h-3 text-teal-600" strokeWidth={2.5} />
                      </div>
                      <span className="text-sm text-slate-700 font-medium">{text}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-teal-100">
                  {subStatus?.subscribed ? (
                    <div className="w-full py-2.5 rounded-xl bg-teal-50 text-center text-sm font-semibold text-teal-600">
                      ✓ Active — {subStatus.daysRemaining} days remaining
                    </div>
                  ) : (
                    <button
                      onClick={handleSubscribe}
                      disabled={paying}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-navy-700 text-white text-sm font-bold
                        hover:from-teal-600 hover:to-navy-800 active:from-teal-700 active:to-navy-900
                        transition-all duration-200 shadow-lg shadow-teal-200/50 hover:shadow-xl hover:shadow-teal-200/60
                        disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer
                        flex items-center justify-center gap-2"
                    >
                      {paying ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Processing…
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Subscribe Now — ₹29/month
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Trust badges ────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-teal-500" />
                <span>Secure Payments via Razorpay</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-teal-500" />
                <span>256-bit SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-500" />
                <span>Cancel Anytime</span>
              </div>
            </div>

            {/* ── FAQ ─────────────────────────────────────────────── */}
            <div className="mt-12 mb-4">
              <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">Frequently Asked Questions</h3>
              <div className="space-y-3 max-w-lg mx-auto">
                {[
                  { q: 'What happens after the free 3 prescriptions?', a: 'You can still receive prescriptions from your doctor, but viewing them requires an active Pro subscription.' },
                  { q: 'Can I cancel anytime?', a: 'Yes. Your subscription stays active until the end of the billing period. No auto-renewal.' },
                  { q: 'What payment methods are accepted?', a: 'We accept UPI, credit/debit cards, net banking, and wallets through Razorpay.' },
                ].map(({ q, a }, i) => (
                  <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 shadow-elev-1">
                    <p className="text-sm font-semibold text-slate-700">{q}</p>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
