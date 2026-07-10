FROM python:3.12-slim

WORKDIR /app

RUN pip install uv --no-cache-dir

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-cache

COPY src/ src/

RUN uv run python -c "from deepface import DeepFace; import numpy as np; DeepFace.represent(np.zeros((224, 224, 3), dtype=np.uint8), model_name='Facenet512', detector_backend='retinaface', enforce_detection=False)"

EXPOSE 8000

ENV PYTHONUNBUFFERED=1

CMD ["sh", "-c", "uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
