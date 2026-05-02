// Mock data for Prescribe app — logo theme: navy #1e3a5f + teal #0096c7

export const MOCK_DOCTORS = [
  { id: 'd1', name: 'Dr. Arjun Mehta', specialty: 'General Physician', email: 'doctor@prescribe.app', patients: 48, avatar: 'AM', regNo: 'MH-2019-84521' },
  { id: 'd2', name: 'Dr. Priya Sharma', specialty: 'Cardiologist', email: 'priya@prescribe.app', patients: 32, avatar: 'PS', regNo: 'DL-2017-32104' },
]

export const MOCK_PATIENTS = [
  { id: 'p1', name: 'Rahul Verma', age: 34, email: 'patient@prescribe.app', avatar: 'RV', blood: 'B+', phone: '9876543210', patientId: 'PT001234' },
  { id: 'p2', name: 'Sneha Patil', age: 27, email: 'sneha@example.com', avatar: 'SP', blood: 'O+', phone: '9823456789', patientId: 'PT001235' },
  { id: 'p3', name: 'Amit Joshi', age: 51, email: 'amit@example.com', avatar: 'AJ', blood: 'A-', phone: '9712345678', patientId: 'PT001236' },
  { id: 'p4', name: 'Kavya Nair', age: 42, email: 'kavya@example.com', avatar: 'KN', blood: 'AB+', phone: '9645321087', patientId: 'PT001237' },
]

export const MOCK_PRESCRIPTIONS = [
  {
    id: 'rx001',
    patientId: 'p1',
    patientName: 'Rahul Verma',
    doctorId: 'd1',
    doctorName: 'Dr. Arjun Mehta',
    specialty: 'General Physician',
    date: '2025-02-20',
    expiryDate: '2025-05-20',
    status: 'Active',
    diagnosis: 'Acute upper respiratory infection',
    medicines: [
      { name: 'Amoxicillin', dosage: '500mg', frequency: '3x daily', duration: '7 days', instructions: 'Take with food' },
      { name: 'Paracetamol', dosage: '650mg', frequency: 'As needed', duration: '5 days', instructions: 'Max 4 tabs/day' },
      { name: 'Cetirizine', dosage: '10mg', frequency: '1x at bedtime', duration: '5 days', instructions: 'May cause drowsiness' },
    ],
    notes: 'Rest well. Drink plenty of fluids. Return if fever persists beyond 3 days.',
    followUp: '2025-02-27',
  },
  {
    id: 'rx002',
    patientId: 'p1',
    patientName: 'Rahul Verma',
    doctorId: 'd2',
    doctorName: 'Dr. Priya Sharma',
    specialty: 'Cardiologist',
    date: '2025-01-10',
    expiryDate: '2025-07-10',
    status: 'Active',
    diagnosis: 'Hypertension - Stage 1',
    medicines: [
      { name: 'Amlodipine', dosage: '5mg', frequency: '1x daily', duration: '90 days', instructions: 'Take in the morning' },
      { name: 'Telmisartan', dosage: '40mg', frequency: '1x daily', duration: '90 days', instructions: 'Take with or without food' },
    ],
    notes: 'Monitor BP daily. Low-sodium diet recommended. Avoid caffeine.',
    followUp: '2025-04-10',
  },
  {
    id: 'rx003',
    patientId: 'p2',
    patientName: 'Sneha Patil',
    doctorId: 'd1',
    doctorName: 'Dr. Arjun Mehta',
    specialty: 'General Physician',
    date: '2025-02-15',
    expiryDate: '2025-03-15',
    status: 'Active',
    diagnosis: 'Vitamin D deficiency',
    medicines: [
      { name: 'Vitamin D3', dosage: '60,000 IU', frequency: '1x weekly', duration: '8 weeks', instructions: 'Take with milk' },
      { name: 'Calcium Carbonate', dosage: '500mg', frequency: '2x daily', duration: '60 days', instructions: 'Take after meals' },
    ],
    notes: 'Expose to morning sunlight. Include dairy in diet.',
    followUp: '2025-04-15',
  },
  {
    id: 'rx004',
    patientId: 'p3',
    patientName: 'Amit Joshi',
    doctorId: 'd1',
    doctorName: 'Dr. Arjun Mehta',
    specialty: 'General Physician',
    date: '2024-12-01',
    expiryDate: '2025-01-01',
    status: 'Expired',
    diagnosis: 'Type 2 Diabetes - monitoring',
    medicines: [
      { name: 'Metformin', dosage: '500mg', frequency: '2x daily', duration: '30 days', instructions: 'Take with meals' },
    ],
    notes: 'Check HbA1c after 3 months. Low-carb diet advised.',
    followUp: '2025-01-01',
  },
  {
    id: 'rx005',
    patientId: 'p4',
    patientName: 'Kavya Nair',
    doctorId: 'd2',
    doctorName: 'Dr. Priya Sharma',
    specialty: 'Cardiologist',
    date: '2025-02-25',
    expiryDate: '2025-08-25',
    status: 'Pending',
    diagnosis: 'Cardiac arrhythmia evaluation',
    medicines: [
      { name: 'Metoprolol', dosage: '25mg', frequency: '2x daily', duration: '30 days', instructions: 'Do not stop abruptly' },
    ],
    notes: 'ECG required before starting medication. Avoid strenuous activity.',
    followUp: '2025-03-10',
  },
]

export const MOCK_CREDENTIALS = {
  doctor:  { email: 'doctor@prescribe.app',  password: 'doctor123',  role: 'doctor',  userId: 'd1', name: 'Dr. Arjun Mehta', specialty: 'General Physician', avatar: 'AM' },
  patient: { email: 'patient@prescribe.app', password: 'patient123', role: 'patient', userId: 'p1', name: 'Rahul Verma', age: 34, avatar: 'RV', patientId: 'PT001234' },
}
