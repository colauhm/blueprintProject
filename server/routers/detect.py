from fastapi import File, UploadFile, APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import cv2
import numpy as np
import torch

model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
router = APIRouter(prefix="/api")

@router.post("/detect_frame/")
async def upload_frame(file: UploadFile = File(...)):
    """
    클라이언트에서 업로드한 프레임에서 객체 탐지를 수행합니다.
    """
    try:
        # 파일 내용 읽기
        contents = await file.read()

        # Numpy 배열로 변환
        np_arr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        # YOLO 모델을 사용한 객체 탐지
        results = model(frame)

        # 탐지 결과 처리
        detections = results.pandas().xyxy[0].to_dict(orient="records")  # 탐지 결과를 딕셔너리로 변환

        # 탐지 결과 이미지 생성 (시각화 용도)
        detection_img = np.squeeze(results.render())  # 탐지 결과가 그려진 이미지
        #cv2.imwrite("detected_frame.jpg", detection_img)  # 테스트용으로 이미지 저장

        return JSONResponse({"detections": detections})

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)