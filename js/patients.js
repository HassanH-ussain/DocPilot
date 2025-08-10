/**
 * Physician Dashboard - Patient Management
 * Handles all patient-related functionality
 */

const PatientManager = {
    
    // Currently selected patient ID
    selectedPatientId: null,
    
    // Patient being edited
    editingPatientId: null,
    
    // Search debouncer
    searchDebouncer: null,
    
    /**
     * Initialize patient management
     */
    init() {
        this.bindEvents();
        this.renderPatients();
        Utils.logEvent('PatientManager initialized');
    },
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Modal events
        document.addEventListener('click', (e) => {
            if (e.target.id === 'patientModal') {
                this.closePatientModal();
            }
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen()) {
                this.closePatientModal();
            }
        });
        
        // Initialize search debouncer
        this.searchDebouncer = Utils.debounce(this.performSearch.bind(this), 300);
        
        Utils.logEvent('PatientManager events bound');
    },
    
    /**
     * Render all patients in the patient list
     */
    renderPatients() {
        const patients = DataManager.getPatients();
        const patientsListDiv = document.getElementById('patientsList');
        
        if (!patientsListDiv) {
            console.error('Patients list container not found');
            return;
        }
        
        if (patients.length === 0) {
            patientsListDiv.innerHTML = this.getEmptyState('No patients found');
            return;
        }
        
        const patientsHtml = patients.map(patient => this.createPatientCard(patient)).join('');
        patientsListDiv.innerHTML = patientsHtml;
        
        Utils.logEvent('Patients rendered', { count: patients.length });
    },
    
    /**
     * Create HTML for a patient card
     * @param {Object} patient - Patient data
     * @returns {string} Patient card HTML
     */
    createPatientCard(patient) {
        const age = Utils.calculateAge(patient.dateOfBirth);
        const lastVisit = patient.lastVisit ? Utils.formatDate(patient.lastVisit, 'short') : 'Never';
        const isSelected = this.selectedPatientId === patient.id;
        
        return `
            <div class="patient-card ${isSelected ? 'selected' : ''}" 
                 onclick="PatientManager.selectPatient(${patient.id})"
                 data-patient-id="${patient.id}">
                <div class="patient-info">
                    <div class="patient-details">
                        <h3>${Utils.sanitizeHtml(patient.firstName)} ${Utils.sanitizeHtml(patient.lastName)}</h3>
                        <div class="patient-meta">
                            <span><strong>DOB:</strong> ${Utils.formatDate(patient.dateOfBirth, 'short')} (Age: ${age})</span> |
                            <span><strong>Phone:</strong> ${Utils.formatPhoneNumber(patient.phoneNumber)}</span> |
                            <span><strong>Gender:</strong> ${Utils.capitalize(patient.gender)}</span>
                            <br>
                            <span><strong>Last Visit:</strong> ${lastVisit}</span>
                            ${patient.status !== 'active' ? ` | <span class="status-${patient.status}"><strong>Status:</strong> ${Utils.capitalize(patient.status)}</span>` : ''}
                        </div>
                    </div>
                    <div class="patient-id">
                        <span class="status-indicator ${patient.status || 'active'}"></span>
                        ${Utils.formatMRN(patient.id)}
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Select a patient
     * @param {number} patientId - Patient ID to select
     */
    selectPatient(patientId) {
        this.selectedPatientId = patientId;
        this.renderPatients();
        
        // Update other components that depend on selected patient
        if (window.ExaminationManager) {
            ExaminationManager.updateForSelectedPatient(patientId);
        }
        if (window.FileManager) {
            FileManager.updateForSelectedPatient(patientId);
        }
        
        const patient = DataManager.getPatientById(patientId);
        Utils.logEvent('Patient selected', { 
            patientId, 
            patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown' 
        });
        
        Utils.showNotification(`Selected patient: ${patient.firstName} ${patient.lastName}`, 'info', 2000);
    },
    
    /**
     * Search patients
     * @param {string} query - Search query
     */
    searchPatients(query) {
        this.searchDebouncer(query);
    },
    
    /**
     * Perform the actual search
     * @param {string} query - Search query
     */
    performSearch(query) {
        const filteredPatients = DataManager.searchPatients(query);
        const patientsListDiv = document.getElementById('patientsList');
        
        if (!patientsListDiv) return;
        
        if (filteredPatients.length === 0) {
            patientsListDiv.innerHTML = this.getEmptyState(
                query ? `No patients found matching "${Utils.sanitizeHtml(query)}"` : 'No patients found'
            );
            return;
        }
        
        const patientsHtml = filteredPatients.map(patient => this.createPatientCard(patient)).join('');
        patientsListDiv.innerHTML = patientsHtml;
        
        Utils.logEvent('Patient search performed', { 
            query, 
            resultCount: filteredPatients.length 
        });
    },
    
    /**
     * Open patient modal for adding new patient
     */
    openPatientModal() {
        this.editingPatientId = null;
        const modalTitle = document.getElementById('modalTitle');
        const modal = document.getElementById('patientModal');
        
        if (modalTitle) {
            modalTitle.textContent = 'Add New Patient';
        }
        
        this.clearPatientForm();
        
        if (modal) {
            modal.style.display = 'block';
            // Focus on first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
        
        Utils.logEvent('Patient modal opened for new patient');
    },
    
    /**
     * Edit selected patient
     */
    editSelectedPatient() {
        if (!this.selectedPatientId) {
            Utils.showNotification('Please select a patient to edit', 'warning');
            return;
        }
        
        const patient = DataManager.getPatientById(this.selectedPatientId);
        if (!patient) {
            Utils.showNotification('Patient not found', 'error');
            return;
        }
        
        this.editingPatientId = this.selectedPatientId;
        const modalTitle = document.getElementById('modalTitle');
        const modal = document.getElementById('patientModal');
        
        if (modalTitle) {
            modalTitle.textContent = 'Edit Patient';
        }
        
        this.fillPatientForm(patient);
        
        if (modal) {
            modal.style.display = 'block';
        }
        
        Utils.logEvent('Patient modal opened for editing', { 
            patientId: this.selectedPatientId 
        });
    },
    
    /**
     * Delete selected patient
     */
    async deleteSelectedPatient() {
        if (!this.selectedPatientId) {
            Utils.showNotification('Please select a patient to delete', 'warning');
            return;
        }
        
        const patient = DataManager.getPatientById(this.selectedPatientId);
        if (!patient) {
            Utils.showNotification('Patient not found', 'error');
            return;
        }
        
        const confirmMessage = `Are you sure you want to delete ${patient.firstName} ${patient.lastName}?\n\nThis will also delete all associated examinations and files. This action cannot be undone.`;
        
        const confirmed = await Utils.showConfirm(confirmMessage, 'Delete Patient');
        
        if (confirmed) {
            const deletedPatient = DataManager.deletePatient(this.selectedPatientId);
            
            if (deletedPatient) {
                this.selectedPatientId = null;
                this.renderPatients();
                
                // Update dashboard and other components
                if (window.DashboardManager) {
                    DashboardManager.updateStats();
                }
                if (window.ExaminationManager) {
                    ExaminationManager.updateForSelectedPatient(null);
                }
                if (window.FileManager) {
                    FileManager.updateForSelectedPatient(null);
                }
                
                Utils.showNotification(
                    `${deletedPatient.firstName} ${deletedPatient.lastName} has been deleted`,
                    'success'
                );
                
                Utils.logEvent('Patient deleted', { 
                    patientId: deletedPatient.id,
                    patientName: `${deletedPatient.firstName} ${deletedPatient.lastName}`
                });
            } else {
                Utils.showNotification('Failed to delete patient', 'error');
            }
        }
    },
    
    /**
     * Close patient modal
     */
    closePatientModal() {
        const modal = document.getElementById('patientModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.clearPatientForm();
        this.editingPatientId = null;
        
        Utils.logEvent('Patient modal closed');
    },
    
    /**
     * Clear patient form
     */
    clearPatientForm() {
        const formFields = [
            'firstName', 'lastName', 'dateOfBirth', 'gender', 
            'phoneNumber', 'email', 'address', 'medicalHistory', 'insuranceInfo'
        ];
        
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
                field.classList.remove('error');
            }
        });
        
        // Clear any error messages
        this.clearFormErrors();
    },
    
    /**
     * Fill patient form with data
     * @param {Object} patient - Patient data
     */
    fillPatientForm(patient) {
        const formFields = [
            'firstName', 'lastName', 'dateOfBirth', 'gender',
            'phoneNumber', 'email', 'address', 'medicalHistory', 'insuranceInfo'
        ];
        
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && patient[fieldId] !== undefined) {
                field.value = patient[fieldId];
                field.classList.remove('error');
            }
        });
        
        this.clearFormErrors();
    },
    
    /**
     * Save patient (add new or update existing)
     * @param {Event} event - Form submit event
     */
    savePatient(event) {
        event.preventDefault();
        
        // Collect form data
        const formData = {
            firstName: document.getElementById('firstName')?.value?.trim(),
            lastName: document.getElementById('lastName')?.value?.trim(),
            dateOfBirth: document.getElementById('dateOfBirth')?.value,
            gender: document.getElementById('gender')?.value,
            phoneNumber: document.getElementById('phoneNumber')?.value?.trim(),
            email: document.getElementById('email')?.value?.trim(),
            address: document.getElementById('address')?.value?.trim(),
            medicalHistory: document.getElementById('medicalHistory')?.value?.trim(),
            insuranceInfo: document.getElementById('insuranceInfo')?.value?.trim()
        };
        
        // Validate form data
        const validation = Utils.validateForm(formData, APP_CONFIG.validation.patient);
        
        if (!validation.isValid) {
            this.displayFormErrors(validation.errors);
            Utils.showNotification('Please correct the errors below', 'error');
            return;
        }
        
        try {
            let savedPatient;
            
            if (this.editingPatientId) {
                // Update existing patient
                savedPatient = DataManager.updatePatient(this.editingPatientId, formData);
                if (savedPatient) {
                    Utils.showNotification(
                        `${savedPatient.firstName} ${savedPatient.lastName} updated successfully`,
                        'success'
                    );
                    Utils.logEvent('Patient updated', { 
                        patientId: savedPatient.id 
                    });
                } else {
                    throw new Error('Failed to update patient');
                }
            } else {
                // Add new patient
                savedPatient = DataManager.addPatient(formData);
                if (savedPatient) {
                    Utils.showNotification(
                        `${savedPatient.firstName} ${savedPatient.lastName} added successfully`,
                        'success'
                    );
                    Utils.logEvent('Patient added', { 
                        patientId: savedPatient.id 
                    });
                } else {
                    throw new Error('Failed to add patient');
                }
            }
            
            // Close modal and refresh data
            this.closePatientModal();
            this.renderPatients();
            
            // Update dashboard
            if (window.DashboardManager) {
                DashboardManager.updateStats();
            }
            
        } catch (error) {
            console.error('Error saving patient:', error);
            Utils.showNotification('Failed to save patient. Please try again.', 'error');
        }
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
                
                // Create or update error message
                let errorDiv = field.parentNode.querySelector('.error-message');
                if (!errorDiv) {
                    errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message';
                    errorDiv.style.color = '#e74c3c';
                    errorDiv.style.fontSize = '12px';
                    errorDiv.style.marginTop = '4px';
                    field.parentNode.appendChild(errorDiv);
                }
                errorDiv.textContent = errors[fieldName];
            }
        });
    },
    
    /**
     * Clear form validation errors
     */
    clearFormErrors() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(errorDiv => errorDiv.remove());
        
        const errorFields = document.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
    },
    
    /**
     * Check if modal is open
     * @returns {boolean} Is modal open
     */
    isModalOpen() {
        const modal = document.getElementById('patientModal');
        return modal && modal.style.display === 'block';
    },
    
    /**
     * Get empty state HTML
     * @param {string} message - Empty state message
     * @returns {string} Empty state HTML
     */
    getEmptyState(message) {
        return `
            <div class="empty-state">
                <p>${Utils.sanitizeHtml(message)}</p>
            </div>
        `;
    },
    
    /**
     * Get selected patient
     * @returns {Object|null} Selected patient or null
     */
    getSelectedPatient() {
        return this.selectedPatientId ? DataManager.getPatientById(this.selectedPatientId) : null;
    },
    
    /**
     * Export patient data
     * @param {string} format - Export format (json, csv)
     */
    exportPatients(format = 'json') {
        const patients = DataManager.getPatients();
        
        if (patients.length === 0) {
            Utils.showNotification('No patients to export', 'warning');
            return;
        }
        
        let exportData;
        let filename;
        let mimeType;
        
        if (format === 'csv') {
            exportData = this.convertToCSV(patients);
            filename = `patients_${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv';
        } else {
            exportData = JSON.stringify(patients, null, 2);
            filename = `patients_${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
        }
        
        this.downloadFile(exportData, filename, mimeType);
        
        Utils.logEvent('Patients exported', { format, count: patients.length });
        Utils.showNotification(`Exported ${patients.length} patients`, 'success');
    },
    
    /**
     * Convert patient data to CSV
     * @param {Array} patients - Patient data array
     * @returns {string} CSV data
     */
    convertToCSV(patients) {
        const headers = [
            'ID', 'First Name', 'Last Name', 'Date of Birth', 'Age', 'Gender',
            'Phone Number', 'Email', 'Address', 'Medical History', 'Insurance Info', 'Date Added'
        ];
        
        const rows = patients.map(patient => [
            patient.id,
            patient.firstName,
            patient.lastName,
            patient.dateOfBirth,
            Utils.calculateAge(patient.dateOfBirth),
            patient.gender,
            patient.phoneNumber,
            patient.email,
            patient.address,
            patient.medicalHistory,
            patient.insuranceInfo,
            Utils.formatDate(patient.dateAdded || '', 'datetime')
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

// Global functions for HTML onclick handlers
window.selectPatient = (id) => PatientManager.selectPatient(id);
window.searchPatients = (query) => PatientManager.searchPatients(query);
window.openPatientModal = () => PatientManager.openPatientModal();
window.editSelectedPatient = () => PatientManager.editSelectedPatient();
window.deleteSelectedPatient = () => PatientManager.deleteSelectedPatient();
window.closePatientModal = () => PatientManager.closePatientModal();
window.savePatient = (event) => PatientManager.savePatient(event);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    PatientManager.init();
});

// Make PatientManager available globally
window.PatientManager = PatientManager;