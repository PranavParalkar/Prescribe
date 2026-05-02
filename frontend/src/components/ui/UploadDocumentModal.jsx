import { useState, useRef } from 'react'
import { X, Upload, FileText, Calendar, MessageSquare, ChevronDown, AlertCircle,
  Eye, Heart, SmilePlus, Bone, Droplets, Ear, Brain, Hospital, ClipboardList } from 'lucide-react'

const CATEGORIES = [
  { value: 'EYES', label: 'Eyes' },
  { value: 'HEART', label: 'Heart' },
  { value: 'DENTAL', label: 'Dental' },
  { value: 'ORTHOPEDIC', label: 'Orthopedic' },
  { value: 'DERMATOLOGY', label: 'Dermatology' },
  { value: 'ENT', label: 'ENT' },
  { value: 'NEUROLOGY', label: 'Neurology' },
  { value: 'GENERAL', label: 'General' },
  { value: 'PEDIATRIC', label: 'Pediatric' },
  { value: 'PSYCHIATRY', label: 'Psychiatry' },
  { value: 'OTHER', label: 'Other' },
]

const MAX_SIZE_MB = 50

export default function UploadDocumentModal({ onClose, onUpload, uploading }) {
  const [file, setFile] = useState(null)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [documentDate, setDocumentDate] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleFile = (f) => {
    setError(null)
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`)
      return
    }
    setFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!file || !category) return
    onUpload({ file, category, description, documentDate })
  }

  const fileSizeLabel = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-[scaleIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Upload Prescription</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Add a previous prescription to your records</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Category <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
                className="w-full appearance-none px-3.5 py-2.5 pr-9 text-sm border border-slate-200 rounded-xl bg-white
                  focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-700 cursor-pointer"
              >
                <option value="">Select category…</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* File drop zone */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              File <span className="text-red-400">*</span>
            </label>
            <div
              onDragOver={e => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
                ${dragActive
                  ? 'border-teal-400 bg-teal-50/50'
                  : file
                    ? 'border-teal-300 bg-teal-50/30'
                    : 'border-slate-200 hover:border-slate-300 bg-surface-1'
                }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center gap-3 justify-center">
                  <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4.5 h-4.5 text-teal-600" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
                    <p className="text-[11px] text-slate-400">{fileSizeLabel(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setFile(null) }}
                    className="p-1 hover:bg-slate-100 rounded-md ml-auto cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">Drop your file here or click to browse</p>
                  <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG, DOC — Max {MAX_SIZE_MB} MB</p>
                </>
              )}
            </div>
          </div>

          {/* Date + Description row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Calendar className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                Document Date
              </label>
              <input
                type="date"
                value={documentDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setDocumentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl
                  focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                <MessageSquare className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                Notes
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional notes…"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl
                  focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-700 placeholder-slate-300"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || !category || uploading}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-navy-700 text-white text-xs font-bold rounded-xl
                hover:from-teal-600 hover:to-navy-800 transition-all duration-200 shadow-md shadow-teal-200/40
                disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
