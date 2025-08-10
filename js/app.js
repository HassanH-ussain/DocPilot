/**
 * Physician Dashboard - Main Application Controller
 * Coordinates all modules and handles global application logic
 */

const App = {
    
    // Application state
    isInitialized: false,
    currentTab: 'dashboard',
    version: '1.0.0',
    
    // Module references
    modules: {
        DataManager: null,
        PatientManager: null,
        ExaminationManager: null,
        FileManager: null,
        DashboardManager: null,
        Utils: null
    },
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            Utils.logEvent('Application initialization started');
            Utils.markPerformance('app-init-start');
            
            // Check browser compatibility
            if (!this.checkBrowserCompatibility()) {
                this.showBrowserWarning();
                return;
            }
            
            // Initialize error handling
            this.initErrorHandling();
            
            // Wait for all modules to be available
            await this.waitForModules();
            
            // Initialize modules in order
            await this.initializeModules();
            
            // Set up global event listeners
            this.bindGlobalEvents();
            
            // Initialize tab system
            this.initTabSystem();
            
            // Check for saved state
            this.restoreApplicationState();
            
            // Show welcome message for first time users
            this.checkFirstTimeUser();
            
            // Mark as initialized
            this.isInitialized = true;
            
            Utils.markPerformance('app-init-complete');
            Utils.logEvent('Application initialization completed');
            
            // Show success notification
            setTimeout(() => {
                Utils.showNotification('Physician Dashboard loaded successfully', 'success', 3000);
            }, 500);
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.handleInitializationError(error);
        }
    },
    
    /**
     * Check browser compatibility
     * @returns {boolean} Is browser compatible
     */
    checkBrowserCompatibility() {
        const features = {
            localStorage: typeof(Storage) !== 'undefined',
            es6: typeof Symbol !== 'undefined',
            fetch: typeof fetch !== 'undefined',
            promises: typeof Promise !== 'undefined',
            modules: typeof Map !== 'undefined'
        };
        
        const unsupportedFeatures = Object.keys(features).filter(key => !features[key]);
        
        if (unsupportedFeatures.length > 0) {
            console.warn('Unsupported browser features:', unsupportedFeatures);
            return false;
        }
        
        return true;
    },
    
    /**
     * Show browser compatibility warning
     */
    showBrowserWarning() {
        const warningHtml = `
            <div class="browser-warning" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background: rgba(0,0,0,0.8); color: white; z-index: 10000;
                display: flex; align-items: center; justify-content: center;
                font-family: Arial, sans-serif; text-align: center; padding: 20px;
            ">
                <div style="background: #2c3e50; padding: 30px; border-radius: 10px; max-width: 500px;">
                    <h2>Browser Not Supported</h2>
                    <p>This application requires a modern browser with support for ES6, localStorage, and Fetch API.</p>
                    <p>Please update your browser or use a different one:</p>
                    <ul style="text-align: left; margin: 20px 0;">
                        <li>Chrome 60+</li>
                        <li>Firefox 55+</li>
                        <li>Safari 11+</li>
                        <li>Edge 79+</li>
                    </ul>
                    <button onclick="location.reload()" style="
                        background: #3498db; color: white; border: none; 
                        padding: 10px 20px; border-radius: 5px; cursor: pointer;
                    ">Reload Page</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', warningHtml);
    },
    
    /**
     * Initialize global error handling
     */
    initErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            Utils.logEvent('Global error occurred', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            Utils.logEvent('Unhandled promise rejection', {
                reason: event.reason?.toString(),
                stack: event.reason?.stack
            });
        });
    },
    
    /**
     * Wait for all required modules to be available
     * @returns {Promise} Resolution when modules are ready
     */
    waitForModules() {
        return new Promise((resolve, reject) => {
            const maxWaitTime = 10000; // 10 seconds
            const checkInterval = 100; // 100ms
            let elapsed = 0;
            
            const checkModules = () => {
                const requiredModules = [
                    'DataManager', 'PatientManager', 'ExaminationManager', 
                    'FileManager', 'DashboardManager', 'Utils'
                ];
                
                const availableModules = requiredModules.filter(name => window[name]);
                
                if (availableModules.length === requiredModules.length) {
                    // All modules are available
                    requiredModules.forEach(name => {
                        this.modules[name] = window[name];
                    });
                    resolve();
                } else if (elapsed >= maxWaitTime) {
                    // Timeout
                    const missingModules = requiredModules.filter(name => !window[name]);
                    reject(new Error(`Modules not loaded within timeout: ${missingModules.join(', ')}`));
                } else {
                    // Continue waiting
                    elapsed += checkInterval;
                    setTimeout(checkModules, checkInterval);
                }
            };
            
            checkModules();
        });
    },
    
    /**
     * Initialize all modules
     */
    async initializeModules() {
        // Modules are already initialized by their respective files
        // This is where we could add cross-module dependencies or additional setup
        
        Utils.logEvent('All modules initialized');
    },
    
    /**
     * Bind global event listeners
     */
    bindGlobalEvents() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Tab visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                Utils.logEvent('Application hidden');
            } else {
                Utils.logEvent('Application visible');
                // Refresh data when returning to tab
                if (this.currentTab === 'dashboard') {
                    DashboardManager.updateStats();
                }
            }
        });
        
        // Window resize
        window.addEventListener('resize', Utils.debounce(() => {
            Utils.logEvent('Window resized', {
                width: window.innerWidth,
                height: window.innerHeight
            });
        }, 250));
        
        // Online/offline status
        window.addEventListener('online', () => {
            Utils.showNotification('Connection restored', 'success');
            Utils.logEvent('Application online');
        });
        
        window.addEventListener('offline', () => {
            Utils.showNotification('Connection lost - working offline', 'warning');
            Utils.logEvent('Application offline');
        });
        
        Utils.logEvent('Global events bound');
    },
    
    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyboardShortcuts(event) {
        // Ignore shortcuts when typing in inputs
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Ctrl/Cmd + key shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key.toLowerCase()) {
                case '1':
                    event.preventDefault();
                    this.switchTab('dashboard');
                    break;
                case '2':
                    event.preventDefault();
                    this.switchTab('patients');
                    break;
                case '3':
                    event.preventDefault();
                    this.switchTab('examinations');
                    break;
                case '4':
                    event.preventDefault();
                    this.switchTab('files');
                    break;
                case 'n':
                    event.preventDefault();
                    if (this.currentTab === 'patients') {
                        PatientManager.openPatientModal();
                    }
                    break;
                case 'f':
                    event.preventDefault();
                    const searchBar = document.querySelector('.search-bar');
                    if (searchBar) {
                        searchBar.focus();
                    }
                    break;
                case 'r':
                    event.preventDefault();
                    if (this.currentTab === 'dashboard') {
                        DashboardManager.refreshDashboard();
                    }
                    break;
            }
        }
        
        // Escape key
        if (event.key === 'Escape') {
            // Close any open modals
            const modal = document.querySelector('.modal[style*="block"]');
            if (modal) {
                PatientManager.closePatientModal();
            }
        }
    },
    
    /**
     * Initialize tab system
     */
    initTabSystem() {
        // Ensure dashboard tab is active on load
        this.switchTab('dashboard');
    },
    
    /**
     * Switch between tabs
     * @param {string} tabName - Tab name to switch to
     */
    switchTab(tabName) {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Remove active class from all buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        // Show selected tab and activate button
        const selectedTab = document.getElementById(tabName);
        const selectedButton = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
        
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
        
        // Update current tab
        this.currentTab = tabName;
        
        // Handle tab-specific updates
        this.handleTabSwitch(tabName);
        
        // Save current tab to localStorage
        this.saveApplicationState();
        
        Utils.logEvent('Tab switched', { tabName });
    },
    
    /**
     * Handle tab switch events
     * @param {string} tabName - Tab name that was switched to
     */
    handleTabSwitch(tabName) {
        switch (tabName) {
            case 'dashboard':
                DashboardManager.updateStats();
                DashboardManager.updateRecentActivity();
                break;
                
            case 'examinations':
                if (ExaminationManager && PatientManager.selectedPatientId) {
                    ExaminationManager.updateForSelectedPatient(PatientManager.selectedPatientId);
                }
                break;
                
            case 'files':
                if (FileManager && PatientManager.selectedPatientId) {
                    FileManager.updateForSelectedPatient(PatientManager.selectedPatientId);
                }
                break;
        }
    },
    
    /**
     * Save application state to localStorage
     */
    saveApplicationState() {
        try {
            const state = {
                currentTab: this.currentTab,
                selectedPatientId: PatientManager.selectedPatientId,
                timestamp: new Date().toISOString(),
                version: this.version
            };
            
            localStorage.setItem('physicianDashboardState', JSON.stringify(state));
        } catch (error) {
            console.warn('Failed to save application state:', error);
        }
    },
    
    /**
     * Restore application state from localStorage
     */
    restoreApplicationState() {
        try {
            const savedState = localStorage.getItem('physicianDashboardState');
            if (savedState) {
                const state = JSON.parse(savedState);
                
                // Check if state is from the same version
                if (state.version === this.version) {
                    // Restore tab
                    if (state.currentTab && state.currentTab !== 'dashboard') {
                        setTimeout(() => {
                            this.switchTab(state.currentTab);
                        }, 100);
                    }
                    
                    // Restore selected patient
                    if (state.selectedPatientId) {
                        setTimeout(() => {
                            PatientManager.selectPatient(state.selectedPatientId);
                        }, 200);
                    }
                    
                    Utils.logEvent('Application state restored', state);
                }
            }
        } catch (error) {
            console.warn('Failed to restore application state:', error);
        }
    },
    
    /**
     * Check if this is a first-time user
     */
    checkFirstTimeUser() {
        try {
            const isFirstTime = !localStorage.getItem('physicianDashboardFirstVisit');
            
            if (isFirstTime) {
                localStorage.setItem('physicianDashboardFirstVisit', new Date().toISOString());
                
                // Show welcome message
                setTimeout(() => {
                    this.showWelcomeMessage();
                }, 1000);
                
                Utils.logEvent('First time user detected');
            }
        } catch (error) {
            console.warn('Failed to check first-time user:', error);
        }
    },
    
    /**
     * Show welcome message for new users
     */
    showWelcomeMessage() {
        const message = `Welcome to the Physician Dashboard!\n\nQuick tips:\n• Use Ctrl+1-4 to switch between tabs\n• Ctrl+N to add a new patient\n• Ctrl+F to focus search\n• Select a patient to add examinations and files`;
        
        Utils.showNotification(message, 'info', 8000);
    },
    
    /**
     * Handle initialization errors
     * @param {Error} error - Initialization error
     */
    handleInitializationError(error) {
        console.error('Application initialization failed:', error);
        
        // Show error message to user
        const errorHtml = `
            <div class="init-error" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background: rgba(231, 76, 60, 0.9); color: white; z-index: 10000;
                display: flex; align-items: center; justify-content: center;
                font-family: Arial, sans-serif; text-align: center; padding: 20px;
            ">
                <div style="background: #c0392b; padding: 30px; border-radius: 10px; max-width: 500px;">
                    <h2>Application Failed to Load</h2>
                    <p>The Physician Dashboard encountered an error during initialization.</p>
                    <p style="font-family: monospace; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 5px; margin: 15px 0;">
                        ${Utils.sanitizeHtml(error.message)}
                    </p>
                    <button onclick="location.reload()" style="
                        background: #2c3e50; color: white; border: none; 
                        padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;
                    ">Reload Application</button>
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        background: transparent; color: white; border: 1px solid white; 
                        padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;
                    ">Dismiss</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', errorHtml);
    },
    
    /**
     * Get application info
     * @returns {Object} Application information
     */
    getAppInfo() {
        return {
            name: APP_CONFIG.name,
            version: this.version,
            isInitialized: this.isInitialized,
            currentTab: this.currentTab,
            browser: Utils.getBrowserInfo(),
            device: Utils.getDeviceInfo(),
            performance: window.performance ? {
                timing: window.performance.timing,
                memory: window.performance.memory
            } : null
        };
    },
    
    /**
     * Cleanup application resources
     */
    cleanup() {
        // Save current state
        this.saveApplicationState();
        
        // Cleanup modules
        if (DashboardManager) {
            DashboardManager.cleanup();
        }
        
        Utils.logEvent('Application cleanup completed');
    }
};

// Global functions for HTML onclick handlers
window.switchTab = (tabName) => App.switchTab(tabName);

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    App.cleanup();
});

// Make App available globally for debugging
window.App = App;

// Export version and build info
window.PHYSICIAN_DASHBOARD_VERSION = App.version;