import { useState, useEffect } from 'react'
import { User as UserIcon, Phone, Mail, Award, Activity, Calendar, Save, Trash2, ShieldCheck, AlertCircle, Bell } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { getDoctorByEmail, getPatientByEmail, updateDoctorProfile, updatePatientProfile, deleteDoctorProfile } from '../api/api'
import { useNavigate } from 'react-router-dom'

export default function ProfileSettings() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  // Validation rules
  const VALIDATORS = {
    firstName: v => /^[a-zA-Z\s]{2,50}$/.test(v?.trim()) ? '' : 'Must be 2–50 letters only',
    lastName:  v => /^[a-zA-Z\s]{2,50}$/.test(v?.trim()) ? '' : 'Must be 2–50 letters only',
    phone:     v => !v || /^\+?[\d\s\-]{10,20}$/.test(v) ? '' : 'Must be 10–20 digits (can include +, spaces, dashes)',
    licenseNumber: v => !v || /^[a-zA-Z0-9\-]{5,20}$/.test(v) ? '' : 'Must be 5–20 alphanumeric characters',
    dob: (v, role) => {
      if (role === 'doctor' && !v) return 'Date of birth is required for doctors'
      if (!v) return ''
      const age = Math.floor((new Date() - new Date(v)) / (365.25 * 24 * 3600 * 1000))
      if (role === 'doctor' && age < 18) return 'Doctors must be at least 18 years old'
      if (age > 120) return 'Please enter a valid date'
      return ''
    },
  }

  const validateField = (name, value) => {
    const validator = VALIDATORS[name]
    if (!validator) return ''
    return validator(value, user.role)
  }

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    address: '',
    profileImage: '',
    smsNotificationsEnabled: true,
    whatsappNotificationsEnabled: false
  })

  useEffect(() => {
    let cancelled = false
    const fetchProfile = async () => {
      try {
        setLoading(true)
        let data
        if (user.role === 'doctor') {
          data = await getDoctorByEmail(user.email)
        } else {
          data = await getPatientByEmail(user.email)
        }

        if (!cancelled) {
          setFormData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || '',
            specialization: data.specialization || '',
            licenseNumber: data.licenseNumber || '',
            dob: data.dob || '',
            gender: data.gender || '',
            bloodGroup: data.bloodGroup || '',
            address: data.address || '',
            profileImage: data.profileImage || '',
            smsNotificationsEnabled: data.smsNotificationsEnabled ?? true,
            whatsappNotificationsEnabled: data.whatsappNotificationsEnabled ?? false
          })
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load profile data.')
          setLoading(false)
        }
      }
    }

    fetchProfile()
    return () => { cancelled = true }
  }, [user.role, user.email])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const val = type === 'checkbox' ? checked : value
    setFormData(prev => ({ ...prev, [name]: val }))
    // Real-time validation
    if (type !== 'checkbox') {
      const fieldError = validateField(name, val)
      setFieldErrors(prev => ({ ...prev, [name]: fieldError }))
    }
    if (success) setSuccess(null)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError('Photo must be less than 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profileImage: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Run all validators before submitting
    const newErrors = {}
    const fieldsToValidate = ['firstName', 'lastName', 'phone', 'licenseNumber', 'dob']
    fieldsToValidate.forEach(field => {
      const err = validateField(field, formData[field])
      if (err) newErrors[field] = err
    })
    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors)
      setError('Please fix the highlighted fields before saving.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const entityId = user.entityId
      if (!entityId) throw new Error('Entity ID not found. Please log in again.')

      let updatedProfile
      if (user.role === 'doctor') {
        updatedProfile = await updateDoctorProfile(entityId, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          specialization: formData.specialization,
          licenseNumber: formData.licenseNumber,
          dob: formData.dob || null,
          address: formData.address,
          profileImage: formData.profileImage
        })
      } else {
        updatedProfile = await updatePatientProfile(entityId, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          dob: formData.dob || null,
          gender: formData.gender,
          bloodGroup: formData.bloodGroup,
          address: formData.address,
          profileImage: formData.profileImage,
          smsNotificationsEnabled: formData.smsNotificationsEnabled,
          whatsappNotificationsEnabled: formData.whatsappNotificationsEnabled
        })
      }

      const newName = user.role === 'doctor' 
        ? `Dr. ${updatedProfile.firstName} ${updatedProfile.lastName}`.trim()
        : `${updatedProfile.firstName} ${updatedProfile.lastName}`.trim()
      
      updateUser({ 
        name: newName, 
        profileImage: updatedProfile.profileImage || formData.profileImage
      })
      setSuccess('Profile updated successfully!')
    } catch (err) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }
    try {
      if (user.role === 'doctor') {
        await deleteDoctorProfile(user.entityId)
      } else {
        alert('Patient deletion is not implemented yet.')
        return
      }
      logout()
      navigate('/login')
    } catch (err) {
      setError(err.message || 'Failed to delete account.')
    }
  }

  const isDoctor = user.role === 'doctor'

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  const inputCls = (field) => `w-full px-4 py-2.5 rounded-xl border ${fieldErrors[field] ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'} bg-white text-slate-800 placeholder-slate-400 outline-none focus:ring-4 transition-all duration-200`
  const labelCls = "block text-sm font-semibold text-slate-700 mb-1.5 ml-1"
  const FieldErr = ({ field }) => fieldErrors[field] ? (
    <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 shrink-0" />{fieldErrors[field]}
    </p>
  ) : null

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profile Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your professional and personal information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Quick info & status */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-elev-2 flex flex-col items-center">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-4 overflow-hidden">
                  {formData.profileImage ? (
                    <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-teal-600">
                      {formData.firstName?.[0]}{formData.lastName?.[0]}
                    </span>
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer mb-4">
                  <span className="text-white text-[10px] font-bold uppercase tracking-wider">Change</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
              <h2 className="text-lg font-bold text-slate-900 text-center">
                {isDoctor ? `Dr. ${formData.firstName}` : formData.firstName} {formData.lastName}
              </h2>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">
                {user.role}
              </p>
              
              <div className="w-full border-t border-slate-50 my-6" />
              
              <div className="w-full space-y-4">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{user.email}</span>
                </div>
                {formData.phone && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{formData.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span className="font-bold">ID: {user?.entityId}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-teal-500" />
                  <span className="text-teal-700 font-medium whitespace-nowrap">Account Verified</span>
                </div>
              </div>
            </div>

            {success && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 animate-slideUp">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex-shrink-0 flex items-center justify-center">
                  <Save className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900">Success</p>
                  <p className="text-xs text-emerald-700 mt-0.5">{success}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 animate-slideUp">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-900">Error</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Main form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-elev-2 flex flex-col">
              <div className="p-6 sm:p-8 space-y-8">
                {/* Section: Basic Info */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-indigo-500" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Basic Information</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="firstName" className={labelCls}>First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={inputCls('firstName')}
                        placeholder="John"
                        required
                      />
                      <FieldErr field="firstName" />
                    </div>
                    <div>
                      <label htmlFor="lastName" className={labelCls}>Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={inputCls('lastName')}
                        placeholder="Doe"
                        required
                      />
                      <FieldErr field="lastName" />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="phone" className={labelCls}>Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className={`${inputCls('phone')} pl-11`}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      <FieldErr field="phone" />
                    </div>
                    <div className="sm:col-span-2">
                       <label htmlFor="address" className={labelCls}>Residential Address</label>
                       <textarea
                         id="address"
                         name="address"
                         value={formData.address}
                         onChange={handleChange}
                         rows="3"
                         className={`${inputCls('address')} resize-none`}
                         placeholder="123 Health St, Medical City, MC 54321"
                       />
                       <FieldErr field="address" />
                    </div>
                  </div>
                </div>

                {/* Section: Professional (Doctor) / Personal (Patient) */}
                <div className="pt-8 border-t border-slate-50">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                      {isDoctor ? <Award className="w-4 h-4 text-teal-500" /> : <Activity className="w-4 h-4 text-teal-500" />}
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      {isDoctor ? 'Professional Details' : 'Personal Details'}
                    </h3>
                  </div>

                  {isDoctor ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="dob" className={labelCls}>Date of Birth (18+ Required)</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="date"
                            id="dob"
                            name="dob"
                            value={formData.dob}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={handleChange}
                            className={`${inputCls('dob')} pl-11`}
                            required
                          />
                        </div>
                        <FieldErr field="dob" />
                      </div>
                      <div>
                        <label htmlFor="specialization" className={labelCls}>Specialization</label>
                        <select
                          id="specialization"
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleChange}
                          className={inputCls('specialization')}
                        >
                          <option value="General Physician">General Physician</option>
                          <option value="Cardiologist">Cardiologist</option>
                          <option value="Dermatologist">Dermatologist</option>
                          <option value="Neurologist">Neurologist</option>
                          <option value="Orthopedic">Orthopedic</option>
                          <option value="Pediatrician">Pediatrician</option>
                          <option value="Psychiatrist">Psychiatrist</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="licenseNumber" className={labelCls}>License Number</label>
                        <input
                          type="text"
                          id="licenseNumber"
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleChange}
                          className={inputCls('licenseNumber')}
                          placeholder="LIC-12345678"
                        />
                        <FieldErr field="licenseNumber" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="dob" className={labelCls}>Date of Birth</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="date"
                            id="dob"
                            name="dob"
                            value={formData.dob}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={handleChange}
                            className={`${inputCls('dob')} pl-11`}
                          />
                        </div>
                        <FieldErr field="dob" />
                      </div>
                      <div>
                        <label htmlFor="gender" className={labelCls}>Gender</label>
                        <select
                          id="gender"
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className={inputCls('gender')}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="bloodGroup" className={labelCls}>Blood Group</label>
                        <select
                          id="bloodGroup"
                          name="bloodGroup"
                          value={formData.bloodGroup}
                          onChange={handleChange}
                          className={inputCls('bloodGroup')}
                        >
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {!isDoctor && (
                <div className="pt-8 border-t border-slate-50">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-amber-500" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      Notification Preferences
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-800">SMS Reminders</p>
                        <p className="text-xs text-slate-500 mt-0.5">Receive reminders via Text Message</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="smsNotificationsEnabled"
                          checked={formData.smsNotificationsEnabled}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-800">WhatsApp Reminders</p>
                        <p className="text-xs text-slate-500 mt-0.5">Receive reminders via WhatsApp</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="whatsappNotificationsEnabled"
                          checked={formData.whatsappNotificationsEnabled}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
                )}
              </div>

              {/* Form Footer */}
              <div className="px-6 sm:px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl">
                <button
                  type="button"
                  className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-navy-700 hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-elev-1 hover:shadow-elev-2 active:scale-95 transition-all"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>

            {isDoctor && (
            <div className="mt-8 p-6 bg-red-50/30 rounded-2xl border border-red-100 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-red-900">Danger Zone</h4>
                <p className="text-xs text-red-700/60 mt-0.5">Deleting your account is permanent and cannot be undone.</p>
              </div>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-lg text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Account
              </button>
            </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
