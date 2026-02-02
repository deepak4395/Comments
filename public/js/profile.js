// Profile page functionality
const API_URL = 'https://api.sarcasticrobo.online';

// Get user ID from URL
const urlParams = new URLSearchParams(window.location.search);
const profileUserId = urlParams.get('id');

let currentUser = null;
let selectedRating = 0;

// Initialize profile page
async function initProfile() {
    if (!profileUserId) {
        showError('No user ID specified');
        document.getElementById('loading').classList.add('hidden');
        return;
    }

    try {
        // Get current user if logged in
        if (Auth && Auth.token) {
            currentUser = await Auth.getUser();
        }

        // Load profile data
        await loadProfile();
        await loadUserComments();
        await loadRatingsReceived();

        // Setup tab switching
        setupTabs();

        // Setup rating form if user is logged in
        if (currentUser && currentUser.id !== parseInt(profileUserId)) {
            document.getElementById('rating-form-container').classList.remove('hidden');
            await loadMyRating();
            setupRatingForm();
        } else if (currentUser && currentUser.id === parseInt(profileUserId)) {
            // User viewing their own profile
            document.getElementById('rating-form-container').innerHTML = 
                '<p style="text-align: center; color: var(--text-secondary);">You cannot rate yourself</p>';
            document.getElementById('rating-form-container').classList.remove('hidden');
        }

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('profile-content').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile: ' + error.message);
        document.getElementById('loading').classList.add('hidden');
    }
}

// Load profile data
async function loadProfile() {
    const response = await fetch(`${API_URL}/api/users/${profileUserId}/profile`);
    
    if (!response.ok) {
        throw new Error('Failed to load profile');
    }

    const data = await response.json();
    const { profile, ratingStats } = data;

    // Update profile header
    document.getElementById('profile-avatar').src = profile.avatarUrl || 'https://via.placeholder.com/100';
    document.getElementById('profile-name').textContent = profile.displayName || 'Anonymous';
    document.getElementById('profile-email').textContent = profile.email || '';

    // Update stats
    document.getElementById('stat-comments').textContent = profile.totalComments || 0;
    document.getElementById('stat-approved').textContent = profile.approvedComments || 0;
    document.getElementById('stat-rating').textContent = 
        profile.avgRating ? profile.avgRating.toFixed(1) : '-';

    // Update rating display
    displayRating(profile.avgRating, profile.totalRatings);
    displayRatingBreakdown(ratingStats);
}

// Display rating stars
function displayRating(avgRating, totalRatings) {
    const starsContainer = document.getElementById('avg-rating-stars');
    starsContainer.innerHTML = '';

    const rating = avgRating || 0;
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.textContent = '★';
        if (i <= Math.round(rating)) {
            star.classList.add('filled');
        }
        starsContainer.appendChild(star);
    }

    document.getElementById('avg-rating-value').textContent = 
        avgRating ? avgRating.toFixed(1) : '-';
    document.getElementById('rating-count').textContent = 
        `(${totalRatings || 0} ${totalRatings === 1 ? 'rating' : 'ratings'})`;
}

// Display rating breakdown
function displayRatingBreakdown(stats) {
    const container = document.getElementById('rating-breakdown');
    container.innerHTML = '<h4 style="margin-bottom: 1rem;">Rating Distribution</h4>';

    const total = stats.totalRatings || 0;
    const ratings = [
        { stars: 5, count: stats.fiveStars || 0 },
        { stars: 4, count: stats.fourStars || 0 },
        { stars: 3, count: stats.threeStars || 0 },
        { stars: 2, count: stats.twoStars || 0 },
        { stars: 1, count: stats.oneStar || 0 },
    ];

    ratings.forEach(({ stars, count }) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        const bar = document.createElement('div');
        bar.className = 'rating-bar';
        bar.innerHTML = `
            <div class="rating-bar-label">${stars} ★</div>
            <div class="rating-bar-fill-container">
                <div class="rating-bar-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="rating-bar-count">${count}</div>
        `;
        container.appendChild(bar);
    });
}

