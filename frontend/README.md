# Frontend — Task Manager UI

React SPA built with Vite. Tailwind CSS v4 for styling, @dnd-kit for drag-and-drop, Socket.IO client for real-time updates.

## Tech Stack

- **Framework:** React 19
- **Bundler:** Vite 8
- **Styling:** Tailwind CSS v4
- **Drag & Drop:** @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- **Real-time:** Socket.IO client
- **HTTP:** Axios
- **Icons:** Inline SVGs (no icon library)

## Setup

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. By default the Vite dev server proxies API requests to `http://localhost:5000`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Project Structure

```
src/
├── main.jsx                 # React entry point
├── App.jsx                  # Root component (auth, routing, layout, dnd context)
├── index.css                # Tailwind imports, custom keyframes, scrollbar styles
├── services/
│   ├── api.js               # Axios instance with JWT interceptor
│   ├── authService.js       # Login / signup API calls
│   ├── boardService.js      # Board CRUD + full board data
│   ├── listService.js       # List CRUD
│   ├── cardService.js       # Card CRUD
│   ├── memberService.js     # Member management
│   ├── activityService.js   # Activity log
│   ├── notificationService.js
│   ├── deleteRequestService.js
│   └── socket.js            # Socket.IO client singleton
├── components/
│   ├── HomePage.jsx         # Landing / marketing page (pre-login)
│   ├── AuthPage.jsx         # Login / signup form
│   ├── Sidebar.jsx          # Board list, shared boards, settings, logout
│   ├── BoardView.jsx        # Kanban board (header, lists, activity panel, members panel)
│   ├── List.jsx             # List column (droppable, cards, add card form)
│   ├── Card.jsx             # Draggable card
│   ├── CardModal.jsx        # Card detail modal (edit title, description, labels, dates, attachments, comments)
│   ├── TeamCollaboration.jsx # Team / members management panel
│   ├── ProfileModal.jsx     # Edit profile (name, photo)
│   ├── NotificationBell.jsx # Notification dropdown
│   ├── ActivityPanel.jsx    # Side panel with activity log
│   ├── MembersPanel.jsx     # Board members list and management
│   ├── Logo.jsx             # App logo SVG
│   └── SearchAndFilter.jsx  # Search by title, filter by labels
├── assets/                  # Static images
└── dist/                    # Production build output
```

## Key Features

- **JWT auth** — token stored in localStorage, auto-attached to requests
- **Kanban board** — lists as columns, cards as items, drag-and-drop between lists
- **Real-time sync** — Socket.IO integration for multi-user collaboration (card moves, edits, creates, deletes)
- **Search & filter** — filter cards by title or labels across all lists
- **Card details** — modal with title, description, labels, due date, attachments, cover photo, activity history
- **Board members** — invite by email, roles (admin/member), granular edit/delete permissions
- **Activity log** — track all changes on a board
- **Notifications** — bell icon with unread count
- **Delete requests** — non-admin users request deletion, admins approve/reject
- **Responsive** — mobile sidebar with hamburger menu, adaptive layout

## State & Data Flow

- Auth state and board data live in `App.jsx` as top-level state
- `loadBoards()` fetches owned + shared boards on mount / login
- `loadBoardData(id)` fetches the full board (board + lists + cards in a single request)
- Socket events trigger `refreshBoardData()` for background sync without loading indicator
- Drag-and-drop updates local state optimistically, fires API in background
- `onUpdate` prop (passed from App → BoardView → List) triggers silent board refresh
