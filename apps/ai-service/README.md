## Api endpoints

1. `POST /process-photos` - Downloads each photo from Cloudinary, runs face detection, stores embeddings
2. `POST /search-face` - Generates embedding from uploaded selfie, does cosine similarity search against event's embeddings
3. `GET /health` - health check of service

## Run docker 

```
docker build -t ai-service apps/ai-service/
docker run -p 8000:8000 --env-file .env ai-service
```
