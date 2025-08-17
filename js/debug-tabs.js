/**
 * Physician Dashboard - Tab Switching Debug and Fix
 * Separate JavaScript file for debugging tab functionality
 */

const TabDebugger = {
    
    /**
     * Debug function to check tab switching functionality
     */
    debugTabSwitching() {
        console.log('=== Tab Switching Debug ===');
        
        // Check if App object exists
        console.log('App object exists:', typeof window.App !== 'undefined');
        
        // Check if switchTab function exists globally
        console.log('Global switchTab function exists:', typeof window.switchTab === 'function');
        
        // Check if tab buttons exist
        const tabButtons = document.querySelectorAll('.tab-btn');
        console.log('Tab buttons found:', tabButtons.length);
        
        // Check if tab contents exist
        const tabContents = document.querySelectorAll('.tab-content');
        console.log('Tab contents found:', tabContents.length);
        
        // Check onclick attributes
        tabButtons.forEach((btn, index) => {
            console.log(`Tab button ${index}:`, {
                text: btn.textContent.trim(),
                onclick: btn.getAttribute('onclick'),
                hasClickEvent: !!btn.onclick
            });
        });
        
        // Test each tab
        const tabs = ['dashboard', 'patients', 'examinations', 'files'];
        tabs.forEach(tabName => {
            const element = document.getElementById(tabName);
            console.log(`Tab "${tabName}":`, {
                exists: !!element,
                isVisible: element ? element.classList.contains('active') : false,
                hasContent: element ? element.children.length > 0 : false
            });
        });
        
        // Check if modules are loaded
        console.log('Modules loaded:', {
            DataManager: typeof window.DataManager !== 'undefined',
            PatientManager: typeof window.PatientManager !== 'undefined',
            ExaminationManager: typeof window.ExaminationManager !== 'undefined',
            FileManager: typeof window.FileManager !== 'undefined',
            DashboardManager: typeof window.DashboardManager !== 'undefined',
            Utils: typeof window.Utils !== 'undefined'
        });
    },
    
    /**
     * Alternative tab switching function (fallback)
     * @param {string} tabName - Name of tab to switch to
     */
    manualSwitchTab(tabName) {
        console.log('Manual tab switch to:', tabName);
        
        try {
            // Hide all tab contents
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });
            
            // Remove active class from all buttons
            const tabButtons = document.querySelectorAll('.tab-btn');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Show selected tab
            const selectedTab = document.getElementById(tabName);
            if (selectedTab) {
                selectedTab.classList.add('active');
                selectedTab.style.display = 'block';
                selectedTab.style.animation = 'fadeIn 0.3s ease-in';
                console.log('Activated tab:', tabName);
            } else {
                console.error('Tab not found:', tabName);
                return false;
            }
            
            // Activate corresponding button
            const selectedButton = document.querySelector(`[onclick*="${tabName}"]`) || 
                                 document.querySelector(`button[data-tab="${tabName}"]`);
            if (selectedButton) {
                selectedButton.classList.add('active');
                console.log('Activated button for:', tabName);
            } else {
                console.error('Button not found for tab:', tabName);
            }
            
            // Trigger tab-specific updates
            this.handleTabSpecificUpdates(tabName);
            
            // Update App state if available
            if (window.App) {
                App.currentTab = tabName;
                App.saveApplicationState();
            }
            
            Utils.logEvent('Tab switched manually', { tabName });
            return true;
            
        } catch (error) {
            console.error('Error in manual tab switch:', error);
            return false;
        }
    },
    
    /**
     * Handle tab-specific updates
     * @param {string} tabName - Name of tab that was switched to
     */
    handleTabSpecificUpdates(tabName) {
        switch (tabName) {
            case 'dashboard':
                if (window.DashboardManager) {
                    try {
                        DashboardManager.updateStats();
                        DashboardManager.updateRecentActivity();
                        console.log('Dashboard updated');
                    } catch (error) {
                        console.error('Error updating dashboard:', error);
                    }
                } else {
                    console.warn('DashboardManager not available');
                }
                break;
                
            case 'patients':
                if (window.PatientManager) {
                    try {
                        PatientManager.renderPatients();
                        console.log('Patients rendered');
                    } catch (error) {
                        console.error('Error rendering patients:', error);
                    }
                } else {
                    console.warn('PatientManager not available');
                }
                break;
                
            case 'examinations':
                if (window.ExaminationManager && window.PatientManager) {
                    try {
                        ExaminationManager.updateForSelectedPatient(PatientManager.selectedPatientId);
                        console.log('Examinations updated');
                    } catch (error) {
                        console.error('Error updating examinations:', error);
                    }
                } else {
                    console.warn('ExaminationManager or PatientManager not available');
                }
                break;
                
            case 'files':
                if (window.FileManager && window.PatientManager) {
                    try {
                        FileManager.updateForSelectedPatient(PatientManager.selectedPatientId);
                        console.log('Files updated');
                    } catch (error) {
                        console.error('Error updating files:', error);
                    }
                } else {
                    console.warn('FileManager or PatientManager not available');
                }
                break;
        }
    },
    
    /**
     * Fix tab switching by re-binding events
     */
    fixTabSwitching() {
        console.log('Attempting to fix tab switching...');
        
        // Remove existing onclick handlers and add new ones
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach((button) => {
            // Get the tab name from the onclick attribute or button text
            const onclickAttr = button.getAttribute('onclick');
            let tabName = '';
            
            if (onclickAttr && onclickAttr.includes('switchTab')) {
                // Extract tab name from onclick attribute
                const match = onclickAttr.match(/switchTab\('([^']+)'\)/);
                if (match) {
                    tabName = match[1];
                }
            } else {
                // Fallback: derive from button text
                const buttonText = button.textContent.trim().toLowerCase();
                if (buttonText.includes('dashboard')) tabName = 'dashboard';
                else if (buttonText.includes('patient')) tabName = 'patients';
                else if (buttonText.includes('examination')) tabName = 'examinations';
                else if (buttonText.includes('file')) tabName = 'files';
            }
            
            if (tabName) {
                // Store tab name as data attribute
                button.setAttribute('data-tab', tabName);
                
                // Remove old onclick
                button.removeAttribute('onclick');
                button.onclick = null;
                
                // Add new click event
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Tab button clicked:', tabName);
                    
                    // Try different methods in order of preference
                    if (window.App && typeof App.switchTab === 'function') {
                        App.switchTab(tabName);
                    } else if (typeof window.switchTab === 'function') {
                        window.switchTab(tabName);
                    } else {
                        this.manualSwitchTab(tabName);
                    }
                });
                
                console.log(`Fixed tab button for: ${tabName}`);
            }
        });
        
        // Ensure global switchTab function exists
        if (typeof window.switchTab !== 'function') {
            window.switchTab = (tabName) => {
                console.log('Global switchTab called:', tabName);
                if (window.App && typeof App.switchTab === 'function') {
                    App.switchTab(tabName);
                } else {
                    this.manualSwitchTab(tabName);
                }
            };
            console.log('Created global switchTab function');
        }
        
        // Make sure the dashboard tab is active initially
        setTimeout(() => {
            const dashboardTab = document.getElementById('dashboard');
            
            if (dashboardTab && !dashboardTab.classList.contains('active')) {
                console.log('Activating dashboard tab by default');
                this.manualSwitchTab('dashboard');
            }
        }, 100);
        
        console.log('Tab switching fix complete');
    },
    
    /**
     * Check if tab switching is working properly
     * @returns {boolean} True if working, false if needs fixing
     */
    isTabSwitchingWorking() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        let hasWorkingHandlers = false;
        
        tabButtons.forEach(button => {
            if (button.onclick || button.getAttribute('onclick') || button.hasAttribute('data-tab')) {
                hasWorkingHandlers = true;
            }
        });
        
        return hasWorkingHandlers && (typeof window.switchTab === 'function' || 
                                    (window.App && typeof App.switchTab === 'function'));
    },
    
    /**
     * Comprehensive tab system check and fix
     */
    checkAndFixTabs() {
        console.log('🔍 Comprehensive tab system check...');
        
        this.debugTabSwitching();
        
        if (!this.isTabSwitchingWorking()) {
            console.log('❌ Tab switching needs fixing...');
            this.fixTabSwitching();
            
            // Verify fix worked
            setTimeout(() => {
                if (this.isTabSwitchingWorking()) {
                    console.log('✅ Tab switching fixed successfully!');
                    Utils.showNotification('Tab switching has been fixed', 'success', 3000);
                } else {
                    console.log('❌ Tab switching fix failed');
                    Utils.showNotification('Tab switching fix failed. Please refresh the page.', 'error', 5000);
                }
            }, 200);
        } else {
            console.log('✅ Tab switching is working correctly');
        }
    },
    
    /**
     * Initialize tab debugger
     */
    init() {
        console.log('Tab Debugger initialized');
        Utils.logEvent('TabDebugger initialized');
    }
};

// Auto-fix when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking tab functionality...');
    
    // Initialize tab debugger
    TabDebugger.init();
    
    // Wait a bit for other scripts to load
    setTimeout(() => {
        TabDebugger.checkAndFixTabs();
    }, 500);
});

// Export functions to global scope for console debugging
window.debugTabSwitching = () => TabDebugger.debugTabSwitching();
window.manualSwitchTab = (tabName) => TabDebugger.manualSwitchTab(tabName);
window.fixTabs = () => TabDebugger.checkAndFixTabs();
window.TabDebugger = TabDebugger;

console.log('🔧 Tab debugging script loaded. Available commands:');
console.log('  - debugTabSwitching() - Check tab system status');
console.log('  - fixTabs() - Fix tab switching issues'); 
console.log('  - manualSwitchTab("tabname") - Manually switch to a tab');

// Make TabDebugger available globally
window.TabDebugger = TabDebugger;