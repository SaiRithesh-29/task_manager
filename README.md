# Task Manager

A real-time Kanban task management app built with the MERN stack. Users can create boards, organize tasks into lists, drag-and-drop cards, and collaborate with team members in real time.

## Features

- **Authentication** — sign up, log in, JWT-based sessions
- **Boards** — create multiple boards with color themes
- **Kanban lists** — add, delete, and reorder lists within a board
- **Cards** — create, edit, delete, drag-and-drop cards between lists
- **Card details** — title, description, labels, due dates, attachments, cover photos
- **Real-time collaboration** — Socket.IO syncs card moves, edits, and updates across all connected users
- **Board members** — invite by email, assign roles (admin / member), configure edit/delete permissions
- **Search & filter** — search cards by title, filter by labels
- **Activity log** — full audit trail of all board changes
- **Notifications** — bell icon with unread count for board events
- **Delete requests** — non-admin users request deletion, admins approve or reject
- **Responsive** — works on desktop and mobile with collapsible sidebar
- **Profile management** — update name and profile photo

## Tech Stack

### Frontend
- **React 19** with Vite 8
- **Tailwind CSS v4** — utility-first styling
- **@dnd-kit** — drag-and-drop (core, sortable, utilities)
- **Socket.IO client** — real-time events
- **Axios** — HTTP client with JWT interceptor

### Backend
- **Node.js** + **Express**
- **MongoDB** + **Mongoose ODM**
- **JWT** + **bcryptjs** — authentication
- **Socket.IO** — real-time WebSocket events
- **Multer** — file uploads

## Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** — local instance or MongoDB Atlas

### 1. Clone the repo

```bash
git clone https://github.com/SaiRithesh-29/task_manager.git
cd taskmanager
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```
PORT=5000
DB_URL=mongodb://localhost:27017/taskmanager
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API calls to `http://localhost:5000`.

## Project Structure

```
taskmanager/
├── backend/
│   ├── app.js               # Express app setup, middleware, socket setup
│   ├── index.js             # Server entry point
│   ├── models/              # Mongoose schemas (User, Board, List, Card, Activity, etc.)
│   ├── routes/              # Express route handlers
│   ├── middlewares/         # Auth and permission middleware
│   ├── uploads/             # Uploaded files
│   └── seed.js              # Database seed script
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Root component — auth, layout, DndContext, data fetching
│   │   ├── main.jsx         # React entry point
│   │   ├── index.css        # Tailwind imports + custom styles
│   │   ├── components/      # UI components (Sidebar, BoardView, List, Card, etc.)
│   │   └── services/        # API client functions
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Scripts

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev mode with nodemon (auto-restart) |
| `npm start` | Production start |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## API Overview

Full API documentation is in `backend/README.md`. Key endpoints:

| Area | Endpoints |
|------|-----------|
| **Auth** | `POST /api/auth/signup`, `POST /api/auth/login` |
| **Boards** | `GET/POST/PUT/DELETE /api/boards`, `GET /api/boards/:id/full` |
| **Lists** | `GET/POST/PUT/DELETE /api/lists` |
| **Cards** | `GET/POST/PUT/DELETE /api/cards`, `PATCH /api/cards/:id/archive` |
| **Members** | `POST/DELETE /api/boards/:id/members` |
| **Activity** | `GET /api/activity/:boardId` |

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `DB_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing tokens |
| `FRONTEND_URL` | Allowed CORS origin |

### Frontend

The API base URL is configured in `frontend/src/services/api.js`. Default points to `http://localhost:5000`.
