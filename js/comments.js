// Comments module
const Comments = {
    currentSection: 'general',
    currentCommentId: null,
    currentSuggestedRating: null,

    init() {
        this.setupEventListeners();
        this.loadComments();
        this.loadStats();
    },

    setupEventListeners() {
        // Comment form submission
        document.getElementById('comment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitComment();
        });

        // Character counter
        const textarea = document.getElementById('comment-content');
        textarea.addEventListener('input', () => {
            const count = textarea.value.length;
            document.getElementById('char-count').textContent = count;
        });

        // Filter section change
        document.getElementById('filter-section').addEventListener('change', (e) => {
            this.currentSection = e.target.value;
            this.loadComments();
            this.loadStats();
        });

        // Site section change in form
        document.getElementById('site-section').addEventListener('change', (e) => {
            // Optionally update filter to match
            document.getElementById('filter-section').value = e.target.value;
            this.currentSection = e.target.value;
            this.loadComments();
        });
    },

    async submitComment() {
        if (!Auth.isAuthenticated()) {
            alert('Please login to submit a comment');
            return;
        }

        const content = document.getElementById('comment-content').value.trim();
        const siteSection = document.getElementById('site-section').value;

        if (!content) {
            alert('Please enter a comment');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/comments`, {
                method: 'POST',
                headers: Auth.getHeaders(),
                body: JSON.stringify({ content, siteSection })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit comment');
            }

            this.handleModerationResult(data);
        } catch (error) {
            console.error('Error submitting comment:', error);
            this.showMessage('Error: ' + error.message, 'error');
        }
    },

    handleModerationResult(data) {
        const resultSection = document.getElementById('moderation-result');
        const resultContent = document.getElementById('moderation-content');

        resultSection.classList.remove('hidden');

        if (data.status === 'approved') {
            this.currentCommentId = data.comment.id;
            this.currentSuggestedRating = data.moderation.suggestedRating;

            resultContent.innerHTML = `
                <div class="success-message">
                    <h3>✅ Comment Approved!</h3>
                    <p>${data.moderation.feedback || 'Your comment has been approved by AI moderation.'}</p>
                </div>
                <div class="rating-display">
                    <h4>AI Suggested Rating: ${this.renderStars(data.moderation.suggestedRating)}</h4>
                    <p>You can adjust the rating if you'd like:</p>
                    <div class="rating-selector">
                        ${[1, 2, 3, 4, 5].map(rating => `
                            <button class="rating-btn ${rating === data.moderation.suggestedRating ? 'selected' : ''}" 
                                    data-rating="${rating}">
                                ${rating} ⭐
                            </button>
                        `).join('')}
                    </div>
                    <button id="confirm-rating-btn" class="btn btn-success" style="margin-top: 15px;">
                        Confirm Rating
                    </button>
                </div>
            `;

            // Add event listeners for rating buttons
            document.querySelectorAll('.rating-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
                    e.target.classList.add('selected');
                    this.currentSuggestedRating = parseInt(e.target.dataset.rating);
                });
            });

            document.getElementById('confirm-rating-btn').addEventListener('click', () => {
                this.updateRating(this.currentCommentId, this.currentSuggestedRating);
            });
        } else {
            resultContent.innerHTML = `
                <div class="error-message">
                    <h3>❌ Comment Rejected</h3>
                    <p><strong>Reason:</strong> ${data.moderation.reason}</p>
                    <p>${data.moderation.feedback || ''}</p>
                    <button id="edit-comment-btn" class="btn btn-primary" style="margin-top: 15px;">
                        Edit and Resubmit
                    </button>
                </div>
            `;

            document.getElementById('edit-comment-btn').addEventListener('click', () => {
                resultSection.classList.add('hidden');
                document.getElementById('comment-content').focus();
            });
        }

        // Scroll to result
        resultSection.scrollIntoView({ behavior: 'smooth' });
    },

    async updateRating(commentId, rating) {
        try {
            const response = await fetch(`${API_URL}/api/comments/${commentId}/rating`, {
                method: 'PUT',
                headers: Auth.getHeaders(),
                body: JSON.stringify({ rating })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update rating');
            }

            this.showMessage('✅ Rating confirmed! Your comment is now published.', 'success');
            
            // Reset form and hide moderation result
            document.getElementById('comment-form').reset();
            document.getElementById('char-count').textContent = '0';
            document.getElementById('moderation-result').classList.add('hidden');

            // Reload comments and stats
            this.loadComments();
            this.loadStats();
        } catch (error) {
            console.error('Error updating rating:', error);
            this.showMessage('Error: ' + error.message, 'error');
        }
    },

    async loadComments() {
        const commentsList = document.getElementById('comments-list');
        commentsList.innerHTML = '<div class="loading">Loading comments...</div>';

        try {
            const response = await fetch(`${API_URL}/api/comments?siteSection=${this.currentSection}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load comments');
            }

            if (data.comments.length === 0) {
                commentsList.innerHTML = '<div class="loading">No comments yet. Be the first to comment!</div>';
                return;
            }

            commentsList.innerHTML = data.comments.map(comment => this.renderComment(comment)).join('');
        } catch (error) {
            console.error('Error loading comments:', error);
            commentsList.innerHTML = '<div class="error-message">Failed to load comments</div>';
        }
    },

    renderComment(comment) {
        const date = new Date(comment.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="comment-item">
                <div class="comment-header">
                    <div class="comment-author">
                        <img src="${comment.avatar_url || 'https://via.placeholder.com/32'}" alt="${comment.display_name}">
                        <span class="comment-author-name">${comment.display_name}</span>
                    </div>
                    <div class="comment-date">${date}</div>
                </div>
                <div class="comment-content">${this.escapeHtml(comment.content)}</div>
                <div class="comment-rating">
                    ${this.renderStars(comment.final_rating || comment.ai_suggested_rating)}
                </div>
            </div>
        `;
    },

    renderStars(rating) {
        if (!rating) return '';
        const fullStars = Math.floor(rating);
        const emptyStars = 5 - fullStars;
        return '⭐'.repeat(fullStars) + '☆'.repeat(emptyStars);
    },

    async loadStats() {
        try {
            const response = await fetch(`${API_URL}/api/comments/stats?siteSection=${this.currentSection}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load stats');
            }

            const stats = data.stats;
            document.getElementById('stat-total').textContent = stats.total || 0;
            document.getElementById('stat-approved').textContent = stats.approved || 0;
            document.getElementById('stat-rejected').textContent = stats.rejected || 0;
            document.getElementById('stat-rating').textContent = stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : '0.0';
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },

    showMessage(message, type) {
        const container = document.querySelector('main');
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;
        container.insertBefore(messageDiv, container.firstChild);

        setTimeout(() => messageDiv.remove(), 5000);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
