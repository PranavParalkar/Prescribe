import { useState, useEffect, useMemo } from 'react'
import { Upload, Download, Trash2, RotateCcw, FileText, Archive, Clock, AlertCircle, Eye, X,
  Folder, Stethoscope, Heart, SmilePlus, Bone, Droplets, Ear, Brain, Hospital, ClipboardList,
  ArrowLeft, Lock, Crown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getPatientDocuments, uploadPatientDocument, getDocumentDownloadUrl, getDocumentViewUrl, deletePatientDocument, restoreDocument, getSubscriptionStatus } from '../../api/api'
import UploadDocumentModal from './UploadDocumentModal'

const CATEGORIES = [
  { value: 'EYES',         label: 'Eyes',         icon: Eye,           color: 'from-blue-400 to-blue-600' },
  { value: 'HEART',        label: 'Heart',        icon: Heart,         color: 'from-red-400 to-red-600' },
  { value: 'DENTAL',       label: 'Dental',       icon: SmilePlus,     color: 'from-cyan-400 to-cyan-600' },
  { value: 'ORTHOPEDIC',   label: 'Orthopedic',   icon: Bone,          color: 'from-amber-400 to-amber-600' },
  { value: 'DERMATOLOGY',  label: 'Dermatology',  icon: Droplets,      color: 'from-pink-400 to-pink-600' },
  { value: 'ENT',          label: 'ENT',          icon: Ear,           color: 'from-violet-400 to-violet-600' },
  { value: 'NEUROLOGY',    label: 'Neurology',    icon: Brain,         color: 'from-purple-400 to-purple-600' },
  { value: 'GENERAL',      label: 'General',      icon: Hospital,      color: 'from-teal-400 to-teal-600' },
  { value: 'PEDIATRIC',    label: 'Pediatric',    icon: Stethoscope,   color: 'from-emerald-400 to-emerald-600' },
  { value: 'PSYCHIATRY',   label: 'Psychiatry',   icon: Brain,         color: 'from-indigo-400 to-indigo-600' },
  { value: 'OTHER',        label: 'Other',        icon: ClipboardList, color: 'from-slate-400 to-slate-600' },
]

const STORAGE_BADGES = {
  STANDARD:     { label: 'Standard',     cls: 'bg-teal-50 text-teal-700 border-teal-200/60',  icon: null },
  ONEZONE_IA:   { label: 'Archived',     cls: 'bg-amber-50 text-amber-700 border-amber-200/60', icon: Archive },
  DEEP_ARCHIVE: { label: 'Deep Archive', cls: 'bg-red-50 text-red-700 border-red-200/60',     icon: Archive },
}