// Load user's current rating for this profile
async function loadMyRating() {
    if (!Auth || !Auth.token) return;

    try {
        const response = await fetch(`${API_URL}/api/users/${profileUserId}/my-rating`, {
            headers: {
                'Authorization': `Bearer ${Auth.token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.hasRated) {
                selectedRating = data.rating.rating;
                updateRatingStars(selectedRating);
                document.getElementById('current-rating-text').textContent = 
                    `Your current rating: ${selectedRating} stars`;
                document.getElementById('delete-rating-btn').classList.remove('hidden');
            } else {
                document.getElementById('current-rating-text').textContent = 
                    'You have not rated this user yet. Click the stars to rate.';
            }
        }
    } catch (error) {
        console.error('Error loading my rating:', error);
    }
}

// Setup rating form
function setupRatingForm() {
    const starsContainer = document.getElementById('rate-user-stars');
    starsContainer.innerHTML = '';

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'star clickable';
        star.textContent = '★';
        star.dataset.rating = i;
        
        star.addEventListener('click', () => {
            selectedRating = i;
            updateRatingStars(i);
            document.getElementById('submit-rating-btn').disabled = false;
        });

        starsContainer.appendChild(star);
    }

    // Update stars if user already rated
    if (selectedRating > 0) {
        updateRatingStars(selectedRating);
        document.getElementById('submit-rating-btn').disabled = false;
    }

    // Submit rating
    document.getElementById('submit-rating-btn').addEventListener('click', submitRating);
    
    // Delete rating
    document.getElementById('delete-rating-btn').addEventListener('click', deleteRating);
}

// Update rating stars display
function updateRatingStars(rating) {
    const stars = document.querySelectorAll('#rate-user-stars .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('filled');
        } else {
            star.classList.remove('filled');
        }
    });
}

// Submit rating
async function submitRating() {
    if (!Auth || !Auth.token) {
        alert('Please login to rate users');
        return;
    }

    if (selectedRating < 1 || selectedRating > 5) {
        alert('Please select a rating');
        return;
    }

    try {
        document.getElementById('submit-rating-btn').disabled = true;
        
        const response = await fetch(`${API_URL}/api/users/${profileUserId}/ratings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.token}`
            },
            body: JSON.stringify({ rating: selectedRating })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to submit rating');
        }

        const data = await response.json();
        
        // Update UI
        document.getElementById('current-rating-text').textContent = 
            `Your current rating: ${selectedRating} stars`;
        document.getElementById('delete-rating-btn').classList.remove('hidden');
        
        // Reload profile to show updated rating
        await loadProfile();
        await loadRatingsReceived();
        
        alert('Rating submitted successfully!');
    } catch (error) {
        console.error('Error submitting rating:', error);
        alert('Failed to submit rating: ' + error.message);
        document.getElementById('submit-rating-btn').disabled = false;
    }
}

// Delete rating
async function deleteRating() {
    if (!Auth || !Auth.token) return;

    if (!confirm('Are you sure you want to delete your rating?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/users/${profileUserId}/ratings`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${Auth.token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete rating');
        }

        // Reset UI
        selectedRating = 0;
        updateRatingStars(0);
        document.getElementById('current-rating-text').textContent = 
            'You have not rated this user yet. Click the stars to rate.';
        document.getElementById('delete-rating-btn').classList.add('hidden');
        document.getElementById('submit-rating-btn').disabled = true;
        
        // Reload profile
        await loadProfile();
        await loadRatingsReceived();
        
        alert('Rating deleted successfully!');
    } catch (error) {
        console.error('Error deleting rating:', error);
        alert('Failed to delete rating: ' + error.message);
    }
}

// Load user comments
async function loadUserComments() {
    try {
        const response = await fetch(`${API_URL}/api/users/${profileUserId}/comments?limit=20`);
        
        if (!response.ok) {
            throw new Error('Failed to load comments');
        }

        const data = await response.json();
        displayUserComments(data.comments);
    } catch (error) {
        console.error('Error loading comments:', error);
        document.getElementById('user-comments-list').innerHTML = 
            '<p class="error-message">Failed to load comments</p>';
    }
}

// Display user comments
function displayUserComments(comments) {
    const container = document.getElementById('user-comments-list');
    
    if (comments.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No comments yet</p>';
        return;
    }

    container.innerHTML = comments.map(comment => `
        <div class="comment-item-profile">
            <div class="comment-meta">
                <span class="comment-section">Section: ${comment.siteSection}</span>
                <span class="comment-status ${comment.status}">${comment.status.toUpperCase()}</span>
            </div>
            <p style="margin: 1rem 0;">${escapeHtml(comment.content)}</p>
            <div class="comment-meta">
                ${comment.finalRating ? `<span>Rating: ${'★'.repeat(comment.finalRating)}${'☆'.repeat(5 - comment.finalRating)}</span>` : ''}
                <span class="comment-date">${new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

// Load ratings received
async function loadRatingsReceived() {
    try {
        const response = await fetch(`${API_URL}/api/users/${profileUserId}/ratings?limit=20`);
        
        if (!response.ok) {
            throw new Error('Failed to load ratings');
        }

        const data = await response.json();
        displayRatingsReceived(data.ratings);
    } catch (error) {
        console.error('Error loading ratings:', error);
        document.getElementById('ratings-received-list').innerHTML = 
            '<p class="error-message">Failed to load ratings</p>';
    }
}

// Display ratings received
function displayRatingsReceived(ratings) {
    const container = document.getElementById('ratings-received-list');
    
    if (ratings.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No ratings yet</p>';
        return;
    }

    container.innerHTML = ratings.map(rating => `
        <div class="rating-item">
            <img src="${rating.rater.avatarUrl || 'https://via.placeholder.com/40'}" 
                 alt="${rating.rater.name}" 
                 class="rating-item-avatar">
            <div class="rating-item-info">
                <div class="rating-item-name">
                    <a href="profile.html?id=${rating.rater.id}" style="color: var(--primary-color); text-decoration: none;">
                        ${escapeHtml(rating.rater.name)}
                    </a>
                </div>
                <div class="rating-item-date">${new Date(rating.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="star-rating">
                ${'★'.repeat(rating.rating)}<span style="color: #ddd;">${'★'.repeat(5 - rating.rating)}</span>
            </div>
        </div>
    `).join('');
}

// Setup tabs
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.dataset.tab;
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
}

// Show error message
function showError(message) {
    const errorContainer = document.getElementById('error-container');
    errorContainer.innerHTML = `
        <div class="error-message">
            ${escapeHtml(message)}
        </div>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Auth !== 'undefined') {
        Auth.init();
    }
    initProfile();
});
