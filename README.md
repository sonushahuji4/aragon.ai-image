# aragon.ai-image# 📸 Aragon.ai Image Upload – Full Stack

> An end-to-end image upload and validation platform that replicates Aragon.ai's **"Upload photos"** experience — users drag & drop photos, the backend validates them (blur, face detection, similarity, format), and real-time results are pushed back to the UI via WebSocket.

---

## 📂 Project Structure

```
aragon.ai-image/
├── frontend/        # React app — upload UI, previews, real-time status
│   └── README.md   ← frontend docs
├── backend/         # Node.js API — validation pipeline, S3 storage, BullMQ workers
│   └── README.md   ← backend docs
└── README.md        # ← you are here
```

---

## 📖 Module READMEs

| Module | Description | Docs |
|---|---|---|
| 🖥️ **Frontend** | React · Tailwind CSS · Socket.io Client | [frontend/README.md](./frontend/README.md) |
| ⚙️ **Backend** | Node.js · Express · BullMQ · PostgreSQL · S3 | [backend/README.md](./backend/README.md) |

---

## 🧱 System Overview

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                                                         │
│   ┌─────────────┐         ┌────────────────────────┐   │
│   │  Upload UI  │──POST──▶│  REST API (Express)    │   │
│   │  (React)    │◀─WS─────│  + WebSocket (Socket.io│   │
│   └─────────────┘         └──────────┬─────────────┘   │
└──────────────────────────────────────│─────────────────┘
                                       │
                          ┌────────────▼─────────────┐
                          │     BullMQ Worker         │
                          │  (validation pipeline)    │
                          │                           │
                          │  ① Format & Resolution    │
                          │  ② Blur Detection         │
                          │  ③ Face Detection         │
                          │  ④ Similarity (pHash)     │
                          │  ⑤ HEIC → JPEG            │
                          └────────────┬─────────────┘
                                       │
                     ┌─────────────────┼──────────────┐
                     ▼                 ▼              ▼
               PostgreSQL           Redis           AWS S3
              (image records)    (job queue)    (file storage)
```

---

## ✨ Key Features

| Feature | Frontend | Backend |
|---|---|---|
| Drag & drop upload (up to 10 images) | ✅ | |
| Client-side file type validation | ✅ | |
| Real-time status via WebSocket | ✅ | ✅ |
| Format validation (JPEG, PNG, HEIC) | | ✅ |
| Blur detection | | ✅ |
| Face detection (single face required) | | ✅ |
| Similarity check (pHash dedup) | | ✅ |
| HEIC → JPEG auto-conversion | | ✅ |
| S3 / MinIO file storage | | ✅ |
| Async processing with BullMQ | | ✅ |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and npm
- **PostgreSQL**
- **Redis**
- **AWS S3** bucket — or **MinIO** for local development
- *(Optional)* Docker for Postgres + Redis + MinIO in one command

---

### 1 · Clone the Repository

```bash
git clone https://github.com/your-org/aragon.ai-image.git
cd aragon.ai-image
```

---

### 2 · Set Up & Start the Backend

```bash
cd backend
npm install
# configure your .env (see backend/README.md)
npm run dev:api      # Terminal 1 — API server
npm run dev:worker   # Terminal 2 — validation worker
```

📄 Full backend setup guide → [backend/README.md](./backend/README.md)

---

### 3 · Set Up & Start the Frontend

```bash
cd frontend
npm install
# configure your .env (see frontend/README.md)
npm start
```

📄 Full frontend setup guide → [frontend/README.md](./frontend/README.md)

---

### 4 · Open the App

```
http://localhost:3000
```

Make sure the backend is running first — the frontend depends on it for uploads and WebSocket events.

---

## ⚙️ Tech Stack at a Glance

### Frontend
| | |
|---|---|
| Framework | React 18 |
| Styling | Tailwind CSS v3 |
| HTTP Client | Axios |
| Real-time | Socket.io Client |
| State | React Context + useReducer |

### Backend
| | |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 5 |
| Database | PostgreSQL 15 + Sequelize 6 |
| Queue | BullMQ + Redis |
| Storage | AWS S3 (SDK v3) / MinIO |
| Real-time | Socket.io |
| Image Processing | sharp, heic-decode, face-api |

---

## 🌍 Environment Variables

Each module has its own `.env` file — neither is committed to Git.

| File | Docs |
|---|---|
| `backend/.env` | [backend/README.md → Environment Variables](./backend/README.md#2--environment-variables) |
| `frontend/.env` | [frontend/README.md → Environment Variables](./frontend/README.md#3--environment-variables) |

---

## 📝 Notes

- Run the **backend first** — the frontend will fail to upload without it.
- The **worker** must also be running separately — images stay `PENDING` forever without it.
- `.env` files are git-ignored in both modules — never commit secrets.
- The frontend uses a **hardcoded demo `userId`** — replace with your auth system for production.

---

<p align="center">Made with ❤️ using React · Node.js · BullMQ · PostgreSQL · Socket.io · AWS S3</p>