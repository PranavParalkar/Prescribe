// ─────────────────────────────────────────────────────────────────────────────
// Prescribe API — centralised fetch wrapper
// Backend: Spring Boot on http://localhost:8080
// All endpoints documented in implementation_plan.md
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:8080'

/** Pull JWT from localStorage (set by AuthContext after login/register) */
function getToken() {
  return localStorage.getItem('prescribe_token')
}

/**
 * Core request helper.
 * Automatically attaches Authorization header and throws on non-2xx.
 */
async function request(method, path, body, params) {
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.append(k, v)
    })
  }

  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const contentType = (res.headers.get('content-type') || '').toLowerCase()

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      if (contentType.includes('application/json')) {
        const err = await res.json()
        msg = err.message || err.error || JSON.stringify(err)
      } else {
        const text = await res.text()
        msg = text || msg
      }
    } catch { /* ignore parse error */ }
    throw new Error(msg)
  }

  // 204 No Content
  if (res.status === 204) return null

  // Parse only when response is JSON; otherwise return text.
  if (contentType.includes('application/json')) {
    // Some endpoints may return an empty JSON body.
    const text = await res.text()
    return text ? JSON.parse(text) : null
  }

  return await res.text()
}

export const api = {
  get: (path, params) => request('GET', path, undefined, params).then(data => ({ data })),
  post: (path, body, params) => request('POST', path, body, params).then(data => ({ data })),
  put: (path, body, params) => request('PUT', path, body, params).then(data => ({ data })),
  delete: (path, params) => request('DELETE', path, undefined, params).then(data => ({ data }))
}

// ─── Auth ────────────────────────────────────────────────────────────────────

/**
 * Register a new user account.
 * @param {{ email: string, password: string, role: 'DOCTOR'|'PATIENT' }} data
 * @returns {{ token: string }}
 */
export function authRegister(data) {
  return request('POST', '/api/auth/register', data)
}

/**
 * Send Auth OTP
 */
export function sendAuthOtp(data) {
  return request('POST', '/api/auth/send-otp', data)
}

/**
 * Verify Auth OTP
 */
export function verifyAuthOtp(data) {
  return request('POST', '/api/auth/verify-otp', data)
}

/**
 * Login with email + password.
 * @param {{ email: string, password: string }} data
 * @returns {{ token: string }}
 */
export function authLogin(data) {
  return request('POST', '/api/auth/login', data)
}

// ─── Doctors ─────────────────────────────────────────────────────────────────

/**
 * Create a doctor profile after registration.
 * @param {{ firstName, lastName, specialization, licenseNumber, phone, email }} data
 * @returns {{ doctorId, firstName, lastName, specialization, status }}
 */
export function createDoctor(data) {
  return request('POST', '/api/doctors', data)
}

/**
 * Get a doctor profile by email.
 * @param {string} email
 * @returns {{ doctorId, firstName, lastName, specialization, status }}
 */
export function getDoctorByEmail(email) {
  return request('GET', `/api/doctors/email/${encodeURIComponent(email)}`)
}

/**
 * Update a doctor profile.
 * @param {string} doctorId
 * @param {{ firstName, lastName, phone, specialization, licenseNumber }} data
 */
export function updateDoctorProfile(doctorId, data) {
  return request('PUT', `/api/doctors/${encodeURIComponent(doctorId)}`, data)
}

/**
 * Upload doctor license document
 */
