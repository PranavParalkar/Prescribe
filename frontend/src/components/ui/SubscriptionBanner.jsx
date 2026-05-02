import { Link } from 'react-router-dom'
import { Crown, ArrowRight } from 'lucide-react'

/**
 * Compact upgrade banner shown on PatientDashboard when the patient
 * has exceeded the free prescription limit and doesn't have an active subscription.
 */
export default function SubscriptionBanner({ totalPrescriptions = 0, freeLimit = 3 }) {
  const overLimit = totalPrescriptions > freeLimit
  const remaining = Math.max(0, freeLimit - totalPrescriptions)

  // Banner 1: Still within free usage — show soft nudge
  if (!overLimit) {
    return (
      <div className="bg-gradient-to-r from-navy-50 to-teal-50 border border-navy-200/40 rounded-xl px-5 py-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4 text-navy-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Free Plan</p>
            <p className="text-[11px] text-slate-500">
              {remaining === 0
                ? "You've used all 3 free prescriptions"
                : `${remaining} of ${freeLimit} free prescriptions remaining`}
            </p>
          </div>
        </div>
        <Link
          to="/subscription"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors whitespace-nowrap"
        >
          View Plans <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    )
  }

  // Banner 2: Over the limit — urgent upgrade CTA
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border border-amber-200/60 rounded-xl px-5 py-4 mb-6">
      {/* Decorative gradient shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_3s_infinite] pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-200/50">
            <Crown className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Upgrade to Prescribe Pro</p>
            <p className="text-[11px] text-slate-500">
              Unlock {totalPrescriptions - freeLimit} locked prescription{totalPrescriptions - freeLimit !== 1 ? 's' : ''} — up to 50 total, just ₹29/month
            </p>
          </div>
        </div>
        <Link
          to="/subscription"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-navy-700 text-white text-xs font-bold rounded-lg
            hover:from-teal-600 hover:to-navy-800 transition-all duration-200 shadow-md shadow-teal-200/40 hover:shadow-lg shrink-0"
        >
          <Crown className="w-3.5 h-3.5" />
          Upgrade Now
        </Link>
      </div>
    </div>
  )
}
