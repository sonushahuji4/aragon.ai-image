# 📦 Image Upload Validation API

> A production-ready, event-driven REST API for uploading, validating, and storing images — built with **Node.js**, **Express**, **BullMQ**, **PostgreSQL**, **Sequelize**, and **Socket.io**.

---

## Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [MinIO Local Setup](#-optional-minio-local-setup-with-docker)
- [API Routes & Testing](#-api-routes--testing)
  - [Upload Images](#1-upload-images)
  - [Check Image Status](#2-check-image-status)
  - [Get Download URL](#3-get-a-downloadable-url)
  - [List User Images](#4-list-all-images-for-a-user)
  - [WebSocket Updates](#-real-time-websocket-updates)
  - [End-to-End Test Script](#-end-to-end-test-script)
- [Design Patterns](#-design-patterns)
- [npm Scripts](#-npm-scripts)
- [Notes](#-notes)

---

## ✨ Features

| # | Feature | Detail |
|---|---|---|
| 1 | **Bulk Upload** | Upload up to 10 images at once via `multipart/form-data` |
| 2 | **Non-blocking** | Instant `202 Accepted` response — processing happens in the background |
| 3 | **Real-time Updates** | Live status pushes via WebSocket (Socket.io) |
| 4 | **Async Processing** | Redis + BullMQ worker queue |
| 5 | **S3 Storage** | AWS S3 or MinIO for local dev |
| 6 | **Clean Architecture** | Repository, Strategy, and Chain of Responsibility patterns |

### Validation Rules

| Rule | Description |
|---|---|
| ❌ Format | Only JPEG, PNG, and HEIC accepted |
| ❌ Resolution | Images below minimum size are rejected |
| ❌ Blur Detection | Variance of Laplacian; blurry images rejected |
| ❌ Face Detection | Rejects images with no face, multiple faces, or a face that is too small |
| ❌ Similarity | Perceptual hash (pHash) prevents near-duplicate uploads |
| ❌ HEIC Conversion | HEIC files are auto-converted to JPEG before processing |

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 5 |
| Database | PostgreSQL 15 |
| ORM | Sequelize 6 |
| Queue | BullMQ + Redis |
| File Storage | AWS S3 (SDK v3) or MinIO |
| Real-time | Socket.io |
| Image Libraries | sharp, heic-decode, @vladmandic/face-api, canvas |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js             # Database connection
│   ├── controllers/
│   │   └── uploadController.js     # Express request handlers
│   ├── middleware/
│   │   └── errorHandler.js         # Global error handler
│   ├── models/
│   │   └── Image.js                # Sequelize model definition
│   ├── repositories/
│   │   └── ImageRepository.js      # Data access layer (Repository pattern)
│   ├── routes/
│   │   └── imageRoutes.js          # API route definitions
│   ├── services/
│   │   ├── ImageValidator.js       # Validation chain orchestrator
│   │   ├── S3Service.js            # S3 upload / download / presigned URLs
│   │   └── SocketService.js        # Socket.io wrapper
│   ├── strategies/
│   │   ├── ValidationStrategy.js   # Base strategy class
│   │   ├── BlurDetectionStrategy.js
│   │   ├── FaceDetectionStrategy.js
│   │   └── SimilarityStrategy.js
│   ├── workers/
│   │   └── imageProcessor.js       # Background job processor
│   └── app.js                      # Express app + Socket.io bootstrap
├── models/
│   └── tiny_face_detector/         # Face-api model weights (auto-download)
├── .env                            # Environment variables (git-ignored)
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### 1 · Prerequisites

Make sure the following are installed and running:

- **Node.js** v18+ and npm
- **PostgreSQL** (local or cloud)
- **Redis** (local or cloud)
- **S3 bucket** — AWS S3, or MinIO for local development
- *(Optional)* **Docker** for a quick Postgres + Redis + MinIO setup

---

### 2 · Environment Variables

Create a `.env` file in the project root:

```env
# ── Database ──────────────────────────────
DB_NAME=image_upload
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# ── Redis ─────────────────────────────────
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# ── AWS / S3  (MinIO-compatible) ──────────
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_BUCKET=images
# AWS_ENDPOINT=http://localhost:9000   ← uncomment for MinIO

# ── Server ────────────────────────────────
PORT=5000
NODE_ENV=development
```

---

### 3 · Install Dependencies

```bash
npm install
```

---

### 4 · Database Setup

```sql
-- run inside psql
CREATE DATABASE image_upload;
```

> Tables are auto-synced on startup via `Sequelize sync({ alter: true })` — no manual migrations needed in development.

---

### 5 · Download Face-api Model Weights

Run **once** from the project root:

```bash
mkdir -p models/tiny_face_detector
cd models/tiny_face_detector

curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
```

---

### 6 · Start the Services

Open **two terminals** and run:

```bash
# Terminal 1 — API server
npm run dev:api

# Terminal 2 — Background worker
npm run dev:worker
```

When everything is running you should see:

```
✔ PostgreSQL Connected
✔ Server running on http://localhost:5000
✔ Worker ready, waiting for jobs…
```

---

## 🔧 (Optional) MinIO Local Setup with Docker

Use MinIO if you don't have an AWS S3 bucket.

**Step 1 — Start MinIO:**

```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  quay.io/minio/minio server /data --console-address ":9001"
```

**Step 2 — Create a bucket** named `images` in the MinIO console at [http://localhost:9001](http://localhost:9001).

**Step 3 — Update `src/services/S3Service.js`:**

```javascript
this.client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT || 'http://localhost:9000', // ← add this
  forcePathStyle: true,                                           // ← required for MinIO
  region: process.env.AWS_REGION,
  credentials: { ... }
});
```

---

## 📡 API Routes & Testing

> **Base URL:** `http://localhost:5000/api/images`  
> All routes are prefixed with `/api/images`.

---

### 1. Upload Images

```
POST /api/images/upload
```

Upload 1–10 images. The server saves them temporarily, creates a `PENDING` record per image, and enqueues a background validation job.

**Request** — `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `images` | File (multiple) | The image files to upload |
| `userId` | String (UUID) | The user performing the upload |

**Example:**

```bash
curl -X POST http://localhost:5000/api/images/upload \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.png" \
  -F "images=@photo3.heic" \
  -F "userId=550e8400-e29b-41d4-a716-446655440000"
```

**Response `202 Accepted`:**

```json
{
  "images": [
    { "imageId": "a1b2c3d4-...", "status": "PENDING", "originalname": "photo1.jpg" },
    { "imageId": "e5f6a7b8-...", "status": "PENDING", "originalname": "photo2.png" },
    { "imageId": "c9d0e1f2-...", "status": "PENDING", "originalname": "photo3.heic" }
  ]
}
```

**Possible errors:**

| Code | Reason |
|---|---|
| `400` | No files attached, or invalid file type |
| `500` | Internal server error (check logs) |

---

### 2. Check Image Status

```
GET /api/images/:id/status
```

Poll the processing status of a previously uploaded image.

**Example:**

```bash
curl http://localhost:5000/api/images/a1b2c3d4-.../status
```

**Responses:**

```json
// While processing
{ "id": "a1b2c3d4-...", "status": "PENDING" }

// Validation passed
{ "id": "a1b2c3d4-...", "status": "ACCEPTED" }

// Validation failed
{ "id": "a1b2c3d4-...", "status": "REJECTED", "reason": "Image is too blurry (Focus Score: 45)" }
```

**Possible rejection reasons:**

| Reason | Cause |
|---|---|
| `"No face detected."` | No face found in image |
| `"Multiple faces detected."` | More than one face present |
| `"Face is too small or too far away."` | Face below minimum size threshold |
| `"Image is too blurry (Focus Score: <n>)"` | Laplacian variance below threshold |
| `"Image is too similar to an already accepted photo."` | pHash Hamming distance < 10 |

---

### 3. Get a Downloadable URL

```
GET /api/images/:id/file
```

Generates a **presigned S3 URL** for the processed image. Only works for `ACCEPTED` images.

**Example:**

```bash
curl http://localhost:5000/api/images/a1b2c3d4-.../file
```

**Response `200 OK`:**

```json
{
  "url": "https://images.s3.us-east-1.amazonaws.com/processed/...?AWSAccessKeyId=..."
}
```

> You can open this URL in a browser to view or download the processed JPEG.

**Error (image not yet accepted):**

```json
{ "error": "Image not yet accepted" }
```

---

### 4. List All Images for a User

```
GET /api/images/user/:userId
```

Returns metadata for **all images** a user has uploaded — including `PENDING`, `ACCEPTED`, and `REJECTED`.

**Example:**

```bash
curl http://localhost:5000/api/images/user/550e8400-e29b-41d4-a716-446655440000
```

**Response `200 OK`:**

```json
[
  {
    "id": "a1b2c3d4-...",
    "userId": "550e8400-...",
    "tempS3Key": "temp/a1b2c3d4-..._photo1.jpg",
    "finalS3Key": null,
    "status": "REJECTED",
    "rejectionReason": "Image is too blurry (Focus Score: 45)",
    "pHash": null,
    "createdAt": "2026-05-05T10:15:30.000Z",
    "updatedAt": "2026-05-05T10:15:35.000Z"
  },
  {
    "id": "e5f6a7b8-...",
    "userId": "550e8400-...",
    "tempS3Key": "temp/e5f6a7b8-..._photo2.png",
    "finalS3Key": "processed/550e8400-.../e5f6a7b8-....jpg",
    "status": "ACCEPTED",
    "rejectionReason": null,
    "pHash": "101010...",
    "createdAt": "2026-05-05T10:16:00.000Z",
    "updatedAt": "2026-05-05T10:16:08.000Z"
  }
]
```

---

### ⚡ Real-time WebSocket Updates

Connect your WebSocket client to `ws://localhost:5000`, then subscribe to a user's room:

**Subscribe event:**

```json
{ "event": "subscribe", "data": "550e8400-e29b-41d4-a716-446655440000" }
```

**Incoming status event:**

```json
{ "event": "imageStatus", "data": { "imageId": "a1b2c3d4-...", "status": "ACCEPTED" } }
```

> Use the Socket.io client library or Postman's WebSocket tab to test this.

---

### 🧪 End-to-End Test Script

Save as `test.sh`, update the file paths, then run `bash test.sh` with both the server and worker running.

```bash
#!/bin/bash

USER_ID="550e8400-e29b-41d4-a716-446655440000"
BASE_URL="http://localhost:5000/api/images"

echo "━━━ 1. Uploading three images ━━━"
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/upload" \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.png" \
  -F "images=@photo3.jpg" \
  -F "userId=$USER_ID")

echo "$UPLOAD_RESPONSE" | jq .

IMAGE_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.images[0].imageId')
echo "→ Using imageId: $IMAGE_ID"

echo -e "\n━━━ 2. Polling status (after 2s) ━━━"
sleep 2
curl -s "$BASE_URL/$IMAGE_ID/status" | jq .

echo -e "\n━━━ 2. Polling status (after 5s more) ━━━"
sleep 5
curl -s "$BASE_URL/$IMAGE_ID/status" | jq .

echo -e "\n━━━ 3. Fetching download URL ━━━"
curl -s "$BASE_URL/$IMAGE_ID/file" | jq .

echo -e "\n━━━ 4. Listing all images for user ━━━"
curl -s "$BASE_URL/user/$USER_ID" | jq .
```

> **Requires** [`jq`](https://stedolan.github.io/jq/) for JSON pretty-printing.

---

## 🧠 Design Patterns

| Pattern | Implementation | Purpose |
|---|---|---|
| **Repository** | `ImageRepository.js` | Abstracts all DB queries — swap the ORM by editing one file |
| **Strategy** | `strategies/` directory | Each validation rule is an isolated, swappable class |
| **Chain of Responsibility** | `ImageValidator.js` | Runs strategies in sequence; fails fast on first rejection |
| **Observer / Pub-Sub** | BullMQ + Socket.io | Decouples upload from processing; pushes live updates to clients |

---

## 📦 npm Scripts

| Script | Command | Description |
|---|---|---|
| `start` | `node src/app.js` | Start API server (no hot-reload) |
| `dev:api` | `nodemon src/app.js` | Start API with auto-restart |
| `worker` | `node src/workers/imageProcessor.js` | Start the job worker |
| `dev:worker` | `nodemon src/workers/imageProcessor.js` | Worker with auto-restart |

---

## 📝 Notes

- **The worker must run separately.** Without it, all images stay `PENDING` forever.
- **HEIC images** are automatically converted to JPEG before validation and storage.
- **Similarity check** compares a new image's pHash against all `ACCEPTED` images for that user. A Hamming distance `< 10` triggers a rejection.
- **Temp files are always cleaned up** from S3 after processing, whether the image is accepted or rejected.

---

<p align="center">Made with ❤️ using Node.js · Express · BullMQ · PostgreSQL · Socket.io</p>