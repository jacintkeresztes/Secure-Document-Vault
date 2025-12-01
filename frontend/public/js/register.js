const registerForm = document.getElementById('form');

registerForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent page reload

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log('Register attempt: ', {email, password})
    // TODO: send to backend
    
})