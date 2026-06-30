# WalkWars

A location-based competitive fitness platform: track walks via GPS, visualize routes on a map, and compete on leaderboards.

## Tech Stack

- **Frontend:** React, Vite, React Router, Leaflet, Tailwind CSS, Axios
- **Backend:** Spring Boot 3.3, Spring Security, JWT, JPA
- **Database:** PostgreSQL 15+ with PostGIS

## Quick Start

### 1. Start PostgreSQL + PostGIS

```bash
docker compose up -d
```

### 2. Start Backend

```bash
cd backend
mvn spring-boot:run
```

API runs at `http://localhost:8080/api`

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Phase 1 Features

- User registration and JWT authentication
- GPS walk tracking in the browser
- Walk history with route maps (OpenStreetMap + Leaflet)
- Personal dashboard and profile stats
- Distance-based leaderboard

## Project Structure

```
walkwars/
├── backend/          # Spring Boot REST API
├── frontend/         # React SPA
├── database/         # Reference SQL (migrations live in backend)
├── docker-compose.yml
└── docs/             # Product specs (from context package)
```

## Environment

| Variable | Default |
|----------|---------|
| `JWT_SECRET` | Set in `application.properties` for dev |
| `VITE_API_BASE_URL` | `http://localhost:8080/api` |

## Specs

See `docs/` for PRD, API spec, database schema, and architecture documents.
