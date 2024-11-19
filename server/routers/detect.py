from fastapi import File, UploadFile, APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import cv2
import numpy as np
import torch
import os

model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
router = APIRouter(prefix="/api")

class detectData(BaseModel):
    type : str
    fileName : str


@router.post("/detect_frame/")
async def upload_frame(data:detectData):
    """
    클라이언트에서 업로드한 프레임에서 객체 탐지를 수행합니다.
    """
    try:
     
        if data.type == 'webcam':
            pass
        else:
            
            BEFORE_DETECT_FOLDER = "./before_detect"
            AFTER_DETECT_FOLDER = "./after_detect"

            os.makedirs(AFTER_DETECT_FOLDER, exist_ok=True)  # 폴더가 없으면 생성
            os.makedirs(BEFORE_DETECT_FOLDER, exist_ok=True)  # 폴더가 없으면 생성

            detect_file_path = os.path.join(AFTER_DETECT_FOLDER, data.fileName)
            file_path =  os.path.join(BEFORE_DETECT_FOLDER, data.fileName)
            if not os.path.exists(file_path):
                return JSONResponse({"error": f"File not found: {file_path}"}, status_code=404)
                
            if data.type == 'image':
                # 이미지 파일 처리
                frame = cv2.imread(file_path)
                if frame is None:
                    return JSONResponse({"error": f"Cannot read image file: {file_path}"}, status_code=400)

                # YOLO 모델 객체 탐지
                results = model(frame)

                # 탐지 결과 처리
                detections = results.pandas().xyxy[0].to_dict(orient="records")

                # 탐지 결과 이미지 생성
                detection_img = np.squeeze(results.render())

                # 결과 이미지 저장
                cv2.imwrite(detect_file_path, detection_img)

                return JSONResponse({"detections": detections, "saved_path": detect_file_path})

            elif data.type == 'video':
                # 비디오 파일 처리
                cap = cv2.VideoCapture(file_path)
                if not cap.isOpened():
                    return JSONResponse({"error": f"Cannot read video file: {file_path}"}, status_code=400)

                # 비디오 속성 가져오기
                frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                fps = int(cap.get(cv2.CAP_PROP_FPS))

                # 출력 비디오 경로
                out = cv2.VideoWriter(
                    detect_file_path,
                    cv2.VideoWriter_fourcc(*"mp4v"),
                    fps,
                    (frame_width, frame_height)
                )

                detections_list = []

                while cap.isOpened():
                    ret, frame = cap.read()
                    if not ret:
                        break

                    # YOLO 모델로 객체 탐지
                    results = model(frame)
                    detections = results.pandas().xyxy[0].to_dict(orient="records")
                    detections_list.append(detections)

                    # 탐지 결과를 프레임에 시각화
                    detection_frame = np.squeeze(results.render())
                    out.write(detection_frame)

                cap.release()
                out.release()

                return JSONResponse({
                    "detections": detections_list,
                    "video_path": detect_file_path
                })

            else:
                return JSONResponse({"error": "Unsupported type. Use 'image' or 'video'."}, status_code=400)

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)