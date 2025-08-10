/**
 * Physician Dashboard - Application Configuration
 * Contains all configuration constants and settings
 */

// Application Configuration
const APP_CONFIG = {
    // Application Info
    name: 'Physician Dashboard',
    version: '1.0.0',
    description: 'Professional Patient Management System',
    
    // Doctor Information (can be made dynamic in future)
    doctor: {
        name: 'Dr. John Smith, MD',
        specialization: 'Internal Medicine',
        licenseNumber: 'MD123456',
        clinic: 'Smith Medical Center'
    },
    
    // UI Settings
    ui: {
        animationDuration: 300,
        debounceDelay: 300,
        autoSaveDelay: 2000,
        maxRecentActivity: 5,
        itemsPerPage: 10
    },
    
    // File Upload Settings
    fileUpload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB in bytes
        allowedTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt']
    },
    
    // Validation Rules
    validation: {
        patient: {
            firstName: { required: true, minLength: 2, maxLength: 50 },
            lastName: { required: true, minLength: 2, maxLength: 50 },
            phoneNumber: { required: true, pattern: /^[\(\)\s\-\+\d]+$/ },
            email: { required: false, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
            dateOfBirth: { required: true },
            gender: { required: true, options: ['male', 'female', 'other'] }
        },
        examination: {
            date: { required: true },
            type: { required: true, options: ['routine', 'follow-up', 'consultation', 'emergency'] },
            heartRate: { min: 30, max: 200 },
            temperature: { min: 90, max: 110 },
            weight: { min: 50, max: 500 }
        }
    },
    
    // Data Storage Keys (for localStorage if implemented)
    storageKeys: {
        patients: 'physician_dashboard_patients',
        examinations: 'physician_dashboard_examinations',
        files: 'physician_dashboard_files',
        settings: 'physician_dashboard_settings'
    },
    
    // Default Values
    defaults: {
        examinationForm: {
            temperature: 98.6,
            heartRate: 72
        },
        pagination: {
            patientsPerPage: 20,
            examinationsPerPage: 10
        }
    },
    
    // API Endpoints (for future backend integration)
    api: {
        baseUrl: '/api/v1',
        endpoints: {
            patients: '/patients',
            examinations: '/examinations',
            files: '/files',
            auth: '/auth'
        }
    },
    
    // Date and Time Formats
    dateFormats: {
        display: {
            short: 'MM/DD/YYYY',
            long: 'MMMM DD, YYYY',
            time: 'hh:mm A',
            datetime: 'MM/DD/YYYY hh:mm A'
        },
        input: {
            date: 'YYYY-MM-DD',
            datetime: 'YYYY-MM-DDTHH:mm'
        }
    },
    
    // Examination Types Configuration
    examinationTypes: {
        routine: {
            label: 'Routine Checkup',
            color: '#27ae60',
            icon: '🩺',
            requiredFields: ['bloodPressure', 'heartRate', 'temperature']
        },
        'follow-up': {
            label: 'Follow-up',
            color: '#3498db',
            icon: '🔄',
            requiredFields: ['chiefComplaint']
        },
        consultation: {
            label: 'Consultation',
            color: '#9b59b6',
            icon: '💬',
            requiredFields: ['chiefComplaint', 'diagnosis']
        },
        emergency: {
            label: 'Emergency',
            color: '#e74c3c',
            icon: '🚨',
            requiredFields: ['chiefComplaint', 'physicalFindings', 'diagnosis']
        }
    },
    
    // Error Messages
    errorMessages: {
        validation: {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            phone: 'Please enter a valid phone number',
            minLength: 'This field must be at least {min} characters long',
            maxLength: 'This field cannot exceed {max} characters',
            invalidDate: 'Please enter a valid date',
            futureDate: 'Date cannot be in the future',
            invalidRange: 'Value must be between {min} and {max}'
        },
        system: {
            saveError: 'Failed to save data. Please try again.',
            deleteError: 'Failed to delete item. Please try again.',
            loadError: 'Failed to load data. Please refresh the page.',
            fileUploadError: 'Failed to upload file. Please try again.',
            fileSizeError: 'File size exceeds the maximum limit of {maxSize}MB',
            fileTypeError: 'File type not supported. Please upload: {allowedTypes}',
            networkError: 'Network error. Please check your connection.'
        },
        user: {
            noPatientSelected: 'Please select a patient first',
            noDataFound: 'No data found',
            confirmDelete: 'Are you sure you want to delete this item?',
            unsavedChanges: 'You have unsaved changes. Are you sure you want to leave?'
        }
    },
    
    // Success Messages
    successMessages: {
        patientSaved: 'Patient information saved successfully',
        patientDeleted: 'Patient deleted successfully',
        examinationSaved: 'Examination record saved successfully',
        fileUploaded: 'File uploaded successfully',
        fileDeleted: 'File deleted successfully'
    },
    
    // Theme Configuration
    theme: {
        colors: {
            primary: '#667eea',
            secondary: '#764ba2',
            success: '#27ae60',
            warning: '#f39c12',
            danger: '#e74c3c',
            info: '#3498db',
            light: '#ecf0f1',
            dark: '#2c3e50'
        },
        breakpoints: {
            xs: '0px',
            sm: '576px',
            md: '768px',
            lg: '992px',
            xl: '1200px',
            xxl: '1400px'
        }
    },
    
    // Feature Flags (for enabling/disabling features)
    features: {
        exportData: true,
        printRecords: true,
        darkMode: false,
        notifications: true,
        autoBackup: false,
        multiLanguage: false,
        patientPortal: false
    },
    
    // Performance Settings
    performance: {
        lazyLoadImages: true,
        virtualScrolling: false,
        cacheTimeout: 5 * 60 * 1000, // 5 minutes
        maxCacheSize: 100
    }
};

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
}

// Make available globally
window.APP_CONFIG = APP_CONFIG;