export async function uploadDoctorLicense(doctorId, file) {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)
  
  const res = await fetch(`${BASE_URL}/api/doctors/${encodeURIComponent(doctorId)}/license`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Upload failed (${res.status})`)
  }
  return res.json()
}

/**
 * Delete a doctor profile.
 * @param {string} doctorId
 */
export function deleteDoctorProfile(doctorId) {
  return request('DELETE', `/api/doctors/${encodeURIComponent(doctorId)}`)
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export function getPendingDoctors() {
  return request('GET', '/api/admin/doctors/pending')
}

export function approveDoctor(doctorId) {
  return request('POST', `/api/admin/doctors/${encodeURIComponent(doctorId)}/approve`)
}

export function rejectDoctor(doctorId) {
  return request('POST', `/api/admin/doctors/${encodeURIComponent(doctorId)}/reject`)
}

export function getAdminDoctors() {
  return request('GET', '/api/admin/doctors')
}

export function getAdminPatients() {
  return request('GET', '/api/admin/patients')
}

export function getAdminMedicals() {
  return request('GET', '/api/admin/medicals')
}

export function deleteAdminDoctor(doctorId) {
  return request('DELETE', `/api/admin/doctors/${encodeURIComponent(doctorId)}`)
}

export function deleteAdminPatient(patientId) {
  return request('DELETE', `/api/admin/patients/${encodeURIComponent(patientId)}`)
}

export function deleteAdminMedical(medicalId) {
  return request('DELETE', `/api/admin/medicals/${encodeURIComponent(medicalId)}`)
}

export function getDoctorLicenseUrl(doctorId) {
  return request('GET', `/api/admin/doctors/${encodeURIComponent(doctorId)}/license-url`)
}

// ─── Patients ────────────────────────────────────────────────────────────────

/**
 * Create a patient profile after registration.
 * @param {{ firstName, lastName, dob, gender, phone, email }} data
 * @returns {{ patientId, firstName, lastName, phone, email }}
 */
export function createPatient(data) {
  return request('POST', '/api/patients', data)
}

/**
 * Get a patient profile by email.
 * @param {string} email
 * @returns {{ patientId, firstName, lastName, phone, email }}
 */
export function getPatientByEmail(email) {
  return request('GET', `/api/patients/email/${encodeURIComponent(email)}`)
}

/**
 * Get a patient profile by ID.
 * @param {string} patientId
 * @returns {{ patientId, firstName, lastName, phone, email }}
 */
export function getPatientById(patientId) {
  return request('GET', `/api/patients/${encodeURIComponent(patientId)}`)
}

/**
 * Update a patient profile.
 * @param {string} patientId
 * @param {{ firstName, lastName, phone, dob, gender }} data
 */
export function updatePatientProfile(patientId, data) {
  return request('PUT', `/api/patients/${encodeURIComponent(patientId)}`, data)
}

// ─── Prescriptions ───────────────────────────────────────────────────────────

/**
 * Create a new prescription.
 * @param {string} patientId - Patient UUID
 * @param {string} doctorId  - Doctor UUID
 * @param {{ diagnosis, notes, medicines: Array }} prescription
 */
export function createPrescription(patientId, doctorId, prescription) {
  return request('POST', '/api/prescriptions', prescription, { patientId, doctorId })
}

/**
 * Get all prescriptions for a patient by their UUID.
 * @param {string} patientId - Patient UUID
 * @returns {Array<Prescription>}
 */
export function getPrescriptionsByPatient(patientId) {
  return request('GET', `/api/prescriptions/patient/${patientId}`)
}

/**
 * Get all prescriptions issued by a doctor by their UUID.
 * @param {string} doctorId - Doctor UUID
 * @returns {Array<Prescription>}
 */
export function getPrescriptionsByDoctor(doctorId) {
  return request('GET', `/api/prescriptions/doctor/${doctorId}`)
}

/**
 * Revoke (deactivate) a prescription by its UUID.
 * @param {string} id - Prescription UUID
 * @param {string} reason - RevokeReason enum: MEDICATION_CHANGE | ERROR | PATIENT_REQUEST | ADVERSE_REACTION | DUPLICATE | OTHER
 * @returns {Prescription}
 */
export function revokePrescription(id, reason = 'OTHER') {
  return request('PUT', `/api/prescriptions/${id}/revoke`, { reason })
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

/**
 * Get global dashboard statistics.
 * @returns {{ totalPatients, totalDoctors, verifiedDoctors }}
 */
export function getDashboardStats() {
  return request('GET', '/api/dashboard/stats')
}

// ─── Subscription ────────────────────────────────────────────────────────────

/**
 * Get the current subscription status for a patient.
 * @param {string} patientId - Patient UUID
 * @returns {{ subscribed, planType, status, startDate, endDate, totalPrescriptions, freeLimit, requiresSubscription, daysRemaining }}
 */
export function getSubscriptionStatus(patientId) {
  return request('GET', '/api/subscription/status', undefined, { patientId })
}

/**
 * Create a Razorpay order for monthly subscription.
 * @param {string} patientId - Patient UUID
 * @returns {{ orderId, amount, currency, keyId, planName }}
 */
export function createSubscriptionOrder(patientId) {
  return request('POST', '/api/subscription/create-order', undefined, { patientId })
}

/**
 * Verify Razorpay payment and activate subscription.
 * @param {{ patientId, razorpayOrderId, razorpayPaymentId, razorpaySignature }} data
 * @returns {SubscriptionStatusResponse}
 */
export function verifySubscriptionPayment(data) {
  return request('POST', '/api/subscription/verify-payment', data)
}

// ─── Patient Documents ───────────────────────────────────────────────────────

/**
 * Upload a patient document (multipart/form-data).
 * @param {FormData} formData
 * @returns {PatientDocumentResponse}
 */
export async function uploadPatientDocument(formData) {
  const token = getToken()
  const res = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Upload failed (${res.status})`)
  }
  return res.json()
}

/**
 * List patient documents, optionally filtered by category.
 */
export function getPatientDocuments(patientId, category) {
  const params = { patientId }
  if (category) params.category = category
  return request('GET', '/api/documents', undefined, params)
}

/**
 * Get a presigned download URL for a document.
 */
