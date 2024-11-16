const dropZone = document.getElementById('drop-zone');
const fileList = document.getElementById('file-list');

// 드래그 오버 이벤트 처리
dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('drag-over');
});

// 드래그가 영역을 벗어났을 때
dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

// 드롭 이벤트 처리
dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = event.dataTransfer.files;
    displayFiles(files);
});

// 클릭으로 파일 선택
dropZone.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.addEventListener('change', () => {
        displayFiles(fileInput.files);
    });
    fileInput.click();
});

// 파일 리스트를 표시하는 함수
function displayFiles(files) {
    fileList.innerHTML = ''; // 기존 파일 목록 제거
    Array.from(files).forEach(file => {
        const listItem = document.createElement('div');
        listItem.textContent = file.name;
        fileList.appendChild(listItem);
    });
}
