/**
 * Physician Dashboard - Dashboard Management
 * Handles dashboard statistics, recent activity, and overview functionality
 */

const DashboardManager = {
    
    // Update intervals
    updateInterval: null,
    
    /**
     * Initialize dashboard management
     */
    init() {
        this.updateCurrentDate();
        this.updateStats();
        this.updateRecentActivity();
        this.startAutoUpdate();
        Utils.logEvent('DashboardManager initialized');
    },
    
    /**
     * Update current date in header
     */
    updateCurrentDate() {
        const currentDateElement = document.getElementById('currentDate');
        if (currentDateElement) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            currentDateElement.textContent = now.toLocaleDateString('en-US', options);
        }
    },
    
    /**
     * Update dashboard statistics
     */
    updateStats() {
        try {
            const stats = DataManager.getStatistics();
            
            // Update stat cards
            this.updateStatCard('totalPatientsCount', stats.totalPatients);
            this.updateStatCard('todayExamsCount', stats.todayExaminations);
            this.updateStatCard('totalFilesCount', stats.totalFiles);
            
            // Calculate pending reviews (mock data for now)
            const pendingReviews = this.calculatePendingReviews();
            this.updateStatCard('pendingReviewsCount', pendingReviews);
            
            Utils.logEvent('Dashboard stats updated', stats);
            
        } catch (error) {
            console.error('Error updating dashboard stats:', error);
            Utils.showNotification('Failed to update dashboard statistics', 'error');
        }
    },
    
    /**
     * Update a single stat card with animation
     * @param {string} elementId - Element ID to update
     * @param {number} newValue - New value to display
     */
    updateStatCard(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const currentValue = parseInt(element.textContent) || 0;
        
        if (currentValue !== newValue) {
            this.animateNumber(element, currentValue, newValue);
        }
    },
    
    /**
     * Animate number change in stat card
     * @param {HTMLElement} element - Element to animate
     * @param {number} startValue - Starting value
     * @param {number} endValue - Ending value
     */
    animateNumber(element, startValue, endValue) {
        const duration = 1000; // 1 second
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easing function for smooth animation
            const easedProgress = this.easeOutQuart(progress);
            const currentValue = Math.round(startValue + (endValue - startValue) * easedProgress);
            
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = endValue; // Ensure final value is exact
            }
        };
        
        // Only animate if reduced motion is not preferred
        if (!Utils.prefersReducedMotion()) {
            requestAnimationFrame(animate);
        } else {
            element.textContent = endValue;
        }
    },
    
    /**
     * Easing function for smooth animations
     * @param {number} t - Progress (0 to 1)
     * @returns {number} Eased value
     */
    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    },
    
    /**
     * Calculate pending reviews (mock implementation)
     * @returns {number} Number of pending reviews
     */
    calculatePendingReviews() {
        const examinations = DataManager.getExaminations();
        const files = DataManager.getFiles();
        
        // Mock logic: Count recent examinations and files that might need review
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        
        const recentExams = examinations.filter(exam => 
            new Date(exam.date) >= threeDaysAgo && 
            (!exam.reviewed || exam.status === 'pending')
        );
        
        const recentFiles = files.filter(file => 
            new Date(file.dateUploaded) >= threeDaysAgo &&
            (file.category === 'lab-results' || file.category === 'imaging')
        );
        
        return recentExams.length + recentFiles.length;
    },
    
    /**
     * Update recent activity section
     */
    updateRecentActivity() {
        const recentActivityElement = document.getElementById('recentActivity');
        if (!recentActivityElement) return;
        
        try {
            const recentActivity = DataManager.getRecentActivity(APP_CONFIG.ui.maxRecentActivity);
            
            if (recentActivity.length === 0) {
                recentActivityElement.innerHTML = '<p class="empty-state">No recent activity</p>';
                return;
            }
            
            const activityHtml = recentActivity.map(activity => 
                this.createActivityCard(activity)
            ).join('');
            
            recentActivityElement.innerHTML = activityHtml;
            
            Utils.logEvent('Recent activity updated', { 
                activityCount: recentActivity.length 
            });
            
        } catch (error) {
            console.error('Error updating recent activity:', error);
            recentActivityElement.innerHTML = '<p class="error-state">Failed to load recent activity</p>';
        }
    },
    
    /**
     * Create HTML for an activity card
     * @param {Object} activity - Activity data
     * @returns {string} Activity card HTML
     */
    createActivityCard(activity) {
        const examConfig = APP_CONFIG.examinationTypes[activity.type] || {};
        const typeIcon = examConfig.icon || '🩺';
        const typeLabel = examConfig.label || Utils.capitalize(activity.type);
        const timeAgo = this.getTimeAgo(activity.date);
        
        return `
            <div class="examination-item activity-card" data-activity-id="${activity.id}">
                <div class="activity-header">
                    <div class="activity-info">
                        <strong>${typeIcon} ${Utils.sanitizeHtml(activity.patientName)}</strong>
                        <span class="activity-type">${typeLabel}</span>
                    </div>
                    <div class="activity-time">
                        <span class="time-ago" title="${Utils.formatDate(activity.date, 'datetime')}">${timeAgo}</span>
                    </div>
                </div>
                
                ${activity.diagnosis ? `
                    <div class="activity-details">
                        <strong>Diagnosis:</strong> ${Utils.truncateText(Utils.sanitizeHtml(activity.diagnosis), 100)}
                    </div>
                ` : ''}
                
                ${activity.chiefComplaint ? `
                    <div class="activity-details">
                        <strong>Chief Complaint:</strong> ${Utils.truncateText(Utils.sanitizeHtml(activity.chiefComplaint), 80)}
                    </div>
                ` : ''}
                
                <div class="activity-footer">
                    <small>
                        ${activity.bloodPressure ? `BP: ${activity.bloodPressure}` : ''}
                        ${activity.heartRate ? ` | HR: ${activity.heartRate} BPM` : ''}
                        ${activity.temperature ? ` | Temp: ${activity.temperature}°F` : ''}
                    </small>
                </div>
            </div>
        `;
    },
    
    /**
     * Get time ago string
     * @param {string} date - Date string
     * @returns {string} Time ago string
     */
    getTimeAgo(date) {
        const now = new Date();
        const activityDate = new Date(date);
        const diffMs = now - activityDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return Utils.formatDate(date, 'short');
    },
    
    /**
     * Get dashboard overview data
     * @returns {Object} Dashboard overview
     */
    getDashboardOverview() {
        const stats = DataManager.getStatistics();
        const recentActivity = DataManager.getRecentActivity(10);
        
        // Calculate trends (mock implementation)
        const trends = this.calculateTrends();
        
        // Get top diagnoses (mock implementation)
        const topDiagnoses = this.getTopDiagnoses();
        
        return {
            statistics: stats,
            trends: trends,
            recentActivity: recentActivity,
            topDiagnoses: topDiagnoses,
            generatedAt: new Date().toISOString()
        };
    },
    
    /**
     * Calculate trends for dashboard
     * @returns {Object} Trend data
     */
    calculateTrends() {
        const examinations = DataManager.getExaminations();
        const patients = DataManager.getPatients();
        
        // Calculate weekly trends
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        const thisWeekExams = examinations.filter(exam => 
            new Date(exam.date) >= oneWeekAgo
        ).length;
        
        const lastWeekExams = examinations.filter(exam => {
            const examDate = new Date(exam.date);
            return examDate >= twoWeeksAgo && examDate < oneWeekAgo;
        }).length;
        
        const examTrend = lastWeekExams === 0 ? 0 : 
            ((thisWeekExams - lastWeekExams) / lastWeekExams) * 100;
        
        // Calculate new patients trend
        const thisWeekPatients = patients.filter(patient => 
            patient.dateAdded && new Date(patient.dateAdded) >= oneWeekAgo
        ).length;
        
        const lastWeekPatients = patients.filter(patient => {
            if (!patient.dateAdded) return false;
            const addedDate = new Date(patient.dateAdded);
            return addedDate >= twoWeeksAgo && addedDate < oneWeekAgo;
        }).length;
        
        const patientTrend = lastWeekPatients === 0 ? 0 : 
            ((thisWeekPatients - lastWeekPatients) / lastWeekPatients) * 100;
        
        return {
            examinations: {
                thisWeek: thisWeekExams,
                lastWeek: lastWeekExams,
                trend: examTrend
            },
            newPatients: {
                thisWeek: thisWeekPatients,
                lastWeek: lastWeekPatients,
                trend: patientTrend
            }
        };
    },
    
    /**
     * Get top diagnoses
     * @returns {Array} Top diagnoses
     */
    getTopDiagnoses() {
        const examinations = DataManager.getExaminations();
        const diagnosisCount = {};
        
        examinations.forEach(exam => {
            if (exam.diagnosis && exam.diagnosis.trim()) {
                const diagnosis = exam.diagnosis.trim().toLowerCase();
                diagnosisCount[diagnosis] = (diagnosisCount[diagnosis] || 0) + 1;
            }
        });
        
        return Object.entries(diagnosisCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([diagnosis, count]) => ({
                diagnosis: Utils.capitalize(diagnosis),
                count: count,
                percentage: examinations.length > 0 ? 
                    Math.round((count / examinations.length) * 100) : 0
            }));
    },
    
    /**
     * Start auto-update interval
     */
    startAutoUpdate() {
        // Update time every minute
        this.updateInterval = setInterval(() => {
            this.updateCurrentDate();
        }, 60000); // 1 minute
        
        Utils.logEvent('Dashboard auto-update started');
    },
    
    /**
     * Stop auto-update interval
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            Utils.logEvent('Dashboard auto-update stopped');
        }
    },
    
    /**
     * Refresh all dashboard data
     */
    refreshDashboard() {
        this.updateCurrentDate();
        this.updateStats();
        this.updateRecentActivity();
        
        Utils.showNotification('Dashboard refreshed', 'success', 2000);
        Utils.logEvent('Dashboard manually refreshed');
    },
    
    /**
     * Export dashboard data
     * @param {string} format - Export format (json, pdf)
     */
    exportDashboard(format = 'json') {
        const overview = this.getDashboardOverview();
        
        if (format === 'json') {
            const dataStr = JSON.stringify(overview, null, 2);
            const filename = `dashboard_${new Date().toISOString().split('T')[0]}.json`;
            this.downloadFile(dataStr, filename, 'application/json');
        } else if (format === 'csv') {
            const csvData = this.convertOverviewToCSV(overview);
            const filename = `dashboard_${new Date().toISOString().split('T')[0]}.csv`;
            this.downloadFile(csvData, filename, 'text/csv');
        }
        
        Utils.logEvent('Dashboard exported', { format });
        Utils.showNotification(`Dashboard data exported as ${format.toUpperCase()}`, 'success');
    },
    
    /**
     * Convert overview to CSV format
     * @param {Object} overview - Dashboard overview data
     * @returns {string} CSV data
     */
    convertOverviewToCSV(overview) {
        const sections = [];
        
        // Statistics section
        sections.push('Dashboard Statistics');
        sections.push('Metric,Value');
        sections.push(`Total Patients,${overview.statistics.totalPatients}`);
        sections.push(`Today's Examinations,${overview.statistics.todayExaminations}`);
        sections.push(`Total Files,${overview.statistics.totalFiles}`);
        sections.push(`Active Patients,${overview.statistics.activePatients}`);
        sections.push('');
        
        // Top Diagnoses section
        if (overview.topDiagnoses.length > 0) {
            sections.push('Top Diagnoses');
            sections.push('Diagnosis,Count,Percentage');
            overview.topDiagnoses.forEach(item => {
                sections.push(`"${item.diagnosis}",${item.count},${item.percentage}%`);
            });
            sections.push('');
        }
        
        // Recent Activity section
        if (overview.recentActivity.length > 0) {
            sections.push('Recent Activity');
            sections.push('Patient,Type,Date,Diagnosis');
            overview.recentActivity.forEach(activity => {
                const date = Utils.formatDate(activity.date, 'datetime');
                const diagnosis = (activity.diagnosis || '').replace(/"/g, '""');
                sections.push(`"${activity.patientName}","${activity.type}","${date}","${diagnosis}"`);
            });
        }
        
        return sections.join('\n');
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
    },
    
    /**
     * Get quick actions for dashboard
     * @returns {Array} Quick actions
     */
    getQuickActions() {
        return [
            {
                id: 'add-patient',
                title: 'Add New Patient',
                description: 'Register a new patient',
                icon: '👤',
                action: () => {
                    window.switchTab('patients');
                    setTimeout(() => window.openPatientModal(), 100);
                }
            },
            {
                id: 'add-examination',
                title: 'New Examination',
                description: 'Record patient examination',
                icon: '🩺',
                action: () => {
                    if (PatientManager.getSelectedPatient()) {
                        window.switchTab('examinations');
                    } else {
                        Utils.showNotification('Please select a patient first', 'warning');
                        window.switchTab('patients');
                    }
                }
            },
            {
                id: 'upload-files',
                title: 'Upload Files',
                description: 'Upload medical documents',
                icon: '📁',
                action: () => {
                    if (PatientManager.getSelectedPatient()) {
                        window.switchTab('files');
                    } else {
                        Utils.showNotification('Please select a patient first', 'warning');
                        window.switchTab('patients');
                    }
                }
            },
            {
                id: 'export-data',
                title: 'Export Data',
                description: 'Export patient data',
                icon: '📊',
                action: () => {
                    this.showExportOptions();
                }
            }
        ];
    },
    
    /**
     * Show export options modal (simplified version)
     */
    showExportOptions() {
        const options = [
            'Export Dashboard (JSON)',
            'Export Dashboard (CSV)',
            'Export All Patients (JSON)',
            'Export All Patients (CSV)',
            'Export All Examinations (JSON)',
            'Export All Examinations (CSV)'
        ];
        
        // Simple implementation using browser prompt
        // In a real app, this would be a proper modal
        const choice = prompt(`Choose export option:\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nEnter number (1-${options.length}):`);
        
        if (choice && !isNaN(choice)) {
            const index = parseInt(choice) - 1;
            if (index >= 0 && index < options.length) {
                switch (index) {
                    case 0: this.exportDashboard('json'); break;
                    case 1: this.exportDashboard('csv'); break;
                    case 2: PatientManager.exportPatients('json'); break;
                    case 3: PatientManager.exportPatients('csv'); break;
                    case 4: ExaminationManager.exportExaminations(null, 'json'); break;
                    case 5: ExaminationManager.exportExaminations(null, 'csv'); break;
                }
            }
        }
    },
    
    /**
     * Check for alerts and notifications
     * @returns {Array} Array of alerts
     */
    checkAlerts() {
        const alerts = [];
        
        // Check for patients without recent visits
        const patients = DataManager.getPatients();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const patientsWithoutRecentVisits = patients.filter(patient => {
            if (!patient.lastVisit) return true;
            return new Date(patient.lastVisit) < sixMonthsAgo;
        });
        
        if (patientsWithoutRecentVisits.length > 0) {
            alerts.push({
                type: 'warning',
                title: 'Patients Need Follow-up',
                message: `${patientsWithoutRecentVisits.length} patients haven't visited in 6+ months`,
                action: () => {
                    // Could open a filtered patient list
                    window.switchTab('patients');
                }
            });
        }
        
        // Check for missing vital signs in recent examinations
        const recentExams = DataManager.getExaminations().filter(exam => {
            const examDate = new Date(exam.date);
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return examDate >= oneWeekAgo;
        });
        
        const examsWithoutVitals = recentExams.filter(exam => 
            !exam.bloodPressure && !exam.heartRate && !exam.temperature
        );
        
        if (examsWithoutVitals.length > 0) {
            alerts.push({
                type: 'info',
                title: 'Missing Vital Signs',
                message: `${examsWithoutVitals.length} recent examinations are missing vital signs`,
                action: () => {
                    window.switchTab('examinations');
                }
            });
        }
        
        return alerts;
    },
    
    /**
     * Display alerts in the dashboard
     */
    displayAlerts() {
        const alerts = this.checkAlerts();
        
        if (alerts.length === 0) return;
        
        // Create alerts container if it doesn't exist
        let alertsContainer = document.getElementById('dashboardAlerts');
        if (!alertsContainer) {
            alertsContainer = document.createElement('div');
            alertsContainer.id = 'dashboardAlerts';
            alertsContainer.className = 'dashboard-alerts';
            
            const dashboard = document.getElementById('dashboard');
            if (dashboard) {
                const statsGrid = dashboard.querySelector('.stats-grid');
                if (statsGrid) {
                    statsGrid.parentNode.insertBefore(alertsContainer, statsGrid.nextSibling);
                }
            }
        }
        
        // Generate alerts HTML
        const alertsHtml = alerts.map(alert => `
            <div class="alert alert-${alert.type}" onclick="${alert.action ? 'this.click()' : ''}">
                <div class="alert-content">
                    <strong>${Utils.sanitizeHtml(alert.title)}</strong>
                    <p>${Utils.sanitizeHtml(alert.message)}</p>
                </div>
                <button class="alert-close" onclick="this.parentElement.remove(); event.stopPropagation();">&times;</button>
            </div>
        `).join('');
        
        alertsContainer.innerHTML = alertsHtml;
        
        // Add click handlers for alerts with actions
        alerts.forEach((alert, index) => {
            if (alert.action) {
                const alertElement = alertsContainer.children[index];
                alertElement.addEventListener('click', alert.action);
                alertElement.style.cursor = 'pointer';
            }
        });
    },
    
    /**
     * Initialize dashboard performance monitoring
     */
    initPerformanceMonitoring() {
        // Mark dashboard initialization complete
        Utils.markPerformance('dashboard-init-complete');
        
        // Monitor dashboard load time
        if (window.performance && window.performance.timing) {
            const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
            Utils.logEvent('Dashboard load time', { loadTimeMs: loadTime });
        }
    },
    
    /**
     * Cleanup dashboard resources
     */
    cleanup() {
        this.stopAutoUpdate();
        Utils.logEvent('DashboardManager cleanup completed');
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    DashboardManager.init();
    
    // Show alerts after a brief delay
    setTimeout(() => {
        DashboardManager.displayAlerts();
    }, 1000);
    
    // Initialize performance monitoring
    DashboardManager.initPerformanceMonitoring();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    DashboardManager.cleanup();
});

// Make DashboardManager available globally
window.DashboardManager = DashboardManager;