export function getDocumentDownloadUrl(documentId) {
  return request('GET', `/api/documents/${documentId}/download`)
}

/**
 * Get a presigned inline-view URL for a document (Content-Disposition: inline).
 * Allows PDFs and images to render directly in the browser without downloading.
 */
export function getDocumentViewUrl(documentId) {
  return request('GET', `/api/documents/${documentId}/view`)
}

/**
 * Get an authenticated Blob for inline document preview.
 * This avoids browser download-only behavior from cross-origin presigned URLs.
 */
export async function getDocumentViewBlob(documentId) {
  const token = getToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const res = await fetch(`${BASE_URL}/api/documents/${documentId}/view-content`, {
    method: 'GET',
    headers,
  })

  if (!res.ok) {
    const contentType = (res.headers.get('content-type') || '').toLowerCase()
    let msg = `HTTP ${res.status}`
    try {
      if (contentType.includes('application/json')) {
        const err = await res.json()
        msg = err.message || err.error || JSON.stringify(err)
      } else {
        const text = await res.text()
        msg = text || msg
      }
    } catch {
      // ignore parse error
    }
    throw new Error(msg)
  }

  const contentType = res.headers.get('content-type') || 'application/octet-stream'
  const blob = await res.blob()
  const normalizedBlob = blob.type ? blob : new Blob([blob], { type: contentType })

  return { blob: normalizedBlob, contentType }
}

/**
 * Delete a patient document.
 */
export function deletePatientDocument(documentId) {
  return request('DELETE', `/api/documents/${documentId}`)
}

/**
 * Initiate restore for a document in Deep Archive.
 */
export function restoreDocument(documentId) {
  return request('POST', `/api/documents/${documentId}/restore`)
}

// ─── Doctor Patient Access (OTP) ─────────────────────────────────────────────

/**
 * Doctor requests an OTP to access a patient's documents.
 * @param {string} doctorId - Doctor's unique ID (DOC-xxxx)
 * @param {string} patientId - Patient's unique ID (PAT-xxxx)
 * @returns {{ message, expiresAt }}
 */
export function requestAccessOtp(doctorId, patientId) {
  return request('POST', '/api/access/request-otp', undefined, { doctorId, patientId })
}

/**
 * Patient polls for any pending OTP on their dashboard.
 * @param {string} patientId - Patient's unique ID
 * @returns {{ hasPendingOtp, otp?, doctorName?, specialization?, expiresAt? }}
 */
export function getPendingOtp(patientId) {
  return request('GET', '/api/access/pending-otp', undefined, { patientId })
}

/**
 * Doctor verifies OTP and gets access to filtered patient documents.
 * @param {string} doctorId - Doctor's unique ID
 * @param {{ patientId: string, otp: string }} data
 * @returns {{ verified, category, patientName, documents[] }}
 */
export function verifyAccessOtp(doctorId, data) {
  return request('POST', '/api/access/verify-otp', data, { doctorId })
}

// ─── Medical Store ──────────────────────────────────────────────────────────

export function registerMedical(data) {
  return request('POST', '/api/medicals/register', data)
}

export function getMedicalProfile() {
  return request('GET', '/api/medicals/profile')
}

// ─── Inventory ──────────────────────────────────────────────────────────────

export function getInventory() {
  return request('GET', '/api/medicals/inventory')
}

export function addInventoryItem(data) {
  return request('POST', '/api/medicals/inventory', data)
}

export function updateInventoryItem(itemId, data) {
  return request('PUT', `/api/medicals/inventory/${itemId}`, data)
}

export function deleteInventoryItem(itemId) {
  return request('DELETE', `/api/medicals/inventory/${itemId}`)
}

export function getLowStockAlerts() {
  return request('GET', '/api/medicals/alerts/low-stock')
}

export function getExpiringAlerts() {
  return request('GET', '/api/medicals/alerts/expiring')
}

export function getMedicalDashboardStats() {
  return request('GET', '/api/medicals/dashboard-stats')
}

export function searchMedicines(query) {
  return request('GET', '/api/medicals/search', undefined, { medicine: query })
}

export function placeOrder(data) {
  return request('POST', '/api/medicals/orders/place', data)
}

// ─── Prescription Float ────────────────────────────────────────────────────

export function floatPrescription(data) {
  return request('POST', '/api/medicals/float', data)
}

export function getPatientFloats() {
  return request('GET', '/api/medicals/float/patient')
}

export function getFloatsForMedical() {
  return request('GET', '/api/medicals/float/medical')
}

export function submitFloatQuote(floatId, data) {
  return request('POST', `/api/medicals/float/${floatId}/quote`, data)
}

export function selectFloatQuote(floatId, quoteId) {
  return request('POST', `/api/medicals/float/${floatId}/select/${quoteId}`)
}
