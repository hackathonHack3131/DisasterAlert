# Smart Disaster Alert & Resource Coordination System

Event-driven disaster response platform with realtime WebSocket alerts, OTP authentication, organisation relief network, shelter coordination, and cinematic Earth scroll landing page.

## Stack

- **Frontend:** React, Vite, Tailwind CSS, GSAP, Mapbox, STOMP WebSocket
- **Backend:** Java 17, Spring Boot 3, Spring Security (JWT), MongoDB, WebSocket
- **Deploy:** Docker Compose (local), Vercel + Render + MongoDB Atlas (production)

## Quick Start (Development)

### 1. MongoDB

```bash
docker run -d -p 27017:27017 --name disaster-mongo mongo:7
```

Or use MongoDB Atlas and set `MONGODB_URI`.

### 2. Backend

```bash
cd backend
export MONGODB_URI=mongodb://localhost:27017/disaster_db
export JWT_SECRET=disaster-platform-super-secret-key-change-in-production-min-32-chars
# Optional for real emails:
# export GMAIL_USER=you@gmail.com
# export GMAIL_APP_PASSWORD=xxxx
mvn spring-boot:run
```

API: http://localhost:8080

**Demo accounts (auto-seeded):**
- Admin: `admin` / `admin123`
- Organisation: `relief@demo.org` / `org123`

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Add VITE_MAPBOX_TOKEN from https://account.mapbox.com/
npm install
npm run dev
```

App: http://localhost:5173

## Docker (full stack)

```bash
cp .env.example .env
# Add GMAIL_* if you want real OTP emails
docker compose up --build
```

- Frontend: http://localhost
- Backend: http://localhost:8080

## Hackathon Demo Flow

1. Open landing → scroll Earth cinematic sequence
2. Login as `admin` / `admin123` → Dashboard
3. Click **Simulate FLOOD** → alerts, shelters activate, WebSocket updates
4. Open org login `relief@demo.org` / `org123` → see rescue requests
5. Citizen signup with OTP (requires Gmail env) or use admin flow

## Event-Driven Core

All sources normalize to `DisasterEvent` → `processEvent()`:

1. Save disaster
2. Broadcast `/topic/alerts`
3. Email users (if Gmail configured)
4. Activate nearby shelters
5. Assign volunteers
6. Match organisations geospatially

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Start signup, send OTP |
| `POST /api/auth/verify-otp` | Complete signup, get JWT |
| `POST /api/auth/login` | Citizen login |
| `POST /api/org/auth/register` | Organisation signup |
| `POST /api/events/simulate` | Admin disaster drill |
| `GET /api/public/organisations` | Homepage org cards |
| `GET /api/public/stats` | Live stats |
| WebSocket `/ws` | STOMP topics: alerts, shelters, rescue |

## Project Structure

```
disaster-management-system/
├── backend/          Spring Boot API
├── frontend/         React app + earth-frames/
├── docker-compose.yml
├── docs/
└── README.md
```

## Environment Variables

See `.env.example` and `frontend/.env.example`.

## Deployment

- **Frontend:** Vercel — set `VITE_API_URL`, `VITE_WS_URL`, `VITE_MAPBOX_TOKEN`
- **Backend:** Render/Railway — set `MONGODB_URI`, `JWT_SECRET`, `GMAIL_*`, `CORS_ORIGINS`
- **DB:** MongoDB Atlas
