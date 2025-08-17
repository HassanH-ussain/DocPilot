/**
 * Physician Dashboard - Authentication Management
 * Handles login, registration, and authentication state
 */

const AuthManager = {
    
    // Current user data
    currentUser: null,
    
    // Authentication state
    isAuthenticated: false,
    
    // Login attempts tracking
    loginAttempts: 0,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    
    // Demo credentials
    demoCredentials: {
        email: 'demo@physician.com',
        password: 'demo123',
        userData: {
            id: 'demo-user-001',
            firstName: 'John',
            lastName: 'Smith',
            email: 'demo@physician.com',
            licenseNumber: 'MD123456',
            specialization: 'internal-medicine',
            role: 'physician',
            registeredAt: new Date().toISOString(),
            lastLogin: null,
            profileComplete: true
        }
    },
    
    /**
     * Initialize authentication manager
     */
    init() {
        this.checkAuthState();
        this.bindEvents();
        this.checkLockoutStatus();
        Utils.logEvent('AuthManager initialized');
    },
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Password strength checking
        const registerPassword = document.getElementById('registerPassword');
        if (registerPassword) {
            registerPassword.addEventListener('input', () => {
                this.checkPasswordStrength(registerPassword.value);
            });
        }
        
        // Confirm password validation
        const confirmPassword = document.getElementById('registerConfirmPassword');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
        }
        
        // Real-time validation
        this.bindRealTimeValidation();
        
        Utils.logEvent('AuthManager events bound');
    },
    
    /**
     * Bind real-time validation to form fields
     */
    bindRealTimeValidation() {
        const fields = [
            'loginEmail', 'registerEmail', 'forgotEmail',
            'registerFirstName', 'registerLastName', 'registerLicenseNumber'
        ];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => this.validateField(field));
                field.addEventListener('input', () => this.clearFieldError(field));
            }
        });
    },
    
    /**
     * Check current authentication state
     */
    checkAuthState() {
        try {
            const savedAuth = localStorage.getItem('physicianDashboardAuth');
            const rememberMe = localStorage.getItem('physicianDashboardRemember');
            
            if (savedAuth) {
                const authData = JSON.parse(savedAuth);
                
                // Check if session is still valid
                if (this.isSessionValid(authData)) {
                    this.currentUser = authData.user;
                    this.isAuthenticated = true;
                    
                    // If we're on the login page and user is authenticated, redirect
                    if (window.location.pathname.includes('login.html') || 
                        window.location.pathname === '/') {
                        this.redirectToDashboard();
                    }
                    
                    Utils.logEvent('User session restored', { 
                        userId: this.currentUser.id,
                        email: this.currentUser.email 
                    });
                } else {
                    // Session expired, clear data
                    this.logout(false);
                }
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
            this.logout(false);
        }
    },
    
    /**
     * Check if session is still valid
     * @param {Object} authData - Authentication data
     * @returns {boolean} Is session valid
     */
    isSessionValid(authData) {
        if (!authData || !authData.expiresAt) return false;
        
        const now = new Date().getTime();
        const expirationTime = new Date(authData.expiresAt).getTime();
        
        return now < expirationTime;
    },
    
    /**
     * Handle login form submission
     * @param {Event} event - Form submit event
     */
    async handleLogin(event) {
        event.preventDefault();
        
        // Check lockout status
        if (this.isLockedOut()) {
            this.showError('loginForm', 'Account temporarily locked due to too many failed attempts. Please try again later.');
            return;
        }
        
        const form = event.target;
        const formData = new FormData(form);
        const email = formData.get('email').toLowerCase().trim();
        const password = formData.get('password');
        const rememberMe = formData.get('rememberMe') === 'on';
        
        // Clear previous errors
        this.clearFormErrors('loginForm');
        
        // Validate inputs
        if (!this.validateLoginInputs(email, password)) {
            return;
        }
        
        // Show loading state
        this.setButtonLoading('loginBtn', true);
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Authenticate user
            const authResult = await this.authenticateUser(email, password);
            
            if (authResult.success) {
                // Reset login attempts
                this.loginAttempts = 0;
                localStorage.removeItem('physicianDashboardLockout');
                
                // Store authentication data
                this.storeAuthData(authResult.user, rememberMe);
                
                // Update current user state
                this.currentUser = authResult.user;
                this.isAuthenticated = true;
                
                // Show success and redirect
                Utils.showNotification('Login successful! Redirecting...', 'success', 2000);
                
                Utils.logEvent('User logged in', {
                    userId: authResult.user.id,
                    email: authResult.user.email,
                    rememberMe: rememberMe
                });
                
                // Redirect after short delay
                setTimeout(() => {
                    this.redirectToDashboard();
                }, 1500);
                
            } else {
                // Handle failed login
                this.loginAttempts++;
                
                if (this.loginAttempts >= this.maxLoginAttempts) {
                    this.lockAccount();
                    this.showError('loginForm', 'Too many failed attempts. Account locked for 15 minutes.');
                } else {
                    const remainingAttempts = this.maxLoginAttempts - this.loginAttempts;
                    this.showError('loginForm', 
                        `${authResult.message} ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`
                    );
                }
                
                Utils.logEvent('Login failed', {
                    email: email,
                    attempt: this.loginAttempts,
                    reason: authResult.message
                });
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showError('loginForm', 'An error occurred during login. Please try again.');
        } finally {
            this.setButtonLoading('loginBtn', false);
        }
    },
    
    /**
     * Authenticate user credentials
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} Authentication result
     */
    async authenticateUser(email, password) {
        // For demo purposes, check against demo credentials
        if (email === this.demoCredentials.email && password === this.demoCredentials.password) {
            const userData = { ...this.demoCredentials.userData };
            userData.lastLogin = new Date().toISOString();
            
            return {
                success: true,
                user: userData,
                message: 'Login successful'
            };
        }
        
        // Check against stored registered users
        const registeredUsers = JSON.parse(localStorage.getItem('physicianDashboardUsers') || '[]');
        const user = registeredUsers.find(u => u.email === email);
        
        if (!user) {
            return {
                success: false,
                message: 'No account found with this email address.'
            };
        }
        
        // In a real app, you'd hash the password and compare
        // For demo purposes, we'll store passwords in plain text (NOT recommended for production)
        if (user.password !== password) {
            return {
                success: false,
                message: 'Incorrect password.'
            };
        }
        
        // Update last login
        user.lastLogin = new Date().toISOString();
        
        // Update stored user data
        const userIndex = registeredUsers.findIndex(u => u.email === email);
        registeredUsers[userIndex] = user;
        localStorage.setItem('physicianDashboardUsers', JSON.stringify(registeredUsers));
        
        // Remove password from response
        const userResponse = { ...user };
        delete userResponse.password;
        
        return {
            success: true,
            user: userResponse,
            message: 'Login successful'
        };
    },
    
    /**
     * Handle registration form submission
     * @param {Event} event - Form submit event
     */
    async handleRegister(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        const userData = {
            firstName: formData.get('firstName').trim(),
            lastName: formData.get('lastName').trim(),
            email: formData.get('email').toLowerCase().trim(),
            licenseNumber: formData.get('licenseNumber').trim(),
            specialization: formData.get('specialization'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            acceptTerms: formData.get('acceptTerms') === 'on'
        };
        
        // Clear previous errors
        this.clearFormErrors('registerForm');
        
        // Validate registration data
        const validation = this.validateRegistrationData(userData);
        if (!validation.isValid) {
            this.displayValidationErrors('registerForm', validation.errors);
            return;
        }
        
        // Show loading state
        this.setButtonLoading('registerBtn', true);
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Register user
            const registrationResult = await this.registerUser(userData);
            
            if (registrationResult.success) {
                // Show success message
                this.showSuccessMessage('registerForm', 
                    'Account created successfully! You can now sign in with your credentials.'
                );
                
                Utils.logEvent('User registered', {
                    userId: registrationResult.user.id,
                    email: registrationResult.user.email,
                    specialization: registrationResult.user.specialization
                });
                
                // Switch to login form after delay
                setTimeout(() => {
                    this.showLogin();
                    // Pre-fill email in login form
                    const loginEmail = document.getElementById('loginEmail');
                    if (loginEmail) {
                        loginEmail.value = userData.email;
                    }
                }, 2000);
                
            } else {
                this.showError('registerForm', registrationResult.message);
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('registerForm', 'An error occurred during registration. Please try again.');
        } finally {
            this.setButtonLoading('registerBtn', false);
        }
    },
    
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Object} Registration result
     */
    async registerUser(userData) {
        try {
            // Get existing users
            const registeredUsers = JSON.parse(localStorage.getItem('physicianDashboardUsers') || '[]');
            
            // Check if email already exists
            const existingUser = registeredUsers.find(user => user.email === userData.email);
            if (existingUser) {
                return {
                    success: false,
                    message: 'An account with this email address already exists.'
                };
            }
            
            // Check if license number already exists
            const existingLicense = registeredUsers.find(user => user.licenseNumber === userData.licenseNumber);
            if (existingLicense) {
                return {
                    success: false,
                    message: 'An account with this license number already exists.'
                };
            }
            
            // Create new user
            const newUser = {
                id: this.generateUserId(),
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                licenseNumber: userData.licenseNumber,
                specialization: userData.specialization,
                password: userData.password, // In production, this should be hashed
                role: 'physician',
                registeredAt: new Date().toISOString(),
                lastLogin: null,
                profileComplete: true,
                isActive: true
            };
            
            // Add to users array
            registeredUsers.push(newUser);
            
            // Save to localStorage
            localStorage.setItem('physicianDashboardUsers', JSON.stringify(registeredUsers));
            
            // Return success (without password)
            const userResponse = { ...newUser };
            delete userResponse.password;
            
            return {
                success: true,
                user: userResponse,
                message: 'Registration successful'
            };
            
        } catch (error) {
            console.error('User registration error:', error);
            return {
                success: false,
                message: 'Registration failed. Please try again.'
            };
        }
    },
    
    /**
     * Handle forgot password form submission
     * @param {Event} event - Form submit event
     */
    async handleForgotPassword(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const email = formData.get('email').toLowerCase().trim();
        
        // Clear previous errors
        this.clearFormErrors('forgotPasswordForm');
        
        // Validate email
        if (!email) {
            this.showFieldError('forgotEmail', 'Email address is required');
            return;
        }
        
        if (!Utils.isValidEmail(email)) {
            this.showFieldError('forgotEmail', 'Please enter a valid email address');
            return;
        }
        
        // Show loading state
        this.setButtonLoading('forgotPasswordBtn', true);
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check if email exists (in production, you'd always show success for security)
            const registeredUsers = JSON.parse(localStorage.getItem('physicianDashboardUsers') || '[]');
            const userExists = registeredUsers.some(user => user.email === email) || 
                             email === this.demoCredentials.email;
            
            // Always show success message for security reasons
            this.showSuccessMessage('forgotPasswordForm', 
                'If an account with this email exists, you will receive password reset instructions shortly.'
            );
            
            Utils.logEvent('Password reset requested', { email: email, userExists: userExists });
            
            // In a real application, you would:
            // 1. Generate a secure reset token
            // 2. Store it with expiration time
            // 3. Send email with reset link
            
        } catch (error) {
            console.error('Forgot password error:', error);
            this.showError('forgotPasswordForm', 'An error occurred. Please try again later.');
        } finally {
            this.setButtonLoading('forgotPasswordBtn', false);
        }
    },
    
    /**
     * Validate login inputs
     * @param {string} email - Email address
     * @param {string} password - Password
     * @returns {boolean} Are inputs valid
     */
    validateLoginInputs(email, password) {
        let isValid = true;
        
        if (!email) {
            this.showFieldError('loginEmail', 'Email address is required');
            isValid = false;
        } else if (!Utils.isValidEmail(email)) {
            this.showFieldError('loginEmail', 'Please enter a valid email address');
            isValid = false;
        }
        
        if (!password) {
            this.showFieldError('loginPassword', 'Password is required');
            isValid = false;
        }
        
        return isValid;
    },
    
    /**
     * Validate registration data
     * @param {Object} data - Registration data
     * @returns {Object} Validation result
     */
    validateRegistrationData(data) {
        const errors = {};
        let isValid = true;
        
        // First name validation
        if (!data.firstName) {
            errors.registerFirstName = 'First name is required';
            isValid = false;
        } else if (data.firstName.length < 2) {
            errors.registerFirstName = 'First name must be at least 2 characters';
            isValid = false;
        }
        
        // Last name validation
        if (!data.lastName) {
            errors.registerLastName = 'Last name is required';
            isValid = false;
        } else if (data.lastName.length < 2) {
            errors.registerLastName = 'Last name must be at least 2 characters';
            isValid = false;
        }
        
        // Email validation
        if (!data.email) {
            errors.registerEmail = 'Email address is required';
            isValid = false;
        } else if (!Utils.isValidEmail(data.email)) {
            errors.registerEmail = 'Please enter a valid email address';
            isValid = false;
        }
        
        // License number validation
        if (!data.licenseNumber) {
            errors.registerLicenseNumber = 'Medical license number is required';
            isValid = false;
        } else if (data.licenseNumber.length < 5) {
            errors.registerLicenseNumber = 'License number must be at least 5 characters';
            isValid = false;
        }
        
        // Specialization validation
        if (!data.specialization) {
            errors.registerSpecialization = 'Please select your specialization';
            isValid = false;
        }
        
        // Password validation
        const passwordValidation = this.validatePassword(data.password);
        if (!passwordValidation.isValid) {
            errors.registerPassword = passwordValidation.message;
            isValid = false;
        }
        
        // Confirm password validation
        if (data.password !== data.confirmPassword) {
            errors.registerConfirmPassword = 'Passwords do not match';
            isValid = false;
        }
        
        // Terms acceptance validation
        if (!data.acceptTerms) {
            errors.acceptTerms = 'You must accept the terms and conditions';
            isValid = false;
        }
        
        return { isValid, errors };
    },
    
    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result
     */
    validatePassword(password) {
        if (!password) {
            return { isValid: false, message: 'Password is required' };
        }
        
        if (password.length < 8) {
            return { isValid: false, message: 'Password must be at least 8 characters long' };
        }
        
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
        
        if (strength < 3) {
            return { 
                isValid: false, 
                message: 'Password must contain at least 3 of: uppercase, lowercase, numbers, special characters' 
            };
        }
        
        return { isValid: true, message: 'Password is strong' };
    },
    
    /**
     * Check password strength and update indicator
     * @param {string} password - Password to check
     */
    checkPasswordStrength(password) {
        const strengthIndicator = document.getElementById('passwordStrength');
        if (!strengthIndicator) return;
        
        if (!password) {
            strengthIndicator.style.display = 'none';
            return;
        }
        
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const criteria = [
            password.length >= 8,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar
        ];
        
        const strength = criteria.filter(Boolean).length;
        
        strengthIndicator.className = 'password-strength';
        
        if (strength < 3) {
            strengthIndicator.classList.add('weak');
            strengthIndicator.textContent = 'Weak password';
        } else if (strength < 5) {
            strengthIndicator.classList.add('medium');
            strengthIndicator.textContent = 'Medium strength password';
        } else {
            strengthIndicator.classList.add('strong');
            strengthIndicator.textContent = 'Strong password';
        }
    },
    
    /**
     * Validate password match
     */
    validatePasswordMatch() {
        const password = document.getElementById('registerPassword')?.value;
        const confirmPassword = document.getElementById('registerConfirmPassword')?.value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.showFieldError('registerConfirmPassword', 'Passwords do not match');
        } else {
            this.clearFieldError(document.getElementById('registerConfirmPassword'));
        }
    },
    
    /**
     * Toggle password visibility
     * @param {string} fieldId - Password field ID
     */
    togglePasswordVisibility(fieldId) {
        const field = document.getElementById(fieldId);
        const button = field?.parentElement.querySelector('.password-toggle');
        
        if (field && button) {
            if (field.type === 'password') {
                field.type = 'text';
                button.textContent = '🙈';
                button.setAttribute('aria-label', 'Hide password');
            } else {
                field.type = 'password';
                button.textContent = '👁️';
                button.setAttribute('aria-label', 'Show password');
            }
        }
    },
    
    /**
     * Show login form
     */
    showLogin() {
        this.hideAllCards();
        const loginCard = document.getElementById('loginCard');
        if (loginCard) {
            loginCard.style.display = 'block';
            loginCard.classList.add('slide-in-right');
            
            // Focus on email field
            setTimeout(() => {
                const emailField = document.getElementById('loginEmail');
                if (emailField) emailField.focus();
            }, 100);
        }
        Utils.logEvent('Login form shown');
    },
    
    /**
     * Show registration form
     */
    showRegister() {
        this.hideAllCards();
        const registerCard = document.getElementById('registerCard');
        if (registerCard) {
            registerCard.style.display = 'block';
            registerCard.classList.add('slide-in-right');
            
            // Focus on first name field
            setTimeout(() => {
                const firstNameField = document.getElementById('registerFirstName');
                if (firstNameField) firstNameField.focus();
            }, 100);
        }
        Utils.logEvent('Registration form shown');
    },
    
    /**
     * Show forgot password form
     */
    showForgotPassword() {
        this.hideAllCards();
        const forgotCard = document.getElementById('forgotPasswordCard');
        if (forgotCard) {
            forgotCard.style.display = 'block';
            forgotCard.classList.add('slide-in-right');
            
            // Focus on email field
            setTimeout(() => {
                const emailField = document.getElementById('forgotEmail');
                if (emailField) emailField.focus();
            }, 100);
        }
        Utils.logEvent('Forgot password form shown');
    },
    
    /**
     * Hide all auth cards
     */
    hideAllCards() {
        const cards = ['loginCard', 'registerCard', 'forgotPasswordCard'];
        cards.forEach(cardId => {
            const card = document.getElementById(cardId);
            if (card) {
                card.style.display = 'none';
                card.classList.remove('slide-in-right', 'slide-out-left');
            }
        });
        
        // Clear all forms
        this.clearAllForms();
    },
    
    /**
     * Clear all forms
     */
    clearAllForms() {
        const forms = ['loginForm', 'registerForm', 'forgotPasswordForm'];
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                form.reset();
                this.clearFormErrors(formId);
            }
        });
        
        // Reset password strength indicator
        const strengthIndicator = document.getElementById('passwordStrength');
        if (strengthIndicator) {
            strengthIndicator.style.display = 'none';
        }
    },
    
    /**
     * Store authentication data
     * @param {Object} user - User data
     * @param {boolean} rememberMe - Remember me option
     */
    storeAuthData(user, rememberMe = false) {
        const expirationTime = rememberMe 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            
        const authData = {
            user: user,
            expiresAt: expirationTime.toISOString(),
            rememberMe: rememberMe
        };
        
        localStorage.setItem('physicianDashboardAuth', JSON.stringify(authData));
        
        if (rememberMe) {
            localStorage.setItem('physicianDashboardRemember', 'true');
        }
    },
    
    /**
     * Logout user
     * @param {boolean} showMessage - Show logout message
     */
    logout(showMessage = true) {
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Clear stored data
        localStorage.removeItem('physicianDashboardAuth');
        localStorage.removeItem('physicianDashboardRemember');
        
        if (showMessage) {
            Utils.showNotification('You have been logged out', 'info');
        }
        
        Utils.logEvent('User logged out');
        
        // Redirect to login page
        this.redirectToLogin();
    },
    
    /**
     * Redirect to dashboard
     */
    redirectToDashboard() {
        window.location.href = 'WebPage.html';
    },
    
    /**
     * Redirect to login page
     */
    redirectToLogin() {
        window.location.href = 'login.html';
    },
    
    /**
     * Check if account is locked out
     * @returns {boolean} Is locked out
     */
    isLockedOut() {
        const lockoutData = localStorage.getItem('physicianDashboardLockout');
        if (!lockoutData) return false;
        
        const lockout = JSON.parse(lockoutData);
        const now = new Date().getTime();
        
        return now < lockout.expiresAt;
    },
    
    /**
     * Lock account due to failed attempts
     */
    lockAccount() {
        const lockoutData = {
            lockedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.lockoutDuration).getTime()
        };
        
        localStorage.setItem('physicianDashboardLockout', JSON.stringify(lockoutData));
        Utils.logEvent('Account locked due to failed login attempts');
    },
    
    /**
     * Check lockout status on page load
     */
    checkLockoutStatus() {
        if (this.isLockedOut()) {
            const lockoutData = JSON.parse(localStorage.getItem('physicianDashboardLockout'));
            const expiresAt = new Date(lockoutData.expiresAt);
            const timeRemaining = Math.ceil((expiresAt.getTime() - Date.now()) / 60000);
            
            Utils.showNotification(
                `Account is temporarily locked. Try again in ${timeRemaining} minute${timeRemaining > 1 ? 's' : ''}.`,
                'warning',
                5000
            );
        }
    },
    
    /**
     * Generate unique user ID
     * @returns {string} User ID
     */
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    /**
     * Set button loading state
     * @param {string} buttonId - Button ID
     * @param {boolean} loading - Is loading
     */
    setButtonLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        const btnText = button.querySelector('.btn-text');
        const btnLoader = button.querySelector('.btn-loader');
        
        if (loading) {
            button.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'inline';
        } else {
            button.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
        }
    },
    
    /**
     * Show form error message
     * @param {string} formId - Form ID
     * @param {string} message - Error message
     */
    showError(formId, message) {
        this.removeExistingMessages(formId);
        
        const form = document.getElementById(formId);
        if (form) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'auth-error';
            errorDiv.style.cssText = `
                background: rgba(231, 76, 60, 0.1);
                border: 1px solid rgba(231, 76, 60, 0.2);
                color: var(--danger-color);
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 15px;
                font-size: 14px;
                animation: errorSlideIn 0.3s ease-out;
            `;
            errorDiv.textContent = message;
            
            form.insertBefore(errorDiv, form.firstChild);
        }
    },
    
    /**
     * Show success message
     * @param {string} formId - Form ID
     * @param {string} message - Success message
     */
    showSuccessMessage(formId, message) {
        this.removeExistingMessages(formId);
        
        const form = document.getElementById(formId);
        if (form) {
            const successDiv = document.createElement('div');
            successDiv.className = 'auth-success';
            successDiv.textContent = message;
            
            form.insertBefore(successDiv, form.firstChild);
        }
    },
    
    /**
     * Remove existing messages from form
     * @param {string} formId - Form ID
     */
    removeExistingMessages(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const existingMessages = form.querySelectorAll('.auth-error, .auth-success');
            existingMessages.forEach(msg => msg.remove());
        }
    },
    
    /**
     * Show field error
     * @param {string} fieldId - Field ID
     * @param {string} message - Error message
     */
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorDiv = document.getElementById(fieldId + 'Error');
        
        if (field && errorDiv) {
            field.classList.add('error');
            errorDiv.textContent = message;
            errorDiv.classList.add('show');
        }
    },
    
    /**
     * Clear field error
     * @param {HTMLElement} field - Field element
     */
    clearFieldError(field) {
        if (field) {
            field.classList.remove('error');
            const errorDiv = document.getElementById(field.id + 'Error');
            if (errorDiv) {
                errorDiv.classList.remove('show');
                errorDiv.textContent = '';
            }
        }
    },
    
    /**
     * Clear all form errors
     * @param {string} formId - Form ID
     */
    clearFormErrors(formId) {
        const form = document.getElementById(formId);
        if (form) {
            // Clear field errors
            const errorFields = form.querySelectorAll('.error');
            errorFields.forEach(field => this.clearFieldError(field));
            
            // Clear form messages
            this.removeExistingMessages(formId);
        }
    },
    
    /**
     * Display validation errors
     * @param {string} formId - Form ID
     * @param {Object} errors - Validation errors
     */
    displayValidationErrors(formId, errors) {
        Object.keys(errors).forEach(fieldId => {
            this.showFieldError(fieldId, errors[fieldId]);
        });
    },
    
    /**
     * Validate individual field
     * @param {HTMLElement} field - Field element
     */
    validateField(field) {
        if (!field) return;
        
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        switch (field.id) {
            case 'loginEmail':
            case 'registerEmail':
            case 'forgotEmail':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Email address is required';
                } else if (!Utils.isValidEmail(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
                break;
                
            case 'registerFirstName':
            case 'registerLastName':
                if (!value) {
                    isValid = false;
                    errorMessage = `${field.id.includes('First') ? 'First' : 'Last'} name is required`;
                } else if (value.length < 2) {
                    isValid = false;
                    errorMessage = `${field.id.includes('First') ? 'First' : 'Last'} name must be at least 2 characters`;
                }
                break;
                
            case 'registerLicenseNumber':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Medical license number is required';
                } else if (value.length < 5) {
                    isValid = false;
                    errorMessage = 'License number must be at least 5 characters';
                }
                break;
        }
        
        if (!isValid) {
            this.showFieldError(field.id, errorMessage);
        } else {
            this.clearFieldError(field);
        }
    },
    
    /**
     * Get current user data
     * @returns {Object|null} Current user or null
     */
    getCurrentUser() {
        return this.currentUser;
    },
    
    /**
     * Check if user is authenticated
     * @returns {boolean} Is authenticated
     */
    isUserAuthenticated() {
        return this.isAuthenticated;
    },
    
    /**
     * Require authentication (call this on protected pages)
     */
    requireAuth() {
        if (!this.isAuthenticated) {
            Utils.showNotification('Please log in to access this page', 'warning');
            this.redirectToLogin();
            return false;
        }
        return true;
    },
    
    /**
     * Update user profile
     * @param {Object} updates - Profile updates
     */
    updateProfile(updates) {
        if (!this.currentUser) return false;
        
        try {
            // Update current user
            this.currentUser = { ...this.currentUser, ...updates };
            
            // Update stored auth data
            const authData = JSON.parse(localStorage.getItem('physicianDashboardAuth'));
            if (authData) {
                authData.user = this.currentUser;
                localStorage.setItem('physicianDashboardAuth', JSON.stringify(authData));
            }
            
            // Update in users list
            const registeredUsers = JSON.parse(localStorage.getItem('physicianDashboardUsers') || '[]');
            const userIndex = registeredUsers.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                registeredUsers[userIndex] = { ...registeredUsers[userIndex], ...updates };
                localStorage.setItem('physicianDashboardUsers', JSON.stringify(registeredUsers));
            }
            
            Utils.logEvent('User profile updated', { userId: this.currentUser.id });
            return true;
            
        } catch (error) {
            console.error('Error updating profile:', error);
            return false;
        }
    },
    
    /**
     * Get user display name
     * @returns {string} User display name
     */
    getUserDisplayName() {
        if (!this.currentUser) return 'User';
        return `Dr. ${this.currentUser.firstName} ${this.currentUser.lastName}`;
    },
    
    /**
     * Export authentication data (for debugging)
     * @returns {Object} Auth data
     */
    getAuthData() {
        return {
            isAuthenticated: this.isAuthenticated,
            currentUser: this.currentUser ? { ...this.currentUser } : null,
            loginAttempts: this.loginAttempts,
            isLockedOut: this.isLockedOut()
        };
    }
};

// Global functions for HTML handlers
window.AuthManager = AuthManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AuthManager.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}