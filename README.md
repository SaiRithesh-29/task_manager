# Task Manager

A real-time task management app I built using the MERN stack.

## What it does

- users can sign up and log in
- create, edit, delete and reorder tasks
- drag and drop to organize stuff
- updates in real time with socket.io
- works on mobile too (tailwind css)

## Stack

- **frontend**: React, Vite, Tailwind CSS, Socket.io client
- **backend**: Node.js, Express, MongoDB (Mongoose), Socket.io
- **auth**: JWT + bcryptjs

## Running locally

### Prerequisites

- Node.js
- MongoDB (local or atlas)

### Backend

```bash
cd backend
npm install
```

create a `.env` file inside backend/

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

then run

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

frontend runs on `http://localhost:5173`.

## Project structure

```
taskmanager/
├── backend/          # server, routes, models
├── frontend/         # react app (vite)
└── README.md
```

## Scripts

### Backend
- `npm run dev` - dev mode with nodemon
- `npm start` - production mode

### Frontend
- `npm run dev` - dev server
- `npm run build` - production build
- `npm run preview` - preview build
