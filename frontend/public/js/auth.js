// Authenticated fetch with automatic token refresh
async function authFetch(url, options = {}) {
    const accessToken = localStorage.getItem('accessToken');

    // Add Authorization header
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
    };

    let response = await fetch(url, options);

    // If 401, try to refresh token
    if (response.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
            // No refresh token, redirect to login
            window.location.href = '/login';
            throw new Error('No refresh token available');
        }

        // Try to refresh the access token
        const refreshResponse = await fetch('https://localhost:3000/api/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
        });

        if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            localStorage.setItem('accessToken', data.accessToken);

            // Retry original request with new token
            options.headers['Authorization'] = `Bearer ${data.accessToken}`;
            response = await fetch(url, options);
        } else {
            // Refresh failed, redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            throw new Error('Token refresh failed');
        }
    }

    return response;
}