export default function PatientDocuments() {
  const { user } = useAuth()
  const [allDocs, setAllDocs] = useState([])       // all documents (for global count)
  const [filteredDocs, setFilteredDocs] = useState([]) // category-filtered list
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null) // null = folder view
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadLimit, setUploadLimit] = useState({ used: 0, limit: 3, premiumLimit: 50, isSubscribed: false })
  const [viewingDoc, setViewingDoc] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)

  const patientId = user?.entityId

  // Fetch ALL docs (for global count + folder view)
  const fetchAllDocs = () => {
    if (!patientId) return
    setLoading(true)
    getPatientDocuments(patientId, null)
      .then(docs => {
        setAllDocs(docs)
        if (activeCategory) {
          setFilteredDocs(docs.filter(d => d.category === activeCategory))
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  // Fetch docs for a specific category
  const fetchCategoryDocs = (cat) => {
    if (!patientId) return
    setLoading(true)
    getPatientDocuments(patientId, cat)
      .then(setFilteredDocs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAllDocs()
    if (patientId) {
      getSubscriptionStatus(patientId)
        .then(sub => setUploadLimit(prev => ({
          ...prev,
          isSubscribed: sub?.subscribed || false,
          limit: sub?.subscribed ? (sub?.premiumLimit || 50) : (sub?.freeLimit || 3),
          premiumLimit: sub?.premiumLimit || 50,
        })))
        .catch(() => {})
    }
  }, [patientId])

  useEffect(() => {
    if (activeCategory) {
      fetchCategoryDocs(activeCategory)
    }
  }, [activeCategory])

  // Count files per category from allDocs
  const categoryCounts = useMemo(() => {
    const counts = {}
    CATEGORIES.forEach(c => { counts[c.value] = 0 })
    allDocs.forEach(d => {
      if (counts[d.category] !== undefined) counts[d.category]++
    })
    return counts
  }, [allDocs])

  // Total size per category
  const categorySizes = useMemo(() => {
    const sizes = {}
    CATEGORIES.forEach(c => { sizes[c.value] = 0 })
    allDocs.forEach(d => {
      if (sizes[d.category] !== undefined) sizes[d.category] += (d.fileSize || 0)
    })
    return sizes
  }, [allDocs])

  const handleUpload = async ({ file, category, description, documentDate }) => {
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('patientId', patientId)
      formData.append('category', category)
      if (description) formData.append('description', description)
      if (documentDate) formData.append('documentDate', documentDate)

      await uploadPatientDocument(formData)
      setShowUpload(false)
      fetchAllDocs()
      if (activeCategory) fetchCategoryDocs(activeCategory)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (docId) => {
    try {
      const { url } = await getDocumentDownloadUrl(docId)
      window.open(url, '_blank')
    } catch (e) {
      setError(e.message)
    }
  }

  const handleView = async (doc) => {
    setViewLoading(true)
    try {
      const { url } = await getDocumentViewUrl(doc.id)
      setViewingDoc({ url, fileName: doc.fileName, contentType: doc.contentType })
    } catch (e) {
      setError(e.message)
    } finally {
      setViewLoading(false)
    }
  }

  const handleDelete = async (docId) => {
    if (!confirm('Delete this document permanently?')) return
    try {
      await deletePatientDocument(docId)
      fetchAllDocs()
      if (activeCategory) fetchCategoryDocs(activeCategory)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleRestore = async (docId) => {
    try {
      await restoreDocument(docId)
      fetchAllDocs()
      if (activeCategory) fetchCategoryDocs(activeCategory)
    } catch (e) {
      setError(e.message)
    }
  }

  const totalDocs = allDocs.length
  const canUpload = uploadLimit.isSubscribed ? totalDocs < uploadLimit.premiumLimit : totalDocs < uploadLimit.limit
  const canView = uploadLimit.isSubscribed || true // view is allowed for free users within their limit
  const getCatIcon = (cat) => {
    const found = CATEGORIES.find(c => c.value === cat)
    return found ? found.icon : ClipboardList
  }
  const getCatColor = (cat) => {
    const found = CATEGORIES.find(c => c.value === cat)
    return found ? found.color : 'from-slate-400 to-slate-600'
  }
  const storageBadge = (cls) => STORAGE_BADGES[cls] || STORAGE_BADGES.STANDARD

  const fileSizeLabel = (bytes) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const usagePct = Math.min(100, (totalDocs / uploadLimit.limit) * 100)

  // ── Folder View (no category selected) ──────────────────────
  if (!activeCategory) {
    return (
      <div className="mt-8">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-navy-700 flex items-center justify-center shadow-md shadow-teal-200/40">
                <Folder className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">My Documents</h2>
            </div>
            <p className="text-xs text-slate-400 ml-[42px]">Upload and manage your previous prescriptions</p>
          </div>
          <button
            onClick={() => canUpload ? setShowUpload(true) : setError('Upload limit reached. Subscribe to Pro for unlimited uploads.')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-navy-700 text-white text-xs font-bold rounded-xl
              hover:from-teal-600 hover:to-navy-800 transition-all duration-200 shadow-md shadow-teal-200/40 cursor-pointer shrink-0
              hover:shadow-lg hover:shadow-teal-200/50 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Document
          </button>
        </div>

        {/* Upload limit indicator (global) */}
        {!uploadLimit.isSubscribed && (
          <div className="flex items-center gap-3 mb-6 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-elev-1">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <Stethoscope className="w-3.5 h-3.5 text-teal-500" />
              {totalDocs} / {uploadLimit.limit} files used
            </div>
            <div className="flex-1 max-w-[160px] h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${usagePct}%`,
                  background: usagePct >= 100
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                    : 'linear-gradient(90deg, #1ac5d5, #00aaba)',
                }}
              />
            </div>
            {usagePct >= 100 && (
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Limit reached</span>
            )}
              {!uploadLimit.isSubscribed && (
              <span className="text-[10px] text-slate-400 ml-auto">
                <Crown className="w-3 h-3 inline mr-0.5 text-amber-400" />
                Upgrade for up to {uploadLimit.premiumLimit}
              </span>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-xs text-red-600 animate-[fadeIn_0.2s_ease-out]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-md transition-colors cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Folder grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="h-36 bg-white rounded-xl border border-slate-100 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/60 to-transparent animate-[shimmer_1.5s_infinite]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {CATEGORIES.map((cat, idx) => {
              const Icon = cat.icon
              const count = categoryCounts[cat.value] || 0
              const size = categorySizes[cat.value] || 0

              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className="group bg-white border border-slate-100 rounded-xl shadow-elev-1 hover:shadow-elev-3
                    hover:-translate-y-1 transition-all duration-200 cursor-pointer p-4 flex flex-col items-center text-center
                    relative overflow-hidden"
                  style={{ animationDelay: `${idx * 40}ms`, animation: 'slideUp 0.3s ease-out backwards' }}
                >
                  {/* Folder icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center
                    mb-3 shadow-lg group-hover:scale-110 transition-transform duration-200`}
                    style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Label */}
                  <p className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{cat.label}</p>

                  {/* Count & Size */}
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    {count} {count === 1 ? 'file' : 'files'}
                    {size > 0 && <span className="ml-1">· {fileSizeLabel(size)}</span>}
                  </p>

                  {/* Subtle accent line at bottom */}
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
                </button>
              )
            })}
          </div>
        )}

        {/* Upload Modal */}
        {showUpload && (
          <UploadDocumentModal
            onClose={() => setShowUpload(false)}
            onUpload={handleUpload}
            uploading={uploading}
          />
        )}
      </div>
    )
  }

  // ── Category Detail View (category selected) ───────────────
  const activeCatInfo = CATEGORIES.find(c => c.value === activeCategory)
  const ActiveIcon = activeCatInfo?.icon || ClipboardList

  return (
    <div className="mt-8">
      {/* Header with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <button
            onClick={() => setActiveCategory(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-teal-600
              mb-2 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to folders
          </button>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${activeCatInfo?.color || 'from-slate-400 to-slate-600'} flex items-center justify-center shadow-md`}>
              <ActiveIcon className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">{activeCatInfo?.label || 'Documents'}</h2>
              <p className="text-[10px] text-slate-400 font-medium">{filteredDocs.length} {filteredDocs.length === 1 ? 'file' : 'files'}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => canUpload ? setShowUpload(true) : setError('Upload limit reached. Subscribe to Pro for unlimited uploads.')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-navy-700 text-white text-xs font-bold rounded-xl
            hover:from-teal-600 hover:to-navy-800 transition-all duration-200 shadow-md shadow-teal-200/40 cursor-pointer shrink-0
            hover:shadow-lg hover:shadow-teal-200/50 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Document
        </button>
      </div>

      {/* Upload limit indicator (global) */}
      {!uploadLimit.isSubscribed && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-elev-1">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <Stethoscope className="w-3.5 h-3.5 text-teal-500" />
            {totalDocs} / {uploadLimit.limit} files used (across all folders)
          </div>
          <div className="flex-1 max-w-[140px] h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${usagePct}%`,
                background: usagePct >= 100
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                  : 'linear-gradient(90deg, #1ac5d5, #00aaba)',
              }}
            />
          </div>
          {usagePct >= 100 && (
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Limit reached</span>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-xs text-red-600 animate-[fadeIn_0.2s_ease-out]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-md transition-colors cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Documents grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-44 bg-white rounded-xl border border-slate-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/60 to-transparent animate-[shimmer_1.5s_infinite]" />
            </div>
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-elev-1">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeCatInfo?.color || 'from-slate-200 to-slate-300'} flex items-center justify-center mb-4 opacity-40`}>
            <ActiveIcon className="w-7 h-7 text-white" />
          </div>
          <p className="text-sm font-bold text-slate-600">No {activeCatInfo?.label?.toLowerCase()} documents</p>
          <p className="text-xs text-slate-400 mt-1.5 max-w-[220px] text-center">Upload a prescription to this folder</p>
          <button
            onClick={() => canUpload ? setShowUpload(true) : setError('Upload limit reached.')}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-teal-600 bg-teal-50 rounded-lg
              hover:bg-teal-100 transition-colors cursor-pointer border border-teal-200/50"
          >
            <Upload className="w-3 h-3" />
            Upload document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc, idx) => {
            const badge = storageBadge(doc.s3StorageClass)
            const BadgeIcon = badge.icon
            const isDeepArchive = doc.s3StorageClass === 'DEEP_ARCHIVE'
            const isRestoring = doc.restoreStatus === 'IN_PROGRESS'
            const CatIcon = getCatIcon(doc.category)

            return (
              <div
                key={doc.id}
                className="group bg-white border border-slate-100 rounded-xl shadow-elev-1 hover:shadow-elev-3
                  hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden"
                style={{ animationDelay: `${idx * 50}ms`, animation: 'slideUp 0.3s ease-out backwards' }}
              >
                {/* Card header accent */}
                <div className={`h-1 bg-gradient-to-r ${getCatColor(doc.category)} opacity-60 group-hover:opacity-100 transition-opacity`} />

                <div className="p-4 flex flex-col flex-1">
                  {/* Top row: icon + meta */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getCatColor(doc.category)} bg-opacity-10
                      flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}
                      style={{ background: 'linear-gradient(135deg, rgba(0,170,186,0.08), rgba(0,106,122,0.08))' }}
                    >
                      <CatIcon className="w-4.5 h-4.5 text-teal-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors">{doc.fileName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        {fileSizeLabel(doc.fileSize)}
                        {doc.documentDate && <span className="ml-1.5">· {doc.documentDate}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {doc.description && (
                    <p className="text-[11px] text-slate-500 mb-3 line-clamp-2 leading-relaxed">{doc.description}</p>
                  )}

                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-3 mt-auto flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${badge.cls}`}>
                      {BadgeIcon && <BadgeIcon className="w-2.5 h-2.5" />}
                      {badge.label}
                    </span>
                    {isRestoring && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-bold">
                        <Clock className="w-2.5 h-2.5 animate-spin" />
                        Restoring…
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-3 border-t border-slate-100/80">
                    {isDeepArchive && !isRestoring ? (
                      <button
                        onClick={() => handleRestore(doc.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-blue-600
                          hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </button>
                    ) : !isDeepArchive ? (
                      <>
                        {/* View button */}
                        <button
                          onClick={() => handleView(doc)}
                          disabled={viewLoading}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-navy-700
                            hover:bg-navy-50 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        {/* Download button */}
                        <button
                          onClick={() => handleDownload(doc.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-teal-600
                            hover:bg-teal-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                      </>
                    ) : null}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-400
                        hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Document Viewer Modal ────────────────────────────────── */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] mx-4 flex flex-col animate-[scaleIn_0.2s_ease-out] overflow-hidden">
            {/* Viewer header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-50 to-navy-50 border border-teal-100/50 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{viewingDoc.fileName}</p>
                  <p className="text-[10px] text-slate-400">Document Preview</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={viewingDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-teal-600
                    bg-teal-50 hover:bg-teal-100 border border-teal-200/50 rounded-lg transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Viewer content */}
            <div className="flex-1 bg-slate-50 overflow-hidden">
              {viewingDoc.fileName?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={viewingDoc.url}
                  className="w-full h-full border-0"
                  title={`Preview: ${viewingDoc.fileName}`}
                />
              ) : viewingDoc.contentType?.startsWith('image/') ||
                    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(viewingDoc.fileName) ? (
                <div className="w-full h-full flex items-center justify-center p-8">
                  <img
                    src={viewingDoc.url}
                    alt={viewingDoc.fileName}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-500">Preview not available</p>
                    <p className="text-xs text-slate-400 mt-1">This file type cannot be previewed in the browser</p>
                  </div>
                  <a
                    href={viewingDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white
                      bg-gradient-to-r from-teal-500 to-navy-700 rounded-xl shadow-md shadow-teal-200/40
                      hover:from-teal-600 hover:to-navy-800 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download to view
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <UploadDocumentModal
          onClose={() => setShowUpload(false)}
          onUpload={handleUpload}
          uploading={uploading}
        />
      )}
    </div>
  )
}
