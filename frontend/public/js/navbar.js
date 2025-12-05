// Update navbar based on login status
function updateNavbar() {
    const token = localStorage.getItem('token');
    const navbar = document.querySelector('.navbar-nav');

    if (!navbar) {
        console.error('Navbar not found');
        return;
    }

    if (token) {
        // Logged in: show upload and logout
        navbar.innerHTML = `
            <a class="nav-link" href="/upload">Upload</a>
            <a class="nav-link" href="/logout">Logout</a>
        `;
    } else {
        // Not logged in: show register and login
        navbar.innerHTML = `
            <a class="nav-link" href="/register">Register</a>
            <a class="nav-link" href="/login">Login</a>
        `;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavbar);
} else {
    updateNavbar();
}
