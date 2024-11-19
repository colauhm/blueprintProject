const serverUrl = "http://localhost:8088/api";
const dropZone = document.getElementById('drop-zone');
const fileList = document.getElementById('file-list');
const webcamToggle = document.getElementById('webcam-toggle');
const detectionToggle = document.getElementById('detection-toggle');
const webcam = document.getElementById('webcam');
const webcamStatus = document.getElementById('webcam-status');
const fileConversionBox = document.getElementById('file-conversion-box');
let webcamStream = null;

// 캔버스 추가 (웹캠 프레임 처리용)
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.style.position = "absolute";
canvas.style.pointerEvents = "none"; // 클릭 이벤트 무시
canvas.style.zIndex = "1"; // 웹캠 위에 표시
canvas.style.display = "none"; // 초기에는 숨김 처리

const indexSettiong = () => {
    fileConversionBox.style.display = "block";
    webcam.style.display = 'block';
    webcamStatus.textContent = 'Webcam Off';
    webcamToggle.checked = false;
    detectionToggle.disabled = true;
};

// 드래그앤드롭 관련 이벤트
dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', async (event) => {
    event.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const fileType = checkFileType(files[0]);
        await uploadAndPreview(files[0], fileType); // Pass the file type
      
    }
});

dropZone.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,video/*'; // Allow both image and video files
    fileInput.addEventListener('change', async () => {
        if (fileInput.files.length > 0) {
            const fileType = checkFileType(fileInput.files[0]);
            await uploadAndPreview(fileInput.files[0], fileType); 
      
        }
    });
    fileInput.click();
});

// Helper function to check file type
function checkFileType(file) {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    const videoExtensions = ['mp4', 'mov', 'avi', 'webm'];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (imageExtensions.includes(fileExtension)) {
        return 'image';
    } else if (videoExtensions.includes(fileExtension)) {
        return 'video';
    } else {
        alert('Unsupported file type');
        throw new Error('Unsupported file type');
    }
}

async function uploadAndPreview(file, type) {
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm'];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (validExtensions.includes(fileExtension)) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${serverUrl}/upload/`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${file.name}`);
            }

            const result = await response.json();
            dropZone.style.display = 'none';

            // Detect file after successful upload
            await detectFile(type, result.filename);

            // Generate preview, refresh button, and download button after detection
            const previewContainer = document.createElement('div');
            previewContainer.style.display = 'flex';
            previewContainer.style.flexDirection = 'column'; // Stack buttons vertically
            previewContainer.style.alignItems = 'center';
            previewContainer.style.gap = '10px';

            // Generate preview from ./after_detect folder
            const processedFileUrl = `${serverUrl}/after_detect/${result.filename}`;
            if (type === 'image') {
                const previewImage = document.createElement('img');
                previewImage.src = processedFileUrl; // Use processed file for preview
                previewImage.style.width = '100px';
                previewImage.style.height = '100px';
                previewImage.style.objectFit = 'cover';
                previewImage.style.border = '1px solid #ddd';
                previewContainer.appendChild(previewImage);
            } else if (type === 'video') {
                const previewVideo = document.createElement('video');
                previewVideo.src = processedFileUrl; // Use processed file for preview
                previewVideo.controls = true;
                previewVideo.style.width = '200px';
                previewVideo.style.height = '150px';
                previewContainer.appendChild(previewVideo);
            }

            const refreshButton = document.createElement('button');
            refreshButton.textContent = 'Refresh';
            refreshButton.style.padding = '10px';
            refreshButton.style.backgroundColor = '#007bff';
            refreshButton.style.color = '#fff';
            refreshButton.style.border = 'none';
            refreshButton.style.borderRadius = '5px';
            refreshButton.style.cursor = 'pointer';

            refreshButton.addEventListener('click', () => {
                dropZone.style.display = 'flex';
                dropZone.classList.remove('drag-over');
                fileList.innerHTML = '';
                refreshFile(result.filename);
            });

            const downloadButton = document.createElement('a');
            downloadButton.textContent = 'Download Processed File';
            downloadButton.style.padding = '10px';
            downloadButton.style.backgroundColor = '#28a745';
            downloadButton.style.color = '#fff';
            downloadButton.style.textDecoration = 'none';
            downloadButton.style.border = 'none';
            downloadButton.style.borderRadius = '5px';
            downloadButton.style.cursor = 'pointer';
            downloadButton.href = processedFileUrl; // Use processed file for download
            downloadButton.download = result.filename;

            previewContainer.appendChild(refreshButton);
            previewContainer.appendChild(downloadButton);

            fileList.innerHTML = '';
            fileList.appendChild(previewContainer);

        } catch (error) {
            alert(`Error during file upload: ${file.name}, Error: ${error.message}`);
        }
    } else {
        alert(`Invalid file format: ${file.name}`);
    }
}



const detectFile = async (type, filename) => {
    try {
        const response = await fetch(`${serverUrl}/detect_frame/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, fileName: filename }),
        });

        const result = await response.json();
        console.log(result);
    } catch (error) {
        console.error('Error during file detection:', error.message);
    }
};


const refreshFile = async (filename) => {
    try {
        const response = await fetch(`${serverUrl}/delete/${filename}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error: ${errorData.detail || 'Unknown error'}`);
        }

        const result = await response.json();
        alert('Refresh successful');
    } catch (error) {
        console.error('Error during file deletion:', error.message);
        alert(`File deletion failed: ${error.message}`);
    }
};



indexSettiong();
