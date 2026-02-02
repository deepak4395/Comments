// Authentication module
const API_URL = 'https://api.sarcasticrobo.online';

const Auth = {
    token: null,
    user: null,

    init() {
        // Check for token in URL (from OAuth callback)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
            this.setToken(token);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            // Try to load token from localStorage
            const savedToken = localStorage.getItem('auth_token');
            if (savedToken) {
                this.token = savedToken;
            }
        }

        // Check for error in URL
        const error = urlParams.get('error');
        if (error) {
            this.showError('Authentication failed: ' + error);
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Update UI based on auth state
        this.updateUI();
        
        // If token exists, fetch user info
        if (this.token) {
            this.fetchUserInfo();
        }
    },

    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    },

    clearToken() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('auth_token');
    },

    isAuthenticated() {
        return !!this.token;
    },

    async fetchUserInfo() {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user info');
            }

            this.user = await response.json();
            this.updateUI();
        } catch (error) {
            console.error('Error fetching user info:', error);
            this.clearToken();
            this.updateUI();
        }
    },

    login() {
        window.location.href = `${API_URL}/auth/google`;
    },

    logout() {
        this.clearToken();
        this.updateUI();
        // Optionally call server logout endpoint
        fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        }).catch(err => console.error('Logout error:', err));
    },

    updateUI() {
        const loginBtn = document.getElementById('login-btn');
        const userInfo = document.getElementById('user-info');
        const commentFormSection = document.getElementById('comment-form-section');

        if (this.isAuthenticated() && this.user) {
            // User is logged in
            loginBtn.classList.add('hidden');
            userInfo.classList.remove('hidden');
            commentFormSection.classList.remove('hidden');

            // Update user info
            document.getElementById('user-name').textContent = this.user.display_name;
            document.getElementById('user-avatar').src = this.user.avatar_url || 'https://via.placeholder.com/40';
        } else {
            // User is not logged in
            loginBtn.classList.remove('hidden');
            userInfo.classList.add('hidden');
            commentFormSection.classList.add('hidden');
        }
    },

    showError(message) {
        const container = document.querySelector('main');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        container.insertBefore(errorDiv, container.firstChild);

        setTimeout(() => errorDiv.remove(), 5000);
    },

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-btn').addEventListener('click', () => {
        Auth.login();
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        Auth.logout();
    });
});
