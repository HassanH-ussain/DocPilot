/**
 * Physician Dashboard - File Management
 * Handles all file-related functionality including upload, display, and deletion
 */

const FileManager = {
    
    /**
     * Initialize file management
     */
    init() {
        this.bindEvents();
        Utils.logEvent('FileManager initialized');
    },
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // File input change event
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }
        
        // Drag and drop events for file upload area
        const uploadArea = document.querySelector('.file-upload-area');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        }
        
        Utils.logEvent('FileManager events bound');
    },
    
    /**
     * Update files tab for selected patient
     * @param {number|null} patientId - Selected patient ID
     */
    updateForSelectedPatient(patientId) {
        const infoDiv = document.getElementById('fileSelectedPatientInfo');
        const managementDiv = document.getElementById('fileManagement');
        const fileListDiv = document.getElementById('fileList');
        
        if (!infoDiv || !managementDiv || !fileListDiv) {
            console.error('File tab elements not found');
            return;
        }
        
        if (!patientId) {
            infoDiv.innerHTML = '<p>Please select a patient from the Patients tab to manage files.</p>';
            managementDiv.style.display = 'none';
            return;
        }
        
        const patient = DataManager.getPatientById(patientId);
        if (!patient) {
            infoDiv.innerHTML = '<p>Patient not found.</p>';
            managementDiv.style.display = 'none';
            return;
        }
        
        // Update patient info
        infoDiv.innerHTML = `
            <div class="selected-patient-info">
                <h3>Files for: ${Utils.sanitizeHtml(patient.firstName)} ${Utils.sanitizeHtml(patient.lastName)}</h3>
                <div class="patient-summary">
                    <span><strong>Patient ID:</strong> ${Utils.formatMRN(patient.id)}</span> | 
                    <span><strong>DOB:</strong> ${Utils.formatDate(patient.dateOfBirth, 'short')}</span>
                </div>
            </div>
        `;
        
        // Show file management section
        managementDiv.style.display = 'block';
        
        // Load and display files
        this.loadPatientFiles(patientId);
        
        Utils.logEvent('Files tab updated for patient', { patientId });
    },
    
    /**
     * Load files for a patient
     * @param {number} patientId - Patient ID
     */
    loadPatientFiles(patientId) {
        const fileListDiv = document.getElementById('fileList');
        if (!fileListDiv) return;
        
        const files = DataManager.getFilesByPatientId(patientId);
        
        if (files.length === 0) {
            fileListDiv.innerHTML = '<p class="empty-state">No files uploaded for this patient.</p>';
            return;
        }
        
        // Sort files by upload date (most recent first)
        const sortedFiles = files.sort((a, b) => new Date(b.dateUploaded) - new Date(a.dateUploaded));
        
        const filesHtml = sortedFiles.map(file => this.createFileCard(file)).join('');
        fileListDiv.innerHTML = filesHtml;
        
        Utils.logEvent('Patient files loaded', { 
            patientId, 
            fileCount: files.length 
        });
    },
    
    /**
     * Create HTML for a file card
     * @param {Object} file - File data
     * @returns {string} File card HTML
     */
    createFileCard(file) {
        const fileIcon = Utils.getFileIcon(file.type);
        const fileSize = Utils.formatFileSize(file.size);
        const uploadDate = Utils.formatDate(file.dateUploaded, 'datetime');
        const category = file.category ? Utils.capitalize(file.category.replace('-', ' ')) : 'General';
        
        return `
            <div class="file-item" data-file-id="${file.id}">
                <div class="file-info">
                    <div class="file-header">
                        <span class="file-icon">${fileIcon}</span>
                        <strong class="file-name">${Utils.sanitizeHtml(file.name)}</strong>
                        <span class="file-category">${category}</span>
                    </div>
                    <div class="file-meta">
                        <span><strong>Size:</strong> ${fileSize}</span> | 
                        <span><strong>Uploaded:</strong> ${uploadDate}</span> | 
                        <span><strong>By:</strong> ${Utils.sanitizeHtml(file.uploadedBy || 'Unknown')}</span>
                    </div>
                    ${file.description ? `
                        <div class="file-description">
                            <strong>Description:</strong> ${Utils.sanitizeHtml(file.description)}
                        </div>
                    ` : ''}
                    ${file.tags && file.tags.length > 0 ? `
                        <div class="file-tags">
                            <strong>Tags:</strong> 
                            ${file.tags.map(tag => `<span class="tag">${Utils.sanitizeHtml(tag)}</span>`).join(' ')}
                        </div>
                    ` : ''}
                </div>
                <div class="file-actions">
                    <button class="btn btn-secondary btn-sm" onclick="FileManager.downloadFile(${file.id})" title="Download">
                        📥 Download
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="FileManager.deleteFile(${file.id})" title="Delete">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    },
    
    /**
     * Handle file upload
     * @param {Event} event - File input change event
     */
    handleFileUpload(event) {
        const files = Array.from(event.target.files);
        this.processFiles(files);
    },
    
    /**
     * Handle drag over event
     * @param {Event} event - Drag over event
     */
    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('drag-over');
    },
    
    /**
     * Handle drag leave event
     * @param {Event} event - Drag leave event
     */
    handleDragLeave(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
    },
    
    /**
     * Handle file drop event
     * @param {Event} event - Drop event
     */
    handleFileDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
        
        const files = Array.from(event.dataTransfer.files);
        this.processFiles(files);
    },
    
    /**
     * Process uploaded files
     * @param {Array} files - Array of File objects
     */
    processFiles(files) {
        const selectedPatient = PatientManager.getSelectedPatient();
        if (!selectedPatient) {
            Utils.showNotification('Please select a patient first', 'warning');
            return;
        }
        
        if (files.length === 0) {
            Utils.showNotification('No files selected', 'warning');
            return;
        }
        
        // Validate files
        const validationResults = files.map(file => this.validateFile(file));
        const validFiles = validationResults.filter(result => result.isValid).map(result => result.file);
        const invalidFiles = validationResults.filter(result => !result.isValid);
        
        // Show validation errors
        if (invalidFiles.length > 0) {
            const errorMessages = invalidFiles.map(result => `${result.file.name}: ${result.error}`);
            Utils.showNotification(`Some files were rejected:\n${errorMessages.join('\n')}`, 'error');
        }
        
        if (validFiles.length === 0) {
            return;
        }
        
        // Process valid files
        this.uploadFiles(validFiles, selectedPatient.id);
    },
    
    /**
     * Validate a file
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateFile(file) {
        const config = APP_CONFIG.fileUpload;
        
        // Check file size
        if (file.size > config.maxFileSize) {
            return {
                isValid: false,
                file: file,
                error: `File size exceeds ${Utils.formatFileSize(config.maxFileSize)} limit`
            };
        }
        
        // Check file type
        if (!config.allowedTypes.includes(file.type)) {
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            if (!config.allowedExtensions.includes(extension)) {
                return {
                    isValid: false,
                    file: file,
                    error: 'File type not supported'
                };
            }
        }
        
        return {
            isValid: true,
            file: file
        };
    },
    
    /**
     * Upload files
     * @param {Array} files - Array of valid File objects
     * @param {number} patientId - Patient ID
     */
    uploadFiles(files, patientId) {
        let uploadedCount = 0;
        
        files.forEach(file => {
            try {
                // Create file data object
                const fileData = {
                    patientId: patientId,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    category: this.categorizeFile(file),
                    description: this.generateFileDescription(file),
                    tags: this.generateFileTags(file)
                };
                
                // Save file metadata (in a real app, you'd upload the actual file to a server)
                const savedFile = DataManager.addFile(fileData);
                
                if (savedFile) {
                    uploadedCount++;
                    Utils.logEvent('File uploaded', {
                        fileId: savedFile.id,
                        fileName: file.name,
                        fileSize: file.size,
                        patientId: patientId
                    });
                }
                
            } catch (error) {
                console.error('Error uploading file:', file.name, error);
            }
        });
        
        // Update UI
        if (uploadedCount > 0) {
            this.loadPatientFiles(patientId);
            
            // Update dashboard
            if (window.DashboardManager) {
                DashboardManager.updateStats();
            }
            
            Utils.showNotification(
                `${uploadedCount} file${uploadedCount > 1 ? 's' : ''} uploaded successfully`,
                'success'
            );
        }
        
        // Reset file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    },
    
    /**
     * Categorize file based on type and name
     * @param {File} file - File object
     * @returns {string} File category
     */
    categorizeFile(file) {
        const fileName = file.name.toLowerCase();
        const fileType = file.type.toLowerCase();
        
        // Image files
        if (fileType.startsWith('image/')) {
            if (fileName.includes('xray') || fileName.includes('x-ray')) {
                return 'imaging';
            }
            if (fileName.includes('scan') || fileName.includes('mri') || fileName.includes('ct')) {
                return 'imaging';
            }
            return 'photos';
        }
        
        // PDF files
        if (fileType === 'application/pdf') {
            if (fileName.includes('lab') || fileName.includes('blood') || fileName.includes('test')) {
                return 'lab-results';
            }
            if (fileName.includes('report') || fileName.includes('summary')) {
                return 'reports';
            }
            if (fileName.includes('prescription') || fileName.includes('rx')) {
                return 'prescriptions';
            }
            if (fileName.includes('insurance') || fileName.includes('billing')) {
                return 'insurance';
            }
            return 'documents';
        }
        
        // Document files
        if (fileType.includes('word') || fileType.includes('document') || fileType === 'text/plain') {
            return 'documents';
        }
        
        return 'general';
    },
    
    /**
     * Generate file description based on file name and type
     * @param {File} file - File object
     * @returns {string} Generated description
     */
    generateFileDescription(file) {
        const fileName = file.name.toLowerCase();
        const category = this.categorizeFile(file);
        
        // Generate smart descriptions based on file name patterns
        if (fileName.includes('xray') || fileName.includes('x-ray')) {
            return 'X-ray imaging study';
        }
        if (fileName.includes('mri')) {
            return 'MRI scan';
        }
        if (fileName.includes('ct') || fileName.includes('cat')) {
            return 'CT scan';
        }
        if (fileName.includes('ultrasound') || fileName.includes('echo')) {
            return 'Ultrasound study';
        }
        if (fileName.includes('lab') || fileName.includes('blood')) {
            return 'Laboratory test results';
        }
        if (fileName.includes('prescription') || fileName.includes('rx')) {
            return 'Prescription document';
        }
        if (fileName.includes('discharge') || fileName.includes('summary')) {
            return 'Discharge summary';
        }
        if (fileName.includes('consent')) {
            return 'Consent form';
        }
        if (fileName.includes('insurance')) {
            return 'Insurance documentation';
        }
        
        return `${Utils.capitalize(category)} file`;
    },
    
    /**
     * Generate tags for file based on name and type
     * @param {File} file - File object
     * @returns {Array} Array of tags
     */
    generateFileTags(file) {
        const fileName = file.name.toLowerCase();
        const tags = [];
        
        // Add category-based tags
        const category = this.categorizeFile(file);
        tags.push(category);
        
        // Add content-based tags
        if (fileName.includes('xray') || fileName.includes('x-ray')) {
            tags.push('x-ray', 'imaging');
        }
        if (fileName.includes('mri')) {
            tags.push('mri', 'imaging');
        }
        if (fileName.includes('ct')) {
            tags.push('ct-scan', 'imaging');
        }
        if (fileName.includes('blood')) {
            tags.push('blood-work', 'lab');
        }
        if (fileName.includes('urine')) {
            tags.push('urinalysis', 'lab');
        }
        if (fileName.includes('ekg') || fileName.includes('ecg')) {
            tags.push('ekg', 'cardiac');
        }
        if (fileName.includes('echo')) {
            tags.push('echocardiogram', 'cardiac');
        }
        if (fileName.includes('prescription')) {
            tags.push('prescription', 'medication');
        }
        
        // Add date-based tags if found in filename
        const dateMatch = fileName.match(/(\d{4}[-_]\d{2}[-_]\d{2})/);
        if (dateMatch) {
            tags.push(dateMatch[1].replace(/[-_]/g, '-'));
        }
        
        return [...new Set(tags)]; // Remove duplicates
    },
    
    /**
     * Delete a file
     * @param {number} fileId - File ID to delete
     */
    async deleteFile(fileId) {
        const file = DataManager.getFiles().find(f => f.id === fileId);
        if (!file) {
            Utils.showNotification('File not found', 'error');
            return;
        }
        
        const confirmed = await Utils.showConfirm(
            `Are you sure you want to delete "${file.name}"?\n\nThis action cannot be undone.`,
            'Delete File'
        );
        
        if (confirmed) {
            const deletedFile = DataManager.deleteFile(fileId);
            
            if (deletedFile) {
                // Reload files for current patient
                const selectedPatient = PatientManager.getSelectedPatient();
                if (selectedPatient) {
                    this.loadPatientFiles(selectedPatient.id);
                }
                
                // Update dashboard
                if (window.DashboardManager) {
                    DashboardManager.updateStats();
                }
                
                Utils.showNotification(`"${deletedFile.name}" has been deleted`, 'success');
                Utils.logEvent('File deleted', { 
                    fileId: deletedFile.id,
                    fileName: deletedFile.name,
                    patientId: deletedFile.patientId
                });
            } else {
                Utils.showNotification('Failed to delete file', 'error');
            }
        }
    },
    
    /**
     * Download a file (simulate download)
     * @param {number} fileId - File ID to download
     */
    downloadFile(fileId) {
        const file = DataManager.getFiles().find(f => f.id === fileId);
        if (!file) {
            Utils.showNotification('File not found', 'error');
            return;
        }
        
        // In a real application, this would download the actual file
        // For now, we'll simulate the download
        Utils.showNotification(`Download started: ${file.name}`, 'info');
        
        Utils.logEvent('File download initiated', {
            fileId: file.id,
            fileName: file.name,
            patientId: file.patientId
        });
        
        // Simulate download delay
        setTimeout(() => {
            Utils.showNotification(`Download completed: ${file.name}`, 'success');
        }, 1500);
    },
    
    /**
     * Get file statistics
     * @param {number} patientId - Patient ID (optional)
     * @returns {Object} File statistics
     */
    getFileStatistics(patientId = null) {
        const files = patientId 
            ? DataManager.getFilesByPatientId(patientId)
            : DataManager.getFiles();
            
        const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
        const categories = {};
        
        files.forEach(file => {
            const category = file.category || 'general';
            categories[category] = (categories[category] || 0) + 1;
        });
        
        return {
            totalFiles: files.length,
            totalSize: totalSize,
            totalSizeFormatted: Utils.formatFileSize(totalSize),
            categories: categories,
            averageFileSize: files.length > 0 ? totalSize / files.length : 0
        };
    },
    
    /**
     * Export file list
     * @param {number} patientId - Patient ID (optional)
     * @param {string} format - Export format (json, csv)
     */
    exportFileList(patientId = null, format = 'json') {
        const files = patientId 
            ? DataManager.getFilesByPatientId(patientId)
            : DataManager.getFiles();
            
        if (files.length === 0) {
            Utils.showNotification('No files to export', 'warning');
            return;
        }
        
        // Add patient names to file data
        const exportData = files.map(file => {
            const patient = DataManager.getPatientById(file.patientId);
            return {
                ...file,
                patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
            };
        });
        
        let fileContent;
        let filename;
        let mimeType;
        
        if (format === 'csv') {
            fileContent = this.convertFilesToCSV(exportData);
            filename = `files_${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv';
        } else {
            fileContent = JSON.stringify(exportData, null, 2);
            filename = `files_${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
        }
        
        this.downloadExportFile(fileContent, filename, mimeType);
        
        Utils.logEvent('File list exported', { 
            format, 
            count: files.length,
            patientId 
        });
        Utils.showNotification(`Exported ${files.length} file records`, 'success');
    },
    
    /**
     * Convert files to CSV
     * @param {Array} files - File data array
     * @returns {string} CSV content
     */
    convertFilesToCSV(files) {
        const headers = [
            'ID', 'Patient Name', 'File Name', 'Type', 'Size', 'Category',
            'Description', 'Tags', 'Upload Date', 'Uploaded By'
        ];
        
        const rows = files.map(file => [
            file.id,
            file.patientName,
            file.name,
            file.type,
            Utils.formatFileSize(file.size),
            file.category || '',
            file.description || '',
            (file.tags || []).join('; '),
            Utils.formatDate(file.dateUploaded, 'datetime'),
            file.uploadedBy || ''
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(','))
            .join('\n');
            
        return csvContent;
    },
    
    /**
     * Download export file
     * @param {string} data - File data
     * @param {string} filename - File name
     * @param {string} mimeType - MIME type
     */
    downloadExportFile(data, filename, mimeType) {
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
window.handleFileUpload = (event) => FileManager.handleFileUpload(event);
window.deleteFile = (fileId) => FileManager.deleteFile(fileId);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    FileManager.init();
});

// Make FileManager available globally
window.FileManager = FileManager;