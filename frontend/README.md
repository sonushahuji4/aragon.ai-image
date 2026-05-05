# 📸 Aragon.ai Image Upload – Frontend

> A React application that replicates Aragon.ai's **"Upload photos"** step — drag & drop or browse images, preview them, and track real-time validation statuses delivered by the backend.

---

## Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [How It Works](#-how-it-works)
- [Backend Integration](#-integration-with-the-backend)
- [Testing the Upload Flow](#-testing-the-upload-flow)
- [Available Scripts](#-available-scripts)
- [Notes](#-notes)

---

## ✨ Features

| # | Feature | Detail |
|---|---|---|
| 1 | **Drag & Drop / Browse** | Upload up to 10 images at once |
| 2 | **Client-side Validation** | Accepts JPEG, PNG, HEIC, and WEBP before hitting the server |
| 3 | **Live Previews** | Thumbnails with status overlays — pending, processing, accepted, rejected |
| 4 | **Real-time Updates** | Status changes pushed instantly via WebSocket (Socket.io) |
| 5 | **Responsive Design** | Layout closely mirrors Aragon.ai's upload UI |
| 6 | **State Management** | React Context + `useReducer` — no external state library needed |

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Styling | Tailwind CSS v3 |
| HTTP Client | Axios |
| Real-time | Socket.io Client |
| State Management | React Context + useReducer |
| Build Tool | Create React App (react-scripts) |

---

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html                   # HTML template
├── src/
│   ├── components/                  # Reusable UI components
│   │   ├── Header.jsx               # Top bar with logo, progress bar, close button
│   │   ├── UploadZone.jsx           # Drag & drop / browse upload area
│   │   ├── MobileUpload.jsx         # QR code placeholder for mobile upload
│   │   ├── ImagePreview.jsx         # Single image thumbnail with status overlay
│   │   ├── UploadedPhotos.jsx       # Accordion — accepted, rejected, processing images
│   │   ├── PhotoRequirements.jsx    # Expandable "Photo Requirements" section
│   │   ├── PhotoRestrictions.jsx    # Expandable "Photo Restrictions" section
│   │   ├── ProgressBar.jsx          # Progress bar with "Minimum 6 photos" marker
│   │   └── BottomBar.jsx            # Sticky bottom "Continue" button
│   ├── context/
│   │   └── UploadContext.jsx        # Global state (React Context + useReducer)
│   ├── hooks/
│   │   ├── useImageUpload.js        # Orchestrates upload flow & WebSocket updates
│   │   └── useWebSocket.js          # Socket.io connection management
│   ├── services/
│   │   └── api.js                   # Axios helper for backend REST calls
│   ├── styles/
│   │   └── index.css                # Tailwind directives + custom scrollbar
│   ├── App.jsx                      # Main application layout
│   └── index.js                     # React entry point
├── .env                             # Environment variables (git-ignored)
├── .gitignore
├── package.json
├── postcss.config.js
└── tailwind.config.js
```

---

## 🚀 Quick Start

### 1 · Prerequisites

- **Node.js** v18+ and npm
- The **backend must be running** (API server + worker) — see the [backend README](../backend/README.md)

---

### 2 · Install Dependencies

```bash
cd frontend
npm install
```

---

### 3 · Environment Variables

Create a `.env` file in the `frontend/` root:

```env
# ── API ───────────────────────────────────
REACT_APP_API_URL=http://localhost:5000/api

# ── WebSocket ─────────────────────────────
REACT_APP_WS_URL=http://localhost:5000
```

> If you skip this file, the app will fall back to these same default values automatically.

---

### 4 · Start the Development Server

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:5000/api` | Base URL for the backend REST API |
| `REACT_APP_WS_URL` | `http://localhost:5000` | WebSocket server URL (Socket.io) |

### Tailwind CSS

The project uses **Tailwind CSS v3** with custom colours and fonts matching Aragon.ai's design system. Configuration lives in `tailwind.config.js`.

---

## 🧠 How It Works

```
User drops images
       │
       ▼
Files added to UploadContext state (previewed instantly)
       │
       ▼
User clicks "Continue"
       │
       ▼
POST /api/images/upload  →  backend returns image IDs (status: PENDING)
       │
       ▼
Frontend subscribes to WebSocket room (by userId)
       │
       ▼
Worker validates each image in the background
       │
       ▼
Backend emits `imageStatus` event  →  frontend updates UI in real time
       │
       ├── ✅ ACCEPTED  →  green border + checkmark
       ├── ❌ REJECTED  →  red border + rejection reason
       └── ⏳ PROCESSING →  spinning indicator
```

### Image Status Groups

| Status | Visual Treatment |
|---|---|
| **Accepted** | Green border, checkmark icon |
| **Rejected** | Red border, reason text displayed |
| **Processing** | Spinning loading indicator |

---

## 🔌 Integration with the Backend

### REST Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/images/upload` | Upload multiple images |
| `GET` | `/api/images/:id/status` | Poll processing status of a single image |
| `GET` | `/api/images/:id/file` | Get a presigned URL for an accepted image |
| `GET` | `/api/images/user/:userId` | List all images for a user |

### WebSocket Events

| Direction | Event | Payload |
|---|---|---|
| Client → Server | `subscribe` | `userId` (string) |
| Server → Client | `imageStatus` | `{ imageId, status, reason }` |

---

## 🧪 Testing the Upload Flow

1. Make sure the **backend API and worker** are both running (see the backend README).

2. Start the frontend:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) and **drag & drop or browse** 6–10 test images.

4. Click **Continue** to trigger the upload.

5. Watch images move between **Processing → Accepted / Rejected** in real time.

6. Click any accepted image to open its presigned download URL.

---

## 🛠️ Available Scripts

| Command | Description |
|---|---|
| `npm start` | Runs the app in development mode at `http://localhost:3000` |
| `npm run build` | Builds the app for production into the `build/` folder |
| `npm test` | Runs the test runner (configured with react-scripts) |
| `npm run eject` | Ejects the CRA configuration *(irreversible)* |

---

## 📝 Notes

- The **Continue button is disabled** until at least **6 images** are loaded, mirroring Aragon.ai's requirement.
- The **progress bar** shows the current image count against the minimum (6) and maximum (10) limits.
- The **Uploaded Photos** section is an accordion that expands to show grouped accepted/rejected images.
- Images are held **in memory** until the user clicks Continue — nothing is sent to the server before that.
- The frontend currently uses a **hardcoded demo `userId`**. For production, replace this with your authentication system.

---

<p align="center">Made with ❤️ using React · Tailwind CSS · Socket.io · Axios</p>