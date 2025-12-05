function updateNavbar() {
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token;

    const navbar = document.querySelector('.navbar-nav');
    const guestView = document.getElementById('guest-view');
    const userView = document.getElementById('user-view');

    if (isLoggedIn) {
        navbar.innerHTML = `
            <a class="nav-link" href="/upload">Upload</a>
            <a class="nav-link" href="/logout">Logout</a>
        `;

        guestView.style.display = 'none';
        userView.style.display = 'block';

        loadFiles();

    } else {
        navbar.innerHTML = `
            <a class="nav-link" href="/register">Register</a>
            <a class="nav-link" href="/login">Login</a>
        `;

        guestView.style.display = 'block';
        userView.style.display = 'none';
    }
}

async function loadFiles() {
    const token = localStorage.getItem('token');
    const tbody = document.querySelector('#user-view tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';

    try {
        const response = await fetch('http://localhost:3000/api/files', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok && data.files) {
            if (data.files.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">No files uploaded yet</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            data.files.forEach(file => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${file.original_name}</td>
                    <td>${(file.size / 1024).toFixed(2)} KB</td>
                    <td>${new Date(file.upload_date).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="downloadFile(${file.id}, '${file.original_name}')">Download</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteFile(${file.id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Failed to load files</td></tr>';
        }
    } catch (error) {
        console.error('Load files error:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Network error - Failed to connect to server</td></tr>';
    }
}

// Download file
async function downloadFile(fileId, fileName) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:3000/api/files/${fileId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            alert('Failed to download file');
        }
    } catch (error) {
        console.error('Download error:', error);
        alert('Network error - Failed to download file');
    }
}

// Delete file
async function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) {
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:3000/api/files/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            alert('File deleted successfully');
            loadFiles(); // Reload the file list
        } else {
            alert(`Failed to delete file: ${data.message}`);
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Network error - Failed to delete file');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavbar);
} else {
    updateNavbar();
}
