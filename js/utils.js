/**
 * Physician Dashboard - Utility Functions
 * Common utility functions used throughout the application
 */

const Utils = {
    
    /**
     * Format date for display
     * @param {string|Date} date - Date to format
     * @param {string} format - Format type (short, long, time, datetime)
     * @returns {string} Formatted date string
     */
    formatDate(date, format = 'short') {
        if (!date) return 'N/A';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return 'Invalid Date';
        
        const options = {
            short: { month: '2-digit', day: '2-digit', year: 'numeric' },
            long: { month: 'long', day: 'numeric', year: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit', hour12: true },
            datetime: { 
                month: '2-digit', 
                day: '2-digit', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            }
        };
        
        return dateObj.toLocaleDateString('en-US', options[format] || options.short);
    },
    
    /**
     * Calculate age from date of birth
     * @param {string} dateOfBirth - Date of birth
     * @returns {number} Age in years
     */
    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return null;
        
        const birth = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    },
    
    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    },
    
    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    /**
     * Validate phone number
     * @param {string} phone - Phone number to validate
     * @returns {boolean} Is valid phone number
     */
    isValidPhone(phone) {
        const phoneRegex = /^[\(\)\s\-\+\d]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    },
    
    /**
     * Format phone number for display
     * @param {string} phone - Phone number to format
     * @returns {string} Formatted phone number
     */
    formatPhoneNumber(phone) {
        if (!phone) return '';
        
        // Remove all non-digits
        const digits = phone.replace(/\D/g, '');
        
        // Format as (XXX) XXX-XXXX
        if (digits.length === 10) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
        
        return phone; // Return original if not 10 digits
    },
    
    /**
     * Sanitize HTML to prevent XSS
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    sanitizeHtml(str) {
        if (!str) return '';
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    
    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },
    
    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * Generate a random ID
     * @param {string} prefix - Optional prefix for ID
     * @returns {string} Random ID
     */
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    /**
     * Deep clone an object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
        return obj;
    },
    
    /**
     * Check if a value is empty
     * @param {*} value - Value to check
     * @returns {boolean} Is empty
     */
    isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    },
    
    /**
     * Capitalize first letter of each word
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    capitalize(str) {
        if (!str) return '';
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    },
    
    /**
     * Truncate text with ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    },
    
    /**
     * Show notification message
     * @param {string} message - Message to show
     * @param {string} type - Type of notification (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${this.sanitizeHtml(message)}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '400px',
            zIndex: '10000',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            animation: 'slideInRight 0.3s ease-out'
        });
        
        // Set background color based on type
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // Style close button
        const closeBtn = notification.querySelector('.notification-close');
        Object.assign(closeBtn.style, {
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0',
            marginLeft: '10px'
        });
        
        // Add animation keyframes if not already added
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.style.animation = 'slideOutRight 0.3s ease-in';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    },
    
    /**
     * Show confirmation dialog
     * @param {string} message - Confirmation message
     * @param {string} title - Dialog title
     * @returns {Promise<boolean>} User confirmation
     */
    showConfirm(message, title = 'Confirm') {
        return new Promise((resolve) => {
            // For now, use browser confirm - can be enhanced with custom modal
            const result = confirm(`${title}\n\n${message}`);
            resolve(result);
        });
    },
    
    /**
     * Format currency
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code
     * @returns {string} Formatted currency
     */
    formatCurrency(amount, currency = 'USD') {
        if (isNaN(amount)) return '$0.00';
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },
    
    /**
     * Validate form data
     * @param {Object} data - Form data to validate
     * @param {Object} rules - Validation rules
     * @returns {Object} Validation result
     */
    validateForm(data, rules) {
        const errors = {};
        let isValid = true;
        
        Object.keys(rules).forEach(field => {
            const value = data[field];
            const rule = rules[field];
            
            // Check required
            if (rule.required && this.isEmpty(value)) {
                errors[field] = APP_CONFIG.errorMessages.validation.required;
                isValid = false;
                return;
            }
            
            // Skip further validation if field is empty and not required
            if (this.isEmpty(value) && !rule.required) {
                return;
            }
            
            // Check minimum length
            if (rule.minLength && value.length < rule.minLength) {
                errors[field] = APP_CONFIG.errorMessages.validation.minLength
                    .replace('{min}', rule.minLength);
                isValid = false;
                return;
            }
            
            // Check maximum length
            if (rule.maxLength && value.length > rule.maxLength) {
                errors[field] = APP_CONFIG.errorMessages.validation.maxLength
                    .replace('{max}', rule.maxLength);
                isValid = false;
                return;
            }
            
            // Check pattern
            if (rule.pattern && !rule.pattern.test(value)) {
                if (field === 'email') {
                    errors[field] = APP_CONFIG.errorMessages.validation.email;
                } else if (field === 'phoneNumber') {
                    errors[field] = APP_CONFIG.errorMessages.validation.phone;
                } else {
                    errors[field] = 'Invalid format';
                }
                isValid = false;
                return;
            }
            
            // Check numeric range
            if (rule.min !== undefined || rule.max !== undefined) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    if (rule.min !== undefined && numValue < rule.min) {
                        errors[field] = APP_CONFIG.errorMessages.validation.invalidRange
                            .replace('{min}', rule.min).replace('{max}', rule.max || '∞');
                        isValid = false;
                        return;
                    }
                    if (rule.max !== undefined && numValue > rule.max) {
                        errors[field] = APP_CONFIG.errorMessages.validation.invalidRange
                            .replace('{min}', rule.min || 0).replace('{max}', rule.max);
                        isValid = false;
                        return;
                    }
                }
            }
            
            // Check options
            if (rule.options && !rule.options.includes(value)) {
                errors[field] = `Must be one of: ${rule.options.join(', ')}`;
                isValid = false;
            }
        });
        
        return { isValid, errors };
    },
    
    /**
     * Scroll to element smoothly
     * @param {string|Element} element - Element or selector to scroll to
     * @param {number} offset - Offset from top
     */
    scrollToElement(element, offset = 0) {
        const targetElement = typeof element === 'string' 
            ? document.querySelector(element) 
            : element;
            
        if (targetElement) {
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    },
    
    /**
     * Check if element is in viewport
     * @param {Element} element - Element to check
     * @returns {boolean} Is in viewport
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },
    
    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const success = document.execCommand('copy');
                textArea.remove();
                return success;
            }
        } catch (error) {
            console.error('Failed to copy text to clipboard:', error);
            return false;
        }
    },
    
    /**
     * Format medical record number
     * @param {string|number} mrn - Medical record number
     * @returns {string} Formatted MRN
     */
    formatMRN(mrn) {
        if (!mrn) return '';
        
        const mrnString = mrn.toString().padStart(8, '0');
        return `MRN-${mrnString}`;
    },
    
    /**
     * Parse and format vital signs
     * @param {Object} vitals - Vital signs object
     * @returns {Object} Formatted vitals
     */
    formatVitalSigns(vitals) {
        const formatted = {};
        
        if (vitals.temperature) {
            formatted.temperature = `${vitals.temperature}°F`;
        }
        
        if (vitals.heartRate) {
            formatted.heartRate = `${vitals.heartRate} BPM`;
        }
        
        if (vitals.bloodPressure) {
            formatted.bloodPressure = vitals.bloodPressure;
        }
        
        if (vitals.weight) {
            formatted.weight = `${vitals.weight} lbs`;
        }
        
        if (vitals.height) {
            formatted.height = vitals.height;
        }
        
        return formatted;
    },
    
    /**
     * Get file icon based on file type
     * @param {string} fileType - MIME type or file extension
     * @returns {string} Icon emoji or symbol
     */
    getFileIcon(fileType) {
        const icons = {
            'application/pdf': '📄',
            'image/jpeg': '🖼️',
            'image/png': '🖼️',
            'image/gif': '🖼️',
            'image/webp': '🖼️',
            'application/msword': '📝',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
            'text/plain': '📄',
            'application/vnd.ms-excel': '📊',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
            'default': '📎'
        };
        
        return icons[fileType] || icons.default;
    },
    
    /**
     * Check if user prefers reduced motion
     * @returns {boolean} Prefers reduced motion
     */
    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },
    
    /**
     * Get browser information
     * @returns {Object} Browser info
     */
    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        let browserName = 'Unknown';
        let browserVersion = 'Unknown';
        
        if (userAgent.indexOf('Chrome') > -1) {
            browserName = 'Chrome';
            browserVersion = userAgent.match(/Chrome\/(\d+)/)[1];
        } else if (userAgent.indexOf('Firefox') > -1) {
            browserName = 'Firefox';
            browserVersion = userAgent.match(/Firefox\/(\d+)/)[1];
        } else if (userAgent.indexOf('Safari') > -1) {
            browserName = 'Safari';
            browserVersion = userAgent.match(/Version\/(\d+)/)[1];
        } else if (userAgent.indexOf('Edge') > -1) {
            browserName = 'Edge';
            browserVersion = userAgent.match(/Edge\/(\d+)/)[1];
        }
        
        return {
            name: browserName,
            version: browserVersion,
            userAgent: userAgent,
            platform: navigator.platform,
            language: navigator.language
        };
    },
    
    /**
     * Check if device is mobile
     * @returns {boolean} Is mobile device
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    /**
     * Get device information
     * @returns {Object} Device info
     */
    getDeviceInfo() {
        return {
            isMobile: this.isMobile(),
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1,
            touchSupport: 'ontouchstart' in window,
            orientation: window.screen.orientation ? window.screen.orientation.angle : 0
        };
    },
    
    /**
     * Log application events (for debugging and analytics)
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    logEvent(event, data = {}) {
        if (APP_CONFIG.features && APP_CONFIG.features.analytics) {
            console.log(`[${new Date().toISOString()}] ${event}:`, data);
        }
    },
    
    /**
     * Initialize performance monitoring
     */
    initPerformanceMonitoring() {
        if (window.performance && window.performance.mark) {
            window.performance.mark('app-init-start');
        }
    },
    
    /**
     * Mark performance milestone
     * @param {string} milestone - Milestone name
     */
    markPerformance(milestone) {
        if (window.performance && window.performance.mark) {
            window.performance.mark(milestone);
        }
    }
};

// Initialize performance monitoring
Utils.initPerformanceMonitoring();

// Make Utils available globally
window.Utils = Utils;