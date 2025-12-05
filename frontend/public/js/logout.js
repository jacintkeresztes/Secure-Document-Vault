localStorage.removeItem('token');

setTimeout(() => {
    window.location.href = '/';
}, 1500);