/**
 * Physician Dashboard - Examination Management
 * Handles all examination-related functionality
 */

const ExaminationManager = {
    
    /**
     * Initialize examination management
     */
    init() {
        this.setupDefaultDateTime();
        this.bindEvents();
        Utils.logEvent('ExaminationManager initialized');
    },
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Form validation on input change
        const form = document.querySelector('#examinationForm form');
        if (form) {
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
            });
        }
        
        Utils.logEvent('ExaminationManager events bound');
    },
    
    /**
     * Setup default date and time for examination form
     */
    setupDefaultDateTime() {
        const examDateInput = document.getElementById('examDate');
        if (examDateInput) {
            const now = new Date();
            // Adjust for timezone offset to get local time in ISO format
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            examDateInput.value = now.toISOString().slice(0, 16);
        }
    },
    
    /**
     * Update examination tab for selected patient
     * @param {number|null} patientId - Selected patient ID
     */
    updateForSelectedPatient(patientId) {
        const selectedPatientInfoDiv = document.getElementById('selectedPatientInfo');
        const examinationFormDiv = document.getElementById('examinationForm');
        const examinationHistoryDiv = document.getElementById('examinationHistory');
        
        if (!selectedPatientInfoDiv || !examinationFormDiv || !examinationHistoryDiv) {
            console.error('Examination tab elements not found');
            return;
        }
        
        if (!patientId) {
            selectedPatientInfoDiv.innerHTML = '<p>Please select a patient from the Patients tab to view/add examinations.</p>';
            examinationFormDiv.style.display = 'none';
            examinationHistoryDiv.innerHTML = '';
            return;
        }
        
        const patient = DataManager.getPatientById(patientId);
        if (!patient) {
            selectedPatientInfoDiv.innerHTML = '<p>Patient not found.</p>';
            examinationFormDiv.style.display = 'none';
            examinationHistoryDiv.innerHTML = '';
            return;
        }
        
        // Update patient info
        const age = Utils.calculateAge(patient.dateOfBirth);
        selectedPatientInfoDiv.innerHTML = `
            <div class="selected-patient-info">
                <h3>Selected Patient: ${Utils.sanitizeHtml(patient.firstName)} ${Utils.sanitizeHtml(patient.lastName)}</h3>
                <div class="patient-summary">
                    <span><strong>Age:</strong> ${age}</span> | 
                    <span><strong>Gender:</strong> ${Utils.capitalize(patient.gender)}</span> | 
                    <span><strong>Phone:</strong> ${Utils.formatPhoneNumber(patient.phoneNumber)}</span>
                    <br>
                    <span><strong>Medical History:</strong> ${Utils.sanitizeHtml(patient.medicalHistory || 'None recorded')}</span>
                </div>
            </div>
        `;
        
        // Show examination form
        examinationFormDiv.style.display = 'block';
        
        // Load and display examination history
        this.loadExaminationHistory(patientId);
        
        Utils.logEvent('Examination tab updated for patient', { patientId });
    },
    
    /**
     * Load examination history for a patient
     * @param {number} patientId - Patient ID
     */
    loadExaminationHistory(patientId) {
        const examinationHistoryDiv = document.getElementById('examinationHistory');
        if (!examinationHistoryDiv) return;
        
        const examinations = DataManager.getExaminationsByPatientId(patientId);
        
        if (examinations.length === 0) {
            examinationHistoryDiv.innerHTML = '<p class="empty-state">No examinations recorded for this patient.</p>';
            return;
        }
        
        // Sort examinations by date (most recent first)
        const sortedExaminations = examinations.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const historyHtml = sortedExaminations.map(exam => this.createExaminationCard(exam)).join('');
        examinationHistoryDiv.innerHTML = historyHtml;
        
        Utils.logEvent('Examination history loaded', { 
            patientId, 
            examinationCount: examinations.length 
        });
    },
    
    /**
     * Create HTML for an examination card
     * @param {Object} examination - Examination data
     * @returns {string} Examination card HTML
     */
    createExaminationCard(examination) {
        const examConfig = APP_CONFIG.examinationTypes[examination.type] || {};
        const vitals = Utils.formatVitalSigns(examination);
        const typeLabel = examConfig.label || Utils.capitalize(examination.type);
        const typeIcon = examConfig.icon || '🩺';
        
        return `
            <div class="examination-item" data-exam-id="${examination.id}">
                <div class="examination-header">
                    <strong>${typeIcon} ${Utils.formatDate(examination.date, 'datetime')}</strong>
                    <span class="examination-type">${typeLabel}</span>
                </div>
                
                ${this.renderVitalSigns(vitals)}
                
                ${examination.chiefComplaint ? `
                    <div class="examination-field">
                        <strong>Chief Complaint:</strong> ${Utils.sanitizeHtml(examination.chiefComplaint)}
                    </div>
                ` : ''}
                
                ${examination.physicalFindings ? `
                    <div class="examination-field">
                        <strong>Physical Findings:</strong> ${Utils.sanitizeHtml(examination.physicalFindings)}
                    </div>
                ` : ''}
                
                ${examination.diagnosis ? `
                    <div class="examination-field">
                        <strong>Diagnosis:</strong> ${Utils.sanitizeHtml(examination.diagnosis)}
                    </div>
                ` : ''}
                
                ${examination.treatmentPlan ? `
                    <div class="examination-field">
                        <strong>Treatment Plan:</strong> ${Utils.sanitizeHtml(examination.treatmentPlan)}
                    </div>
                ` : ''}
                
                ${examination.followUpInstructions ? `
                    <div class="examination-field">
                        <strong>Follow-up:</strong> ${Utils.sanitizeHtml(examination.followUpInstructions)}
                    </div>
                ` : ''}
                
                ${examination.doctorNotes ? `
                    <div class="examination-field">
                        <strong>Doctor's Notes:</strong> ${Utils.sanitizeHtml(examination.doctorNotes)}
                    </div>
                ` : ''}
                
                <div class="examination-footer">
                    <small>Duration: ${examination.duration || 'N/A'} minutes | Status: ${Utils.capitalize(examination.status || 'completed')}</small>
                </div>
            </div>
        `;
    },
    
    /**
     * Render vital signs section
     * @param {Object} vitals - Formatted vital signs
     * @returns {string} Vital signs HTML
     */
    renderVitalSigns(vitals) {
        const vitalItems = [];
        
        if (vitals.bloodPressure) vitalItems.push(`<strong>BP:</strong> ${vitals.bloodPressure}`);
        if (vitals.heartRate) vitalItems.push(`<strong>HR:</strong> ${vitals.heartRate}`);
        if (vitals.temperature) vitalItems.push(`<strong>Temp:</strong> ${vitals.temperature}`);
        if (vitals.weight) vitalItems.push(`<strong>Weight:</strong> ${vitals.weight}`);
        if (vitals.height) vitalItems.push(`<strong>Height:</strong> ${vitals.height}`);
        
        if (vitalItems.length === 0) return '';
        
        return `
            <div class="examination-vitals">
                ${vitalItems.join(' | ')}
            </div>
        `;
    },
    
    /**
     * Add new examination
     * @param {Event} event - Form submit event
     */
    addExamination(event) {
        event.preventDefault();
        
        const selectedPatient = PatientManager.getSelectedPatient();
        if (!selectedPatient) {
            Utils.showNotification('Please select a patient first', 'warning');
            return;
        }
        
        // Collect form data
        const formData = this.collectFormData();
        
        // Validate form data
        const validation = this.validateExaminationData(formData);
        if (!validation.isValid) {
            this.displayFormErrors(validation.errors);
            Utils.showNotification('Please correct the errors below', 'error');
            return;
        }
        
        try {
            // Add patient ID to form data
            formData.patientId = selectedPatient.id;
            
            // Add examination
            const savedExamination = DataManager.addExamination(formData);
            
            if (savedExamination) {
                // Clear form
                this.clearExaminationForm();
                
                // Reload examination history
                this.loadExaminationHistory(selectedPatient.id);
                
                // Update dashboard
                if (window.DashboardManager) {
                    DashboardManager.updateStats();
                    DashboardManager.updateRecentActivity();
                }
                
                Utils.showNotification('Examination added successfully', 'success');
                Utils.logEvent('Examination added', { 
                    patientId: selectedPatient.id,
                    examinationType: formData.type,
                    examinationId: savedExamination.id
                });
            } else {
                throw new Error('Failed to save examination');
            }
            
        } catch (error) {
            console.error('Error adding examination:', error);
            Utils.showNotification('Failed to add examination. Please try again.', 'error');
        }
    },
    
    /**
     * Collect form data
     * @returns {Object} Form data
     */
    collectFormData() {
        return {
            date: document.getElementById('examDate')?.value,
            type: document.getElementById('examType')?.value,
            bloodPressure: document.getElementById('bloodPressure')?.value?.trim(),
            heartRate: document.getElementById('heartRate')?.value,
            temperature: document.getElementById('temperature')?.value,
            weight: document.getElementById('weight')?.value,
            chiefComplaint: document.getElementById('chiefComplaint')?.value?.trim(),
            physicalFindings: document.getElementById('physicalFindings')?.value?.trim(),
            diagnosis: document.getElementById('diagnosis')?.value?.trim(),
            treatmentPlan: document.getElementById('treatmentPlan')?.value?.trim(),
            followUpInstructions: document.getElementById('followUpInstructions')?.value?.trim()
        };
    },
    
    /**
     * Validate examination data
     * @param {Object} data - Examination data
     * @returns {Object} Validation result
     */
    validateExaminationData(data) {
        const errors = {};
        let isValid = true;
        
        // Required fields
        if (Utils.isEmpty(data.date)) {
            errors.examDate = 'Examination date is required';
            isValid = false;
        }
        
        if (Utils.isEmpty(data.type)) {
            errors.examType = 'Examination type is required';
            isValid = false;
        }
        
        // Validate vital signs ranges
        if (data.heartRate && (data.heartRate < 30 || data.heartRate > 200)) {
            errors.heartRate = 'Heart rate must be between 30 and 200 BPM';
            isValid = false;
        }
        
        if (data.temperature && (data.temperature < 90 || data.temperature > 110)) {
            errors.temperature = 'Temperature must be between 90 and 110°F';
            isValid = false;
        }
        
        if (data.weight && (data.weight < 50 || data.weight > 500)) {
            errors.weight = 'Weight must be between 50 and 500 lbs';
            isValid = false;
        }
        
        // Validate blood pressure format
        if (data.bloodPressure && !/^\d{2,3}\/\d{2,3}$/.test(data.bloodPressure)) {
            errors.bloodPressure = 'Blood pressure must be in format XXX/XX (e.g., 120/80)';
            isValid = false;
        }
        
        // Check required fields based on examination type
        const examConfig = APP_CONFIG.examinationTypes[data.type];
        if (examConfig && examConfig.requiredFields) {
            examConfig.requiredFields.forEach(field => {
                const fieldValue = data[field];
                if (Utils.isEmpty(fieldValue)) {
                    const fieldName = this.getFieldDisplayName(field);
                    errors[field] = `${fieldName} is required for ${examConfig.label}`;
                    isValid = false;
                }
            });
        }
        
        return { isValid, errors };
    },
    
    /**
     * Get display name for form field
     * @param {string} fieldName - Field name
     * @returns {string} Display name
     */
    getFieldDisplayName(fieldName) {
        const fieldNames = {
            chiefComplaint: 'Chief Complaint',
            physicalFindings: 'Physical Findings',
            diagnosis: 'Diagnosis',
            treatmentPlan: 'Treatment Plan',
            followUpInstructions: 'Follow-up Instructions',
            bloodPressure: 'Blood Pressure',
            heartRate: 'Heart Rate',
            temperature: 'Temperature',
            weight: 'Weight'
        };
        
        return fieldNames[fieldName] || Utils.capitalize(fieldName);
    },
    
    /**
     * Display form validation errors
     * @param {Object} errors - Validation errors
     */
    displayFormErrors(errors) {
        // Clear previous errors
        this.clearFormErrors();
        
        // Display new errors
        Object.keys(errors).forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field) {
                field.classList.add('error');
                
                // Create error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.style.color = '#e74c3c';
                errorDiv.style.fontSize = '12px';
                errorDiv.style.marginTop = '4px';
                errorDiv.textContent = errors[fieldName];
                
                field.parentNode.appendChild(errorDiv);
            }
        });
    },
    
    /**
     * Clear form validation errors
     */
    clearFormErrors() {
        const errorMessages = document.querySelectorAll('#examinationForm .error-message');
        errorMessages.forEach(errorDiv => errorDiv.remove());
        
        const errorFields = document.querySelectorAll('#examinationForm .error');
        errorFields.forEach(field => field.classList.remove('error'));
    },
    
    /**
     * Validate individual form field
     * @param {HTMLElement} field - Form field element
     */
    validateField(field) {
        const value = field.value;
        let isValid = true;
        let errorMessage = '';
        
        // Remove existing error
        field.classList.remove('error');
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Validate based on field type
        switch (field.id) {
            case 'heartRate':
                if (value && (value < 30 || value > 200)) {
                    isValid = false;
                    errorMessage = 'Heart rate must be between 30 and 200 BPM';
                }
                break;
                
            case 'temperature':
                if (value && (value < 90 || value > 110)) {
                    isValid = false;
                    errorMessage = 'Temperature must be between 90 and 110°F';
                }
                break;
                
            case 'weight':
                if (value && (value < 50 || value > 500)) {
                    isValid = false;
                    errorMessage = 'Weight must be between 50 and 500 lbs';
                }
                break;
                
            case 'bloodPressure':
                if (value && !/^\d{2,3}\/\d{2,3}$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Blood pressure must be in format XXX/XX (e.g., 120/80)';
                }
                break;
        }
        
        if (!isValid) {
            field.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.color = '#e74c3c';
            errorDiv.style.fontSize = '12px';
            errorDiv.style.marginTop = '4px';
            errorDiv.textContent = errorMessage;
            field.parentNode.appendChild(errorDiv);
        }
    },
    
    /**
     * Clear examination form
     */
    clearExaminationForm() {
        const form = document.querySelector('#examinationForm form');
        if (form) {
            form.reset();
            
            // Reset to current datetime
            this.setupDefaultDateTime();
            
            // Clear any errors
            this.clearFormErrors();
        }
    },
    
    /**
     * Get examinations for today
     * @returns {Array} Today's examinations
     */
    getTodaysExaminations() {
        const today = new Date().toDateString();
        const allExaminations = DataManager.getExaminations();
        
        return allExaminations.filter(exam => {
            const examDate = new Date(exam.date).toDateString();
            return examDate === today;
        });
    },
    
    /**
     * Export examination data
     * @param {number} patientId - Patient ID (optional, exports all if not provided)
     * @param {string} format - Export format (json, csv)
     */
    exportExaminations(patientId = null, format = 'json') {
        const examinations = patientId 
            ? DataManager.getExaminationsByPatientId(patientId)
            : DataManager.getExaminations();
            
        if (examinations.length === 0) {
            Utils.showNotification('No examinations to export', 'warning');
            return;
        }
        
        // Add patient names to examination data
        const exportData = examinations.map(exam => {
            const patient = DataManager.getPatientById(exam.patientId);
            return {
                ...exam,
                patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
            };
        });
        
        let fileContent;
        let filename;
        let mimeType;
        
        if (format === 'csv') {
            fileContent = this.convertExaminationsToCSV(exportData);
            filename = `examinations_${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv';
        } else {
            fileContent = JSON.stringify(exportData, null, 2);
            filename = `examinations_${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
        }
        
        this.downloadFile(fileContent, filename, mimeType);
        
        Utils.logEvent('Examinations exported', { 
            format, 
            count: examinations.length,
            patientId 
        });
        Utils.showNotification(`Exported ${examinations.length} examinations`, 'success');
    },
    
    /**
     * Convert examinations to CSV
     * @param {Array} examinations - Examination data
     * @returns {string} CSV content
     */
    convertExaminationsToCSV(examinations) {
        const headers = [
            'ID', 'Patient Name', 'Date', 'Type', 'Blood Pressure', 'Heart Rate',
            'Temperature', 'Weight', 'Chief Complaint', 'Physical Findings',
            'Diagnosis', 'Treatment Plan', 'Follow-up Instructions', 'Duration', 'Status'
        ];
        
        const rows = examinations.map(exam => [
            exam.id,
            exam.patientName,
            Utils.formatDate(exam.date, 'datetime'),
            exam.type,
            exam.bloodPressure || '',
            exam.heartRate || '',
            exam.temperature || '',
            exam.weight || '',
            exam.chiefComplaint || '',
            exam.physicalFindings || '',
            exam.diagnosis || '',
            exam.treatmentPlan || '',
            exam.followUpInstructions || '',
            exam.duration || '',
            exam.status || 'completed'
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(','))
            .join('\n');
            
        return csvContent;
    },
    
    /**
     * Download file
     * @param {string} data - File data
     * @param {string} filename - File name
     * @param {string} mimeType - MIME type
     */
    downloadFile(data, filename, mimeType) {
        const blob = new Blob([data], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
};

// Global functions for HTML handlers
window.addExamination = (event) => ExaminationManager.addExamination(event);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ExaminationManager.init();
});

// Make ExaminationManager available globally
window.ExaminationManager = ExaminationManager;