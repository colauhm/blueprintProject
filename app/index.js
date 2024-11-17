const serverUrl = "http://localhost:8088/api/upload_frame/";
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
}

// 드래그앤드롭 관련 이벤트
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
        if (validExtensions.includes(fileExtension)) {
            const listItem = document.createElement('div');
            listItem.textContent = file.name;
            fileList.appendChild(listItem);
        } else {
            alert(`유효하지 않은 파일 형태입니다: ${file.name}`);
        }
    });
}

// 웹캠 온/오프 설정
webcamToggle.addEventListener('click', async () => {
    if (webcamToggle.checked) {
        // 웹캠 켜기
        try {
            webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
            webcam.srcObject = webcamStream;

            // 드래그앤드롭 박스 숨기기
            fileConversionBox.style.display = "none";

            // 캔버스 위치 및 크기 설정
            webcam.addEventListener('loadeddata', () => {
                canvas.width = webcam.videoWidth;
                canvas.height = webcam.videoHeight;
                canvas.style.width = `${webcam.offsetWidth}px`;
                canvas.style.height = `${webcam.offsetHeight}px`;
                canvas.style.top = `${webcam.offsetTop}px`;
                canvas.style.left = `${webcam.offsetLeft}px`;
            });

            webcam.style.display = 'block';
            webcamStatus.textContent = 'Webcam On';
            detectionToggle.disabled = false;
        } catch (error) {
            alert('Error accessing webcam: ' + error.message);
            webcamToggle.checked = false;
        }
    } else {
        // 웹캠 끄기
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            webcamStream = null;
        }

        // 드래그앤드롭 박스 표시
        fileConversionBox.style.display = "block";

        detectionToggle.checked = false;
        detectionToggle.disabled = true;
        canvas.style.display = "none"; // 캔버스 숨김
        webcamStatus.textContent = 'Webcam Off';
    }
});

// 탐지 온/오프 설정
detectionToggle.addEventListener('click', () => {
    if (detectionToggle.checked) {
        startStreaming();
    } else {
        stopStreaming();
    }
});

// 프레임 스트리밍 시작
let streamingInterval = null;
function startStreaming() {
    if (webcamStream) {
        canvas.style.display = "block"; // 캔버스 표시

        streamingInterval = setInterval(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);

            // 캔버스 데이터를 Blob 형식으로 추출
            canvas.toBlob(async (blob) => {
                const formData = new FormData();
                formData.append("file", blob, "frame.jpg");
                try {
                    const response = await fetch(serverUrl, {
                        method: "POST",
                        body: formData,
                    });
                    const result = await response.json();

                    // 탐지 결과 시각화
                    displayDetections(result.detections);
                } catch (error) {
                    console.error("Error sending frame to server:", error);
                }
            }, "image/jpeg");
        }, 1000);
    }
}

// 탐지 결과 시각화
function displayDetections(detections) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);

    detections.forEach(detection => {
        const { xmin, ymin, xmax, ymax, confidence, name } = detection;

        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(xmin, ymin, xmax - xmin, ymax - ymin);

        ctx.fillStyle = "red";
        ctx.font = "14px Arial";
        ctx.fillText(`${name} (${(confidence * 100).toFixed(1)}%)`, xmin, ymin - 10);
    });
}

// 프레임 스트리밍 중지
function stopStreaming() {
    if (streamingInterval) {
        clearInterval(streamingInterval);
        streamingInterval = null;

        // 캔버스 숨기기 및 지우기
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = "none";
    }
}
webcam.addEventListener('playing', () => {
    updateCanvasPosition(); // 웹캠이 로드된 후 캔버스 위치 동기화
});

window.addEventListener('resize', () => {
    updateCanvasPosition(); // 창 크기가 변경될 때 캔버스 위치 재조정
});

function updateCanvasPosition() {
    // 웹캠 위치를 기준으로 캔버스 위치 설정
    const webcamRect = webcam.getBoundingClientRect();
    canvas.style.top = `${webcamRect.top}px`;
    canvas.style.left = `${webcamRect.left}px`;

    // 크기도 웹캠과 동기화
    canvas.style.width = `${webcamRect.width}px`;
    canvas.style.height = `${webcamRect.height}px`;

    // 캔버스 내부 크기 설정
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
}
indexSettiong();
