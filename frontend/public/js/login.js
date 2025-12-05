const loginForm = document.getElementById('form');
const feedback = document.getElementById('feedback');

if (!loginForm || !feedback) {
    console.error('Required elements not found. Please refresh the page.');
    throw new Error('Required elements not found');
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (feedback) feedback.innerHTML = '';

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            feedback.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    <strong>✓ Success!</strong> ${data.message || 'Login successful!'}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;

            if (data.token) localStorage.setItem('token', data.token)

            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            feedback.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <strong>✗ Error ${response.status}:</strong> ${data.message || 'Login failed - Invalid credentials'}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
        }
    } catch (error) {
        // Network error - Red alert
        feedback.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>✗ Network Error:</strong> Failed to connect to server
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        console.error('Login error:', error);
    }
});