# Project State: WalkWars

This document holds the active development context of **WalkWars** for other AI agents, CLI systems, or external editors.

---

## 🏗️ Architecture & Deployment

### Development Environment (Local)
We run a multi-container Docker Compose setup (`docker-compose.yml`) bound to host interfaces and routed through an automated ngrok tunnel:
* **db:** PostGIS 16 database (Host Port: 5433, Internal Port: 5432).
* **backend:** Spring Boot REST API (Port: 8080).
* **frontend:** Vite Dev Server (React + Tailwind) on port 5173 (with local HMR mounts).

### Production Environment (VPS)
Deployed on an Ubuntu 24.04 VPS at **`203.57.85.139`** under the domain **`freelogic.in`**:
* **Root Domain (`freelogic.in/`):** Serves static portfolio pages (cloned from `freelogic99.github.io` repo) via Nginx.
* **App URL (`freelogic.in/walkwars`):** Serves the built static assets of the React frontend, configured with a dynamic Vite base path `/walkwars/` and React Router `basename="/walkwars"`.
* **API Proxy (`freelogic.in/api/`):** Nginx reverse proxies API traffic directly to the Spring Boot container running internally on port `8080` (configured with relative `baseURL: '/api'`).
* **SSL:** Handled on the host Nginx server block using a Certbot Let's Encrypt daemon.
* **Production Docker Compose (`docker-compose.prod.yml`):** Runs only the database and the backend containers, bound strictly to `127.0.0.1` interfaces for security.

### Active Web IDE Access
* **code-server:** Accessible over Tailscale at `http://100.65.177.81:8085` (Password: `4647`).

---

## 🛠️ Work Done & Issues Resolved

### 1. html2canvas OKLCH/OKLAB Color Rendering Crash
* **Issue:** The completed walk Share Card failed to download because `html2canvas` crashed when attempting to parse modern Tailwind v4/DaisyUI computed CSS colors (`oklch()` and `oklab()`).
* **Fix:** Added custom mathematical conversion parsers (`oklchToRgb` and `oklabToRgb`) in [ShareCard.jsx](file:///home/srikar/walkwars/walkwars/frontend/src/components/walk/ShareCard.jsx). Intercepted `window.getComputedStyle` and `getPropertyValue` during capture execution to dynamically swap `oklch`/`oklab` values with standard sRGB `rgb`/`rgba` strings.

### 2. Hibernate Delete Order Constraint Violation
* **Issue:** When importing local guest walks after logging in, the sync failed with a `uq_walks_one_active_per_user` database unique constraint violation. Although `WalkService.importWalk` deleted any existing active walk before saving the imported one, Hibernate's default query scheduler executes `INSERT` statements *before* `DELETE` statements at transaction flush time.
* **Fix:** Added `walkRepository.flush()` immediately after the `delete(w)` invocation in [WalkService.java](file:///home/srikar/walkwars/walkwars/backend/src/main/java/com/walkwars/service/WalkService.java). This forces Hibernate to synchronise the SQL `DELETE` query to PostgreSQL before the new `ACTIVE` walk `INSERT` is evaluated.

### 3. PostGIS Hexadecimal Geometry Parsing Failure
* **Issue:** Walk completions failed with a PostGIS database geometry parse error: `invalid geometry - Hint: "01" <-- parse error`. Casting the database geometry to text (`path_geom::text` or `polygon_geom::text`) returned a WKB hex string, which could not be parsed by `ST_GeomFromText()`.
* **Fix:** Replaced the `::text` casts in [GisRepository.java](file:///home/srikar/walkwars/walkwars/backend/src/main/java/com/walkwars/repository/GisRepository.java) with explicit **`ST_AsText(geom)`** functions. This returns standard WKT representations that parse successfully.

### 4. Dynamic Subfolder Routing & API Proxies
* **Issue:** The app needed to support subfolder hosting (`freelogic.in/walkwars`) alongside the main portfolio page.
* **Fix:** 
  * Updated [vite.config.js](file:///home/srikar/walkwars/walkwars/frontend/vite.config.js) to set `base: mode === 'production' ? '/walkwars/' : '/'`.
  * Configured dynamic `basename` in React Router's `<BrowserRouter>` inside [App.jsx](file:///home/srikar/walkwars/walkwars/frontend/src/App.jsx).
  * Refactored [axiosClient.js](file:///home/srikar/walkwars/walkwars/frontend/src/api/axiosClient.js) to use `/api` relative baseUrl in production, and adjusted redirect rules to include the basename.

### 5. Docker Volume Node Modules Ownership Issues
* **Issue:** Host user `srikar` lacked permissions to write inside `frontend/node_modules/` to install dependencies and compile the production build, as the directory was populated as `root` by the Docker container volume.
* **Fix:** Executed `npm run build` directly inside the running `walkwars-frontend-1` container via `docker exec`, compiling the output assets to `frontend/dist/` seamlessly.

### 6. Production DNS & SSL Deployment
* **Objective:** Move domain mapping from GitHub Pages to VPS and secure `freelogic.in` and `www.freelogic.in` with Let's Encrypt HTTPS.
* **Steps Taken:**
  1. **DNS Update in Cloudflare:** Removed old A records and CNAME records pointing to GitHub Pages. Added a new A record for `@` pointing to VPS IP `203.57.85.139` and a CNAME for `www` pointing to `freelogic.in`. Set both to **DNS Only** (Gray Cloud) to allow Let's Encrypt validation.
  2. **Codebase Deployment:** Executed `./deploy.sh` to compile frontend assets, transfer backend and portfolio source code, set up PostgreSQL and Spring Boot production containers via Docker Compose, and reload Nginx.
  3. **SSL Certificate Issuance:** Ran `sudo certbot --nginx -d freelogic.in -d www.freelogic.in --non-interactive --agree-tos -m freelogic.in@gmail.com` on the VPS to obtain Let's Encrypt certificates and automatically secure the Nginx server block on port 443.
  4. **Verification:** Confirmed both the frontend (`/walkwars/`), landing page (`/`), and backend API (`/api/`) are active and responsive over HTTPS.

