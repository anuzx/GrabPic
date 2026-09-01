<!-- HERO SECTION -->
<!-- Add your hero image/screenshot here -->
<!-- <img src="your-image-url.png" alt="GrabPic" /> -->

<br />

<div align="center">

# GrabPic

### AI-powered event photo retrieval platform where organizers can upload event photos in bulk and attendees can instantly find photos containing them by uploading a selfie

<br />

<img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=blue" />
<img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/Bun-1.3-000000?logo=bun&logoColor=white" />
<img src="https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/Prisma-7.8-2D3748?logo=prisma&logoColor=white" />
<img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" />
<img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" />
<img src="https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white" />
<img src="https://img.shields.io/badge/FastAPI-0.138-009688?logo=fastapi&logoColor=white" />
<img src="https://img.shields.io/badge/TensorFlow-2.21-FF6F00?logo=tensorflow&logoColor=white" />
<img src="https://img.shields.io/badge/OpenCV-5.0-5C3EE4?logo=opencv&logoColor=white" />
<img src="https://img.shields.io/badge/Cloudinary-2.10-3448C5?logo=cloudinary&logoColor=white" />
<img src="https://img.shields.io/badge/Docker_Compose-2496ED?logo=docker&logoColor=white" />
<img src="https://img.shields.io/badge/Turborepo-2.8-EF4444?logo=turborepo&logoColor=white" />

</div>

---

## Features

- **OAuth Authentication** -- Google and GitHub OAuth2 sign-in with secure JWT tokens
- **Event Management** -- Create, join (via code or QR), and manage photo events
- **Bulk Photo Upload** -- Client-side direct upload to Cloudinary with progress tracking
- **AI Face Recognition** -- Deep learning embeddings via DeepFace + Facenet512 for face matching
- **Instant Face Search** -- Upload a selfie to instantly find all photos containing your face
- **QR Code Integration** -- Generate and scan QR codes to join events
- **Bulk Photo Download** -- Download selected photos as a ZIP archive
- **Dark/Light Theme** -- Smooth circular reveal animation theme toggling
- **Haptic Feedback** -- Configurable vibration patterns for mobile interactions

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 19, Vite 7, Tailwind CSS 4 | UI framework and styling |
| Frontend | Framer Motion, GSAP | Animations and transitions |
| Frontend | Radix UI, shadcn/ui | Accessible UI primitives |
| Backend | Bun, Express 5 | Runtime and HTTP server |
| Backend | Prisma 7, PostgreSQL 16 | ORM and database |
| Backend | Redis 7 | Caching, JWT blacklist, job queues |
| Backend | Cloudinary | Cloud image storage |
| AI Service | Python 3.12, FastAPI | Async web framework |
| AI Service | DeepFace, TensorFlow 2.21 | Face detection and recognition |
| AI Service | pgvector | Vector similarity search |
| Infra | Docker Compose, Turborepo | Containers and monorepo orchestration |

---

## Prerequisites

- **Node.js** >= 18
- **Bun** 1.3.4+
- **Python** 3.12+
- **uv** (Python package manager)
- **Docker** and **Docker Compose**

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/GrabPic.git
cd GrabPic
```

### 2. Start infrastructure (PostgreSQL + Redis)

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16** with pgvector extension on port `5432`
- **Redis 7** on port `6379`

### 3. Install dependencies

```bash
bun install
```

### 4. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials. See [Environment Variables](#environment-variables) for required values.

### 5. Start the services

Open three terminals and run:

```bash
# Terminal 1 - Backend API (port 5000)
bun run api

# Terminal 2 - AI Service (port 8000)
uv run ai

# Terminal 3 - Frontend (port 5173)
cd apps/web && bun run dev
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `JWT_SECRET` | Secret for JWT signing |
| `DATABASE_URL` | PostgreSQL connection string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `REDIS_URL` | Redis connection string |
| `AI_SERVICE_URL` | AI service base URL (default: `http://localhost:8000`) |

Frontend (in `apps/web/.env`):

| Variable | Description |
|----------|-------------|
| `VITE_BACKEND_URL` | Backend API base URL |

---

## Project Structure

```
GrabPic/
├── apps/
│   ├── web/                    # React frontend (Vite + React 19)
│   ├── backend/                # Express API server (Bun)
│   └── ai-service/             # Python FastAPI face recognition
├── packages/
│   ├── db/                     # Shared Prisma database
│   ├── eslint-config/          # Shared ESLint config
│   └── typescript-config/      # Shared TypeScript config
├── docker-compose.yml          # Postgres + Redis
├── turbo.json                  # Turborepo config
└── .env.example                # Environment template
```

---

## License

MIT
