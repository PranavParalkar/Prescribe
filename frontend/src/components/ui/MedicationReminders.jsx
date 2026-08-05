import { useState, useEffect } from 'react'
import { Clock, CheckCircle2, Circle, AlertCircle, Bell } from 'lucide-react'
import { getTodayReminders } from '../../api/api'

export default function MedicationReminders({ patientId }) {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!patientId) return
    getTodayReminders(patientId)
      .then(res => {
        setReminders(res.data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [patientId])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-elev-2 flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  const sorted = [...reminders].sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-elev-2 h-full flex flex-col min-h-[300px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
            <Bell className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Today's Schedule</h2>
            <p className="text-xs font-medium text-slate-400">Medication Reminders</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center mt-8">
            <AlertCircle className="w-8 h-8 text-slate-200 mb-2" />
            <p className="text-sm font-semibold text-slate-400">No medications scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map(reminder => {
              const date = new Date(reminder.scheduledTime)
              const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              const isPast = date < new Date() && !reminder.sent
              const isSent = reminder.sent
              
              return (
                <div key={reminder.id} className="flex gap-4 p-4 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center gap-1 mt-0.5">
                    {isSent ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-500" />
                    ) : isPast ? (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                    <div className="w-px h-full bg-slate-200 rounded-full mt-1"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{reminder.medicineName}</h4>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{reminder.dosage || 'Standard dose'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-100 shadow-sm">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">{timeString}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
