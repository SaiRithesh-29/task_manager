# Backend — Task Manager API

Express + MongoDB REST API with Socket.IO for real-time collaboration.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB + Mongoose ODM
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Real-time:** Socket.IO
- **File upload:** Multer

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in `backend/`:

```
PORT=5000
DB_URL=mongodb://localhost:27017/taskmanager
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with nodemon |
| `npm start` | Start production server |

## API Routes

### Auth (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |

### Boards (`/api/boards`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards` | Get all boards owned by user |
| GET | `/api/boards/shared` | Get boards shared with user |
| GET | `/api/boards/:id` | Get single board |
| GET | `/api/boards/:id/full` | Get board + lists + cards |
| GET | `/api/boards/:id/online` | Get online members |
| GET | `/api/boards/:id/members` | Get board members |
| POST | `/api/boards` | Create board |
| PUT | `/api/boards/:id` | Update board |
| DELETE | `/api/boards/:id` | Delete board (or request deletion) |
| POST | `/api/boards/:id/members` | Add member by email |
| DELETE | `/api/boards/:id/members/:userId` | Remove member |
| PATCH | `/api/boards/:id/members/:userId/role` | Change member role |
| PATCH | `/api/boards/:id/members/:userId/permissions` | Change member permissions |
| POST | `/api/boards/:id/leave` | Leave board |

### Lists (`/api/lists`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lists/:boardId` | Get lists for a board |
| POST | `/api/lists` | Create list |
| PUT | `/api/lists/:id` | Update list (title, order) |
| DELETE | `/api/lists/:id` | Delete list |

### Cards (`/api/cards`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cards/:listId` | Get cards in a list |
| POST | `/api/cards` | Create card |
| PUT | `/api/cards/:id` | Update card (title, description, listId, labels, dueDate, etc.) |
| DELETE | `/api/cards/:id` | Delete card |
| PATCH | `/api/cards/:id/archive` | Archive / unarchive card |

### Users (`/api/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get profile |
| PUT | `/api/users/profile` | Update profile (name, photo) |
| GET | `/api/users/search?q=` | Search users by email/name |

### Activity (`/api/activity`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activity/:boardId` | Get activity log for board |

### Notifications (`/api/notifications`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/:userId` | Get notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |

### Delete Requests (`/api/delete-requests`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/delete-requests` | Get pending delete requests |
| POST | `/api/delete-requests/:id/approve` | Approve delete request |
| POST | `/api/delete-requests/:id/reject` | Reject delete request |

## Database Models

| Model | Fields |
|-------|--------|
| **User** | name, email, password (hashed), profilePhoto |
| **Board** | name, color, createdBy, members (array of userId, email, name, role, permissions), onlineMembers, editedBy, editedAt |
| **List** | title, boardId, createdBy, order, editedBy, editedAt |
| **Card** | title, description, listId, order, labels, dueDate, attachments, coverPhoto, archived, createdBy, editedBy, editedAt |
| **Activity** | boardId, user (userId, name), action, description, targetId, targetType |
| **Notification** | userId, type, message, boardId, read, relatedId |
| **DeleteRequest** | boardId, targetType, targetId, targetName, requestedBy, status, approvedBy |

## Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `register-user` | `{ userId }` | Register socket with user |
| `join-board` | `{ boardId, userId, userName }` | Join board room |
| `leave-board` | `{ boardId, userId }` | Leave board room |
| `card-being-edited` | `{ cardId, boardId, userId, userName }` | Announce editing |
| `card-edit-cancelled` | `{ cardId, boardId }` | Announce edit end |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `card-created` | card | Card added |
| `card-moved` | card | Card moved between lists |
| `card-updated` | card | Card updated |
| `card-deleted` | cardId | Card removed |
| `card-archived` | card | Card archived |
| `card-unarchived` | card | Card restored |
| `list-created` | list | List added |
| `list-deleted` | listId | List removed |
| `user-online` | `{ boardId, onlineMembers }` | User came online |
| `user-offline` | `{ boardId, onlineMembers }` | User went offline |
| `delete-request-created` | request | New delete request |
| `member-removed` | `{ userId }` | Member removed |
| `member-updated` | `{ userId, role }` | Member role changed |
| `member-left` | `{ userId, name }` | Member left board |
| `activity` | activity | New activity entry |
| `card-being-edited` | `{ cardId, userId, userName }` | Someone editing |
| `card-edit-cancelled` | `{ cardId }` | Someone stopped editing |
