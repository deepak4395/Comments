// Main application entry point
document.addEventListener('DOMContentLoaded', () => {
    // Initialize authentication
    Auth.init();

    // Initialize comments only after auth is ready
    setTimeout(() => {
        Comments.init();
    }, 100);
});
