/**
 * Physician Dashboard - Data Management
 * Handles all data operations and sample data initialization
 */

// Global data arrays
let patients = [];
let examinations = [];
let files = [];

// Data management object
const DataManager = {
    
    /**
     * Initialize the application with sample data
     */
    init() {
        this.loadSampleData();
        this.setupDataValidation();
    },
    
    /**
     * Load sample data for demonstration
     */
    loadSampleData() {
        // Sample patients with realistic medical data
        patients = [
            {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: '1985-03-15',
                gender: 'male',
                phoneNumber: '(555) 123-4567',
                email: 'john.doe@email.com',
                address: '123 Main Street, Springfield, IL 62701',
                medicalHistory: 'Hypertension (2019), No known allergies, Takes Lisinopril 10mg daily',
                insuranceInfo: 'Blue Cross Blue Shield - Policy #BCBS123456789',
                emergencyContact: {
                    name: 'Jane Doe',
                    relationship: 'Spouse',
                    phone: '(555) 123-4568'
                },
                dateAdded: '2024-01-15T09:00:00.000Z',
                lastVisit: '2024-08-01T14:30:00.000Z',
                status: 'active'
            },
            {
                id: 2,
                firstName: 'Jane',
                lastName: 'Smith',
                dateOfBirth: '1992-07-22',
                gender: 'female',
                phoneNumber: '(555) 987-6543',
                email: 'jane.smith@email.com',
                address: '456 Oak Avenue, Springfield, IL 62702',
                medicalHistory: 'Type 2 Diabetes (2021), Penicillin allergy, Takes Metformin 500mg twice daily',
                insuranceInfo: 'Aetna - Policy #AETNA987654321',
                emergencyContact: {
                    name: 'Robert Smith',
                    relationship: 'Father',
                    phone: '(555) 987-6544'
                },
                dateAdded: '2024-02-10T10:15:00.000Z',
                lastVisit: '2024-07-28T11:00:00.000Z',
                status: 'active'
            },
            {
                id: 3,
                firstName: 'Robert',
                lastName: 'Johnson',
                dateOfBirth: '1978-11-08',
                gender: 'male',
                phoneNumber: '(555) 456-7890',
                email: 'robert.johnson@email.com',
                address: '789 Pine Street, Springfield, IL 62703',
                medicalHistory: 'High cholesterol (2020), Previous appendectomy (2015), No known allergies',
                insuranceInfo: 'United Healthcare - Policy #UHC456789123',
                emergencyContact: {
                    name: 'Mary Johnson',
                    relationship: 'Wife',
                    phone: '(555) 456-7891'
                },
                dateAdded: '2024-01-28T08:45:00.000Z',
                lastVisit: '2024-07-15T16:20:00.000Z',
                status: 'active'
            }
        ];

        // Sample examinations
        examinations = [
            {
                id: 1,
                patientId: 1,
                date: '2024-08-01T14:30:00.000Z',
                type: 'routine',
                bloodPressure: '132/88',
                heartRate: 78,
                temperature: 98.6,
                weight: 185.5,
                height: '5\'10"',
                chiefComplaint: 'Annual physical examination',
                physicalFindings: 'Normal heart sounds, lungs clear to auscultation bilaterally. Mild hypertension noted.',
                diagnosis: 'Essential hypertension, well-controlled',
                treatmentPlan: 'Continue current Lisinopril 10mg daily. Dietary counseling provided.',
                followUpInstructions: 'Return in 6 months for BP check. Blood work in 3 months.',
                doctorNotes: 'Patient compliant with medication. Discussed lifestyle modifications.',
                duration: 30,
                status: 'completed'
            },
            {
                id: 2,
                patientId: 2,
                date: '2024-07-28T11:00:00.000Z',
                type: 'follow-up',
                bloodPressure: '118/76',
                heartRate: 82,
                temperature: 98.4,
                weight: 142.3,
                height: '5\'6"',
                chiefComplaint: 'Diabetes follow-up, checking blood sugar control',
                physicalFindings: 'No acute distress. Feet examination normal, no signs of neuropathy.',
                diagnosis: 'Type 2 diabetes mellitus, good glycemic control',
                treatmentPlan: 'Continue Metformin 500mg twice daily. HbA1c results reviewed (6.8%).',
                followUpInstructions: 'Return in 3 months. Continue home glucose monitoring.',
                doctorNotes: 'Excellent compliance. Weight stable. Encouraged to continue current regimen.',
                duration: 20,
                status: 'completed'
            },
            {
                id: 3,
                patientId: 3,
                date: '2024-07-15T16:20:00.000Z',
                type: 'consultation',
                bloodPressure: '124/82',
                heartRate: 88,
                temperature: 98.2,
                weight: 195.0,
                height: '6\'1"',
                chiefComplaint: 'Chest discomfort and shortness of breath during exercise',
                physicalFindings: 'Heart rate regular, no murmurs. Lungs clear. No chest wall tenderness.',
                diagnosis: 'Atypical chest pain, likely musculoskeletal. Rule out cardiac etiology.',
                treatmentPlan: 'EKG performed - normal. Stress test ordered. NSAIDs for muscle pain.',
                followUpInstructions: 'Schedule stress test within 2 weeks. Return if symptoms worsen.',
                doctorNotes: 'Low cardiac risk based on age and risk factors. Reassurance provided.',
                duration: 45,
                status: 'completed'
            }
        ];

        // Sample files
        files = [
            {
                id: 1,
                patientId: 1,
                name: 'Chest_X-Ray_2024-08-01.jpg',
                type: 'image/jpeg',
                size: 2048576, // 2MB
                category: 'imaging',
                description: 'Annual chest X-ray - normal',
                dateUploaded: '2024-08-01T14:45:00.000Z',
                uploadedBy: 'Dr. Smith',
                tags: ['chest', 'x-ray', 'annual', 'normal']
            },
            {
                id: 2,
                patientId: 1,
                name: 'Lab_Results_2024-07-30.pdf',
                type: 'application/pdf',
                size: 512000, // 512KB
                category: 'lab-results',
                description: 'Comprehensive metabolic panel and lipid panel',
                dateUploaded: '2024-07-30T09:15:00.000Z',
                uploadedBy: 'Lab Tech',
                tags: ['lab', 'blood-work', 'metabolic', 'lipid']
            },
            {
                id: 3,
                patientId: 2,
                name: 'HbA1c_Results_2024-07-25.pdf',
                type: 'application/pdf',
                size: 256000, // 256KB
                category: 'lab-results',
                description: 'Hemoglobin A1c test results',
                dateUploaded: '2024-07-25T10:30:00.000Z',
                uploadedBy: 'Lab Tech',
                tags: ['diabetes', 'hba1c', 'glucose', 'lab']
            },
            {
                id: 4,
                patientId: 3,
                name: 'EKG_2024-07-15.pdf',
                type: 'application/pdf',
                size: 1024000, // 1MB
                category: 'cardiac',
                description: '12-lead electrocardiogram',
                dateUploaded: '2024-07-15T16:30:00.000Z',
                uploadedBy: 'Dr. Smith',
                tags: ['ekg', 'cardiac', 'heart', 'rhythm']
            }
        ];

        console.log('Sample data loaded successfully');
    },

    /**
     * Setup data validation rules
     */
    setupDataValidation() {
        // Add validation methods here if needed
        console.log('Data validation rules initialized');
    },

    /**
     * Get all patients
     */
    getPatients() {
        return [...patients];
    },

    /**
     * Get patient by ID
     */
    getPatientById(id) {
        return patients.find(patient => patient.id === id);
    },

    /**
     * Add new patient
     */
    addPatient(patientData) {
        const newPatient = {
            id: this.generateId('patient'),
            ...patientData,
            dateAdded: new Date().toISOString(),
            status: 'active'
        };
        patients.push(newPatient);
        return newPatient;
    },

    /**
     * Update existing patient
     */
    updatePatient(id, patientData) {
        const index = patients.findIndex(patient => patient.id === id);
        if (index !== -1) {
            patients[index] = { ...patients[index], ...patientData };
            return patients[index];
        }
        return null;
    },

    /**
     * Delete patient
     */
    deletePatient(id) {
        const index = patients.findIndex(patient => patient.id === id);
        if (index !== -1) {
            const deletedPatient = patients.splice(index, 1)[0];
            // Also delete related examinations and files
            examinations = examinations.filter(exam => exam.patientId !== id);
            files = files.filter(file => file.patientId !== id);
            return deletedPatient;
        }
        return null;
    },

    /**
     * Get all examinations
     */
    getExaminations() {
        return [...examinations];
    },

    /**
     * Get examinations by patient ID
     */
    getExaminationsByPatientId(patientId) {
        return examinations.filter(exam => exam.patientId === patientId);
    },

    /**
     * Add new examination
     */
    addExamination(examinationData) {
        const newExamination = {
            id: this.generateId('examination'),
            ...examinationData,
            status: 'completed'
        };
        examinations.push(newExamination);
        return newExamination;
    },

    /**
     * Get all files
     */
    getFiles() {
        return [...files];
    },

    /**
     * Get files by patient ID
     */
    getFilesByPatientId(patientId) {
        return files.filter(file => file.patientId === patientId);
    },

    /**
     * Add new file
     */
    addFile(fileData) {
        const newFile = {
            id: this.generateId('file'),
            ...fileData,
            dateUploaded: new Date().toISOString(),
            uploadedBy: APP_CONFIG.doctor.name
        };
        files.push(newFile);
        return newFile;
    },

    /**
     * Delete file
     */
    deleteFile(id) {
        const index = files.findIndex(file => file.id === id);
        if (index !== -1) {
            return files.splice(index, 1)[0];
        }
        return null;
    },

    /**
     * Generate unique ID
     */
    generateId(type = 'default') {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return parseInt(`${timestamp}${random}`);
    },

    /**
     * Search patients
     */
    searchPatients(query) {
        if (!query || query.trim() === '') {
            return this.getPatients();
        }

        const searchTerm = query.toLowerCase();
        return patients.filter(patient => 
            patient.firstName.toLowerCase().includes(searchTerm) ||
            patient.lastName.toLowerCase().includes(searchTerm) ||
            patient.phoneNumber.includes(searchTerm) ||
            patient.email.toLowerCase().includes(searchTerm) ||
            `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm)
        );
    },

    /**
     * Get statistics for dashboard
     */
    getStatistics() {
        const today = new Date().toDateString();
        const todayExams = examinations.filter(exam => 
            new Date(exam.date).toDateString() === today
        ).length;

        return {
            totalPatients: patients.length,
            todayExaminations: todayExams,
            totalFiles: files.length,
            activePatients: patients.filter(p => p.status === 'active').length
        };
    },

    /**
     * Get recent activity
     */
    getRecentActivity(limit = 5) {
        return examinations
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit)
            .map(exam => {
                const patient = this.getPatientById(exam.patientId);
                return {
                    ...exam,
                    patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
                };
            });
    },

    /**
     * Export data (for future implementation)
     */
    exportData(type = 'all') {
        const data = {
            patients: type === 'all' || type === 'patients' ? patients : [],
            examinations: type === 'all' || type === 'examinations' ? examinations : [],
            files: type === 'all' || type === 'files' ? files.map(f => ({ ...f, fileData: null })) : [],
            exportDate: new Date().toISOString(),
            version: APP_CONFIG.version
        };
        
        return JSON.stringify(data, null, 2);
    },

    /**
     * Clear all data
     */
    clearAllData() {
        patients = [];
        examinations = [];
        files = [];
        console.log('All data cleared');
    }
};

// Initialize data when script loads
document.addEventListener('DOMContentLoaded', () => {
    DataManager.init();
});

// Make DataManager available globally
window.DataManager = DataManager;