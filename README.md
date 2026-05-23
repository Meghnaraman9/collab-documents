# Collab Documents

A **Real-Time Collaborative Document Editor** — CodTech Internship Task 3.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React.js, React Router, Socket.IO Client, Axios |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MongoDB (Mongoose) |
| Real-time | WebSockets via Socket.IO |

---

## Project Structure

```
collab-documents/
├── backend/
│   ├── models/         # Mongoose Document model
│   ├── routes/         # REST API routes
│   ├── socket/         # Socket.IO event handlers
│   ├── server.js       # Entry point
│   ├── .env.example    # Environment variables
│   └── package.json
└── frontend/
    ├── public/
    └── src/
        ├── components/ # Navbar, DocumentCard, ActiveUsers
        ├── pages/      # Home, Editor
        ├── utils/      # api.js, socket.js
        └── App.js
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com))

---

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm start
```

Backend runs on: `http://localhost:5000`

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

---

## Environment Variables (`backend/.env`)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/collab-documents
CLIENT_URL=http://localhost:3000
```

---

## Features

- ✅ Create, edit, delete documents
- ✅ Real-time sync across all users via Socket.IO
- ✅ Live active-user list with color-coded avatars
- ✅ Typing indicators
- ✅ Auto-save every 3 seconds + manual save
- ✅ Document title editing
- ✅ Word & character count
- ✅ Light theme, clean UI
- ✅ Responsive design

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | List all documents |
| GET | `/api/documents/:id` | Get single document |
| POST | `/api/documents` | Create document |
| PUT | `/api/documents/:id` | Update document |
| DELETE | `/api/documents/:id` | Delete document |
| GET | `/api/health` | Server health check |

---

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-document` | Client → Server | Join a document room |
| `load-document` | Server → Client | Send document content |
| `send-changes` | Client → Server | Broadcast content delta |
| `receive-changes` | Server → Client | Receive content delta |
| `save-document` | Client → Server | Save to DB |
| `document-saved` | Server → Client | Save confirmation |
| `active-users` | Server → Client | Updated user list |
| `typing` | Client → Server | User is typing |
| `user-typing` | Server → Client | Show typing indicator |

---

*CodTech Internship – Full Stack Track – Task 3*
