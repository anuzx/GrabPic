## Api endpoints

1. `POST /process-photos` - Downloads each photo from Cloudinary, runs face detection, stores embeddings
2. `POST /search-face` - Generates embedding from uploaded selfie, does cosine similarity search against event's embeddings
3. `GET /health`
