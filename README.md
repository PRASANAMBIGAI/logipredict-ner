# AI-Based Smart Logistics and Accessibility Intelligence Platform for NER

A hackathon prototype for predictive logistics and real-time accessibility monitoring, tailored for the North Eastern Region of India. Features real-time AI risk scoring, dynamic rerouting with NetworkX, and an offline-capable field reporting web app.

Styled with a premium "LogiPredict AI" aesthetic.

## Tech Stack
- **Frontend**: React + Vite + TailwindCSS + Leaflet + Recharts
- **Backend**: Python FastAPI + SQLite
- **Real-Time**: WebSockets
- **Pathfinding**: NetworkX (Dijkstra)

## Running Locally

### Backend Setup
1. Open a terminal and navigate to the `backend` folder.
2. Activate the virtual environment: `.\venv\Scripts\activate` (Windows)
3. The database is already seeded. (To re-seed, run `python seed.py`)
4. Start the server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend runs on `http://127.0.0.1:8000`.

### Frontend Setup
1. Open a new terminal and navigate to the `frontend` folder.
2. Install dependencies (if not already installed): `npm install`
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The frontend runs on `http://localhost:5173`.

---

## 🚀 Demo Script (For the Jury)

This script demonstrates the end-to-end functionality, particularly the offline-first field reporting and the real-time AI risk and routing updates.

1. **Open the Dashboard**: Navigate to `http://localhost:5173/dashboard`.
   - Show the GIS map (dark mode). Observe the road segments, their risk colors, and existing mock vehicles/incidents.
2. **Open the Field App**: Navigate to `http://localhost:5173/field` (simulate a mobile view if possible using browser dev tools).
3. **Simulate Offline Mode**: 
   - Open browser DevTools (F12) -> Network tab -> Change throttling to "Offline".
   - Notice the UI updates to show an offline warning banner.
4. **Submit a Field Report**:
   - Select "Shillong-Silchar Route".
   - Select Incident Type: "Landslide", Severity: "Blocked".
   - Click "Submit Report".
   - *Observe*: The report is saved locally into the "Queued Reports" list.
5. **Simulate Coming Online**:
   - Go back to Network tab and change throttling back to "No throttling".
   - Notice the app immediately detects the connection and auto-syncs the queued report to the backend.
6. **Watch the Real-Time Magic (Back on Dashboard)**:
   - Look at the dashboard. You do not need to refresh.
   - The map segment color for "Shillong-Silchar Route" will dynamically turn red.
   - A new "CRITICAL_RISK" alert will instantly appear in the Intelligence Stream on the right.
7. **Dynamic Rerouting**:
   - In the Route Planner widget, select Origin: "Shillong" and Destination: "Imphal" (or Aizawl).
   - Click "Optimize Route".
   - *Observe*: The AI routing engine avoids the now blocked/high-risk "Shillong-Silchar" segment and recommends an alternate path, warning the user about the blockade.
