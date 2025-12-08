const registerForm = document.getElementById('form');
const feedback = document.getElementById('feedback');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Clear previous feedback
    feedback.innerHTML = '';

    try {
        const response = await fetch('https://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Success - Green alert
            feedback.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    <strong>✓ Success!</strong> ${data.message || 'Registration successful!'}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;

            // Clear form
            registerForm.reset();
        } else {
            // Error - Red alert
            feedback.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <strong>✗ Error ${response.status}:</strong> ${data.message || 'Registration failed'}
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
        console.error('Registration error:', error);
    }
});