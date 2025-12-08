// Send logout request to backend
const refreshToken = localStorage.getItem('refreshToken');

if (refreshToken) {
    fetch('https://localhost:3000/api/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
    }).catch(error => console.error('Logout error:', error));
}

// Remove tokens from localStorage
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');

setTimeout(() => {
    window.location.href = '/';
}, 1500);