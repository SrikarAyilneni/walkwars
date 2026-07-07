# Project State: WalkWars

This document holds the active development context of **WalkWars** for other AI agents, CLI systems, or external editors.

---

## 🏗️ Architecture & Deployment

We are running a multi-container Docker Compose setup. All services are bound to the host interfaces and configured to route through a single automated ngrok tunnel.

### Services in `docker-compose.yml`

| Service | Host Port | Internal Port | Details |
| :--- | :--- | :--- | :--- |
| **db** | `5433` | `5432` | PostGIS 16 database. Named volume `walkwars_pgdata` persists tables/geometry. |
| **backend** | `8080` | `8080` | Spring Boot (Java 21) REST API. CORS is patterns-enabled for wildcard dev targets. |
| **frontend** | `5173` | `5173` | Vite Dev Server (React + Tailwind). Serves the map tracking page publicly. |
| **ngrok** | - | - | Auto-tunnels `frontend:5173` to `unbitten-greasily-unwound.ngrok-free.dev`. |

### Active Web IDE Access
* **code-server:** Accessible over Tailscale at `http://100.65.177.81:8085` (Password: `4647`).

---

## 🛠️ Work Done

1. **Local-First Geolocation Tracking:** 
   * Active tracking works on public `/` for guests. Coordinates are cached in `localStorage` in real-time.
   * On login, the dashboard scans `localStorage` and bulk uploads coordinates to `/api/walks/import` in a single transaction.
2. **Upgraded Strava-Style Share Card:**
   * Utilizes CartoDB `dark_nolabels` maps tiles to display clean, label-free road grids.
   * Renders the walk's route using Leaflet's vector `Polyline` with a glowing orange stroke.
   * Automatically displays a pulsing `⚔️ TERRITORY CLAIMED` badge if the walk represents a completed closed-loop territory claim.
   * Leverages `html2canvas` with custom CORS capabilities to capture the map container and compile it into a downloadable `2.5x` resolution PNG.
3. **Map Recentering:**
   * Automatically pans the Leaflet container to the user's live coordinates (Hyderabad) on page load.
4. **Auto-Restarts:**
   * Vite dev configuration features `allowedHosts: true` to support incoming ngrok traffic.
   * Axios configurations automatically inject the `ngrok-skip-browser-warning` header to bypass ngrok free-tier warning landing pages.
