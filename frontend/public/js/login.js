const loginForm = document.getElementById('form');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent page reload

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log('Login attempt: ', {email, password})
    // TODO: send to backend
    
})