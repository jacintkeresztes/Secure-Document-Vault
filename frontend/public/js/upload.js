const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');

uploadBox.addEventListener('click', () => {
    fileInput.click();
})

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
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

    handleFiles(e.dataTransfer.files);
})

function handleFiles(files) {
    fileList.innerHTML = '';

    for (let file of files) {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'alert alert-info';
        fileDiv.innerText = `${file.name} - ${(file.size / 1024).toFixed(2)} KB`;
        fileList.appendChild(fileDiv);
    }
}