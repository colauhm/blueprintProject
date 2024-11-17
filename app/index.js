const dropZone = document.getElementById('drop-zone');
const fileList = document.getElementById('file-list');
const webcamToggle = document.getElementById('webcam-toggle');
const detectionToggle = document.getElementById('detection-toggle');
const webcam = document.getElementById('webcam');
const webcamStatus = document.getElementById('webcam-status');
let webcamStream = null;

const indexSettiong =  () => {
    webcam.style.display = 'block';
    webcamStatus.textContent = 'Webcam Off';
    webcamToggle.checked = false;
    detectionToggle.disabled = true;
}

// 드래그 앤 드롭 기능
dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = event.dataTransfer.files;
    displayFiles(files);
});

dropZone.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.addEventListener('change', () => {
        displayFiles(fileInput.files);
    });
    fileInput.click();
});

function displayFiles(files) {
    fileList.innerHTML = ''; // 기존 파일 목록 제거
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm', 'avi']; // 허용되는 확장자

    Array.from(files).forEach(file => {
        const fileExtension = file.name.split('.').pop().toLowerCase(); // 확장자 추출
        //console.log(fileExtension);
        if (validExtensions.includes(fileExtension)) {
            const listItem = document.createElement('div');
            listItem.textContent = file.name;
            fileList.appendChild(listItem);
        } else {
            alert(`유효하지 않은 파일 형태입니다: ${file.name}`);
        }
    });
}


// 웹캠 온/오프 기능
webcamToggle.addEventListener('click', async () => {
    if (webcamToggle.checked) {
        // 웹캠 켜기
        try {
            webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
            webcam.srcObject = webcamStream;
            webcam.style.display = 'block';
            webcamStatus.textContent = 'Webcam On';
            detectionToggle.disabled = false;
        } catch (error) {
            alert('Error accessing webcam: ' + error.message);
            webcamToggle.checked = false; // 에러 시 스위치 상태 복구
        }
    } else {
        // 웹캠 끄기
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            webcamStream = null;
        }
        detectionToggle.checked = false;
        detectionToggle.disabled = true;
        //webcam.style.display = 'none';
        webcamStatus.textContent = 'Webcam Off';
    }
});

indexSettiong();