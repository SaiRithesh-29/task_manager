# Task Manager

A real-time task management application built with the MERN stack.

## Features

- User registration and login
- Create, update, delete, and reorder tasks
- Drag and drop task organization
- Real-time updates via Socket.io
- Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Socket.io Client
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io
- **Authentication**: JWT, bcryptjs

## Getting Started

### Prerequisites

- Node.js installed
- MongoDB instance (local or cloud)

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend folder:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Start the backend:

```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173` by default.

## Project Structure

```
taskmanager/
├── backend/          # Express server, API routes, database models
├── frontend/         # React app with Vite
└── README.md
```

## Scripts

### Backend
- `npm run dev` - Start with nodemon (development)
- `npm start` - Start normally (production)

### Frontend
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build