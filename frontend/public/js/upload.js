const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');

uploadBox.addEventListener('click', () => {
    fileInput.click();
})

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 1) {
        alert('Please upload only one file at a time')
        return
    }
    handleFile(e.target.files[0]);
})

uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '#0d6efd';
    uploadBox.style.background = '#e7f3ff';
})

uploadBox.addEventListener('dragleave', () => {
    uploadBox.style.borderColor = '#ccc';
    uploadBox.style.backgroundColor = 'transparent';
})

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '#ccc';
    uploadBox.style.backgroundColor = 'transparent';
    
    if (e.target.files.length > 1) {
        alert('Please upload only one file at a time')
        return
    }
    
    handleFile(e.dataTransfer.files[0]);
})

function handleFile(file) {
    fileList.innerHTML = '';

    const fileDiv = document.createElement('div');
    fileDiv.className = 'alert alert-info';
    fileDiv.innerText = `${file.name} - ${(file.size / 1024).toFixed(2)} KB`;
    fileList.appendChild(fileDiv);

    uploadFile(file, fileDiv);
}

async function uploadFile(file, fileDiv) {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
        fileDiv.className = 'alert alert-danger';
        fileDiv.innerHTML = '<strong>✗ Error:</strong> Please login first';
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
        return;
    }

    const formData = new FormData()
    formData.append('file', file)

    // Show uploading state
    fileDiv.className = 'alert alert-info';
    fileDiv.innerHTML = `<strong>⏳ Uploading:</strong> ${file.name}...`;

    try {
        const response = await authFetch('https://localhost:3000/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            // Success - Green
            fileDiv.className = 'alert alert-success';
            fileDiv.innerHTML = `
                <strong>✓ Success!</strong> ${file.name} uploaded successfully<br>
                <small>File ID: ${data.file.id} | Size: ${(data.file.size / 1024).toFixed(2)} KB</small>
            `;
        } else {
            // Error - Red with details
            fileDiv.className = 'alert alert-danger';
            fileDiv.innerHTML = `
                <strong>✗ Error ${response.status}:</strong> ${file.name} upload failed<br>
                <small>${data.message || 'Unknown error'}</small>
            `;
        }
    } catch (error) {
        // Network error - Red
        fileDiv.className = 'alert alert-danger';
        fileDiv.innerHTML = `
            <strong>✗ Network Error:</strong> ${file.name} upload failed<br>
            <small>Failed to connect to server</small>
        `;
        console.error('Upload error:', error);
    }
}