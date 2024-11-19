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

dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        uploadAndPreview(files[0]); // 첫 번째 파일만 처리
    }
});

dropZone.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*'; // 이미지 파일만 선택 가능
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            uploadAndPreview(fileInput.files[0]); // 첫 번째 파일만 처리
        }
    });
    fileInput.click();
});

async function uploadAndPreview(file) {
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif']; // 허용되는 이미지 확장자
    const fileExtension = file.name.split('.').pop().toLowerCase(); // 확장자 추출

    if (validExtensions.includes(fileExtension)) {
        try {
            // FormData 객체 생성
            const formData = new FormData();
            formData.append('file', file);

            // 서버로 파일 업로드
            const response = await fetch(`${serverUrl}/upload/`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`업로드 실패: ${file.name}`);
            }

            // 업로드 성공 시 서버 응답 처리
            const result = await response.json();

            // 파일 업로드 영역 숨기기
            dropZone.style.display = 'none';

            // 미리보기 이미지와 새로고침 버튼 생성
            const previewContainer = document.createElement('div');
            previewContainer.style.display = 'flex';
            previewContainer.style.alignItems = 'center';
            previewContainer.style.gap = '10px';

            // 미리보기 이미지
            const previewImage = document.createElement('img');
            previewImage.src = URL.createObjectURL(file); // 업로드된 파일 로컬 미리보기
            previewImage.style.width = '100px'; // 이미지 크기를 작게 설정
            previewImage.style.height = '100px';
            previewImage.style.objectFit = 'cover';
            previewImage.style.border = '1px solid #ddd';

            // 새로고침 버튼
            const refreshButton = document.createElement('button');
            refreshButton.textContent = '새로고침';
            refreshButton.style.padding = '10px';
            refreshButton.style.backgroundColor = '#007bff';
            refreshButton.style.color = '#fff';
            refreshButton.style.border = 'none';
            refreshButton.style.borderRadius = '5px';
            refreshButton.style.cursor = 'pointer';

            // 새로고침 버튼 클릭 이벤트
            refreshButton.addEventListener('click', () => {
                // 파일 업로드 영역 다시 표시
                dropZone.style.display = 'flex'; // 중앙 정렬을 위해 'flex'로 설정
                dropZone.classList.remove('drag-over'); // 드래그 상태 초기화
            
                // 미리보기 제거
                fileList.innerHTML = '';
            });

            // 미리보기 컨테이너에 추가
            previewContainer.appendChild(previewImage);
            previewContainer.appendChild(refreshButton);

            // 파일 리스트에 추가
            fileList.innerHTML = ''; // 기존 내용 제거
            fileList.appendChild(previewContainer);

        } catch (error) {
            alert(`파일 업로드 중 오류가 발생했습니다: ${file.name}, 오류: ${error.message}`);
        }
    } else {
        alert(`유효하지 않은 파일 형태입니다: ${file.name}`);
    }
}

indexSettiong();
