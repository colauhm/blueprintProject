# blueprintProject

## 서버실행

uvicorn server.main:app --reload --host=0.0.0.0 --port=8088 

## 웹 실행

python -m http.server 80 -d ./app

## docs페이지(로컬)

localhost:8088/docs