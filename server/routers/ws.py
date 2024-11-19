from fastapi import  WebSocket, APIRouter
import cv2
import base64
import asyncio
import torch
import numpy as np
router = APIRouter(prefix="/api")

# 웹캠 연결
model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    cap = cv2.VideoCapture(0)  # 0은 기본 웹캠. 필요시 변경
    await websocket.accept()
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # YOLO 모델로 객체 탐지
            results = model(frame)
            detection_img = np.squeeze(results.render())
            # 이미지를 Base64로 인코딩
            _, buffer = cv2.imencode('.jpg', detection_img)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            # WebSocket으로 프레임 전송
            await websocket.send_text(frame_base64)

            # 약간의 지연 추가 (FPS 조절)
            await asyncio.sleep(0.01)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        cap.release()
