import DashboardLayout from '../components/layout/DashboardLayout'
import PatientDocuments from '../components/ui/PatientDocuments'

export default function PatientDocumentsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-[fadeIn_0.3s_ease-out]">
        <PatientDocuments />
      </div>
    </DashboardLayout>
  )
}