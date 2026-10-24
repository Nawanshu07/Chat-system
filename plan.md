# 🗨️ Chat System — Development & Deployment Plan

> **Design Reference**: `Chat.html` — Dark-themed, minimal WhatsApp-style UI with green accent (`#2e7d5b`), bubble messages, and a pill-shaped composer bar.
> **Frontend Stack**: React 18 (Vite) + Tailwind CSS v3 for scalability and clean component architecture.

---

## 📐 Architecture Overview

```
┌──────────────────────────────────────────────┐
│               BROWSER (Client)               │
│  React 18 + Tailwind CSS ←→ Socket.IO client │
└─────────────────┬────────────────────────────┘
                  │ HTTP / WebSocket (WSS)
┌─────────────────▼────────────────────────────┐
│             BACKEND (Node.js)                │
│  Express REST API  +  Socket.IO server       │
└─────────────────┬────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────┐
│            DATABASE (PostgreSQL)             │
│  Users · Rooms · Messages · Sessions        │
└──────────────────────────────────────────────┘
```

**Tech Stack:**
| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend Framework | React 18 (via Vite) | Component-based, fast HMR, scalable |
| Styling | Tailwind CSS v3 | Utility-first, consistent design tokens |
| State Management | Zustand | Lightweight global state (auth, rooms, messages) |
| Routing | React Router v6 | SPA navigation (login → chat) |
| Socket Client | socket.io-client | Real-time events with React hooks |
| Backend | Node.js + Express | Lightweight, JS-native, huge ecosystem |
| Real-time | Socket.IO | Reliable WebSocket with fallbacks |
| Database | PostgreSQL | Relational, great for chat message history |
| ORM | Prisma | Type-safe DB access, easy migrations |
| Auth | JWT + bcrypt | Stateless, secure, industry standard |
| Deployment | Railway / Render (backend) + Vercel (frontend) | Free tiers, easy setup |

---

## 🗂️ Project Structure (Final)

```
Chat System/
├── frontend/                         ← React + Vite app
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js            ← Tailwind theme (Chat.html colors)
│   ├── postcss.config.js
│   ├── src/
│   │   ├── main.jsx                  ← React entry point
│   │   ├── App.jsx                   ← Router (/ → login, /chat → app)
│   │   ├── index.css                 ← Tailwind directives + custom fonts
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   └── RegisterForm.jsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.jsx    ← Message list + composer
│   │   │   │   ├── MessageBubble.jsx ← mine / theirs bubble
│   │   │   │   ├── Composer.jsx      ← Input + Send button
│   │   │   │   └── TypingIndicator.jsx
│   │   │   ├── sidebar/
│   │   │   │   ├── Sidebar.jsx       ← Conversation list
│   │   │   │   ├── RoomItem.jsx      ← Avatar, name, preview, badge
│   │   │   │   └── SearchBar.jsx
│   │   │   └── shared/
│   │   │       ├── Avatar.jsx
│   │   │       └── OnlineDot.jsx
│   │   ├── hooks/
│   │   │   ├── useSocket.js          ← Socket.IO connection hook
│   │   │   ├── useMessages.js        ← Fetch + realtime messages
│   │   │   └── useAuth.js            ← Auth state helpers
│   │   ├── store/
│   │   │   ├── authStore.js          ← Zustand: user, token
│   │   │   ├── roomStore.js          ← Zustand: rooms list, active room
│   │   │   └── messageStore.js       ← Zustand: messages per room
│   │   ├── services/
│   │   │   └── api.js                ← Axios/fetch wrapper (base URL, auth headers)
│   │   └── pages/
│   │       ├── AuthPage.jsx          ← Login / Register tabs
│   │       └── ChatPage.jsx          ← Sidebar + ChatWindow layout
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── index.js                  ← Entry point (Express + Socket.IO)
│   │   ├── config.js                 ← Env vars, DB config
│   │   ├── routes/
│   │   │   ├── auth.js               ← POST /register, POST /login
│   │   │   ├── users.js              ← GET /users, GET /users/:id
│   │   │   ├── rooms.js              ← GET/POST /rooms
│   │   │   └── messages.js           ← GET /rooms/:id/messages
│   │   ├── middleware/
│   │   │   └── auth.js               ← JWT verification middleware
│   │   ├── socket/
│   │   │   └── handler.js            ← Socket.IO event handlers
│   │   └── db/
│   │       └── prisma.js             ← Prisma client singleton
│   ├── prisma/
│   │   └── schema.prisma             ← DB schema (User, Room, Message)
│   └── package.json
├── plan.md                           ← This file
└── .env.example                      ← Environment variable template
```

---

## 🚀 Phase 1 — Frontend (React + Tailwind)

**Goal:** Scaffold the React/Vite app and build all screens using the `Chat.html` design language. Use mock data — no backend yet.

### Setup
```bash
cd "Chat System"
npx create-vite@latest frontend -- --template react
cd frontend
npm install
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
npm install zustand react-router-dom socket.io-client axios
```

### Tailwind Theme (mirrors `Chat.html` CSS vars)
```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      bg:           '#121212',
      surface:      '#000000',
      line:         '#262626',
      accent:       '#2e7d5b',    // send button, own bubbles
      'accent-text':'#f2fff8',
      mine:         '#2e7d5b',
      theirs:       '#1c1c1c',
      muted:        '#8f8f8f',
      'header-bg':  '#1e4d3b',
      'header-text':'#e8f6ee',
      'header-sub': '#a9d3bc',
    },
    fontFamily: {
      sans: ['Nunito', 'Segoe UI', 'system-ui', 'sans-serif'],
    },
    borderRadius: {
      bubble: '18px',
    },
  },
},
```

### Deliverables
- [ ] Vite + React + Tailwind v3 scaffolded and running (`npm run dev`)
- [ ] `AuthPage.jsx` — Login & Register tabs (dark card, green CTA button)
- [ ] `ChatPage.jsx` — Two-column layout:
  - Left: `Sidebar.jsx` with `RoomItem` list + `SearchBar`
  - Right: `ChatWindow.jsx` with `MessageBubble` + `Composer`
- [ ] Zustand stores scaffolded with mock data
- [ ] React Router: `/` → AuthPage, `/chat` → ChatPage (protected)
- [ ] Responsive — mobile collapses sidebar, tap room to open chat
- [ ] Typing indicator, unread badge, online dot components

### New UI Elements (beyond `Chat.html`)
- Login / Register forms (dark card, green submit button)
- Left sidebar: avatar, name, last message preview, timestamp, unread badge
- `OnlineDot` — pulsing green dot (`#9fd8b7`)
- Typing indicator ("Mina is typing…") animated dots in header
- Empty state for new chats

---

## 🔧 Phase 2 — Backend (REST API)

**Goal:** Build the Node.js + Express server with authentication and all REST endpoints.

### Setup
```bash
cd backend
npm init -y
npm install express cors dotenv bcryptjs jsonwebtoken prisma @prisma/client
```

### API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | Create account |
| `POST` | `/api/auth/login` | ❌ | Login, returns JWT |
| `GET` | `/api/users` | ✅ | List all users (for starting chats) |
| `GET` | `/api/users/me` | ✅ | Get own profile |
| `GET` | `/api/rooms` | ✅ | Get user's rooms/DMs |
| `POST` | `/api/rooms` | ✅ | Create a DM or group room |
| `GET` | `/api/rooms/:id/messages` | ✅ | Paginated message history |

### Deliverables
- [x] Express server with CORS, JSON body parser
- [x] `POST /api/auth/register` — hash password with bcrypt, store user
- [x] `POST /api/auth/login` — verify password, issue JWT
- [x] JWT middleware to protect routes
- [x] Room & message REST routes
- [x] `.env.example` with all required variables
- [x] Frontend connected to backend REST API (`api.js`, stores, forms, modal)

---

## 🗄️ Phase 3 — Database (PostgreSQL + Prisma)

**Goal:** Design and set up the database schema. Run migrations and seed test data.

### Schema (`prisma/schema.prisma`)

```prisma
model User {
  id        String   @id @default(cuid())
  username  String   @unique
  email     String   @unique
  password  String
  avatar    String?
  isOnline  Boolean  @default(false)
  createdAt DateTime @default(now())
  messages  Message[]
  rooms     RoomMember[]
}

model Room {
  id        String       @id @default(cuid())
  name      String?      // null for 1-on-1 DMs
  isDM      Boolean      @default(true)
  createdAt DateTime     @default(now())
  members   RoomMember[]
  messages  Message[]
}

model RoomMember {
  userId String
  roomId String
  user   User   @relation(fields: [userId], references: [id])
  room   Room   @relation(fields: [roomId], references: [id])
  @@id([userId, roomId])
}

model Message {
  id        String   @id @default(cuid())
  content   String
  roomId    String
  senderId  String
  createdAt DateTime @default(now())
  room      Room     @relation(fields: [roomId], references: [id])
  sender    User     @relation(fields: [senderId], references: [id])
}
```

### Deliverables
- [ ] `schema.prisma` with all models
- [ ] Migration: `npx prisma migrate dev --name init`
- [ ] Seed script with 3 test users and sample messages
- [ ] DB connection verified in backend

---

## ⚡ Phase 4 — Real-Time (Socket.IO)

**Goal:** Replace the mock `setTimeout` reply in `Chat.html` with live WebSocket messaging via a custom `useSocket` React hook.

### Events

| Event (Client → Server) | Payload | Description |
|--------------------------|---------|-------------|
| `join_room` | `{ roomId }` | Subscribe to a room's messages |
| `send_message` | `{ roomId, content }` | Send a new message |
| `typing_start` | `{ roomId }` | User started typing |
| `typing_stop` | `{ roomId }` | User stopped typing |

| Event (Server → Client) | Payload | Description |
|--------------------------|---------|-------------|
| `new_message` | `{ message }` | Broadcast new message to room |
| `user_typing` | `{ userId, username }` | Show typing indicator |
| `user_online` | `{ userId }` | Update online status dot |
| `user_offline` | `{ userId }` | Grey out online dot |

### Deliverables
- [x] Socket.IO server integrated with Express
- [x] Auth middleware for socket connections (JWT on handshake)
- [x] `join_room`, `send_message`, `typing_*` events wired up
- [x] Messages persisted to DB on `send_message`
- [x] `useSocket.js` React hook — connects on login, disconnects on logout
- [x] `messageStore` & `roomStore` updated reactively on `new_message` & `conversation_updated`
- [x] Instant personal socket push (`user:<userId>`) so unadded/new senders appear in sidebar instantly with unread badges

---

## ☁️ Phase 5 — Deployment

**Goal:** Get the app live on the internet with a public URL.

### Services (all free tier)
| Service | What it hosts |
|---------|--------------|
| **Railway** or **Render** | Node.js backend + PostgreSQL database |
| **Vercel** | React frontend (Vite build → static) |

### Steps
- [ ] Create PostgreSQL DB on Railway/Render
- [ ] Set environment variables (`DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`)
- [ ] Deploy backend: push to Railway / Render
- [ ] Run migrations on production DB: `npx prisma migrate deploy`
- [ ] Add `VITE_API_URL` + `VITE_SOCKET_URL` to Vercel env vars
- [ ] Deploy frontend: `npm run build` → Vercel
- [ ] Test end-to-end: register → login → send messages in real-time
- [ ] HTTPS handled automatically by all platforms

### Environment Variables

**Backend (`.env`)**
```env
DATABASE_URL=postgresql://user:pass@host:5432/chatdb
JWT_SECRET=your-super-secret-key
PORT=3000
CLIENT_ORIGIN=https://your-frontend.vercel.app
```

**Frontend (`.env`)**
```env
VITE_API_URL=https://your-backend.railway.app/api
VITE_SOCKET_URL=https://your-backend.railway.app
```

---

## 📅 Execution Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
Frontend    Backend   Database  Real-Time  Deploy
(React+TW)  (REST)     (DB)    (Sockets)
```

Each phase is independently verifiable before moving on.

---

## ✅ Success Criteria

- [ ] Users can register and log in
- [ ] Users can start a DM with any other registered user
- [ ] Messages appear in real-time on both sides without refresh
- [ ] Typing indicator shows when the other person is typing
- [ ] Online/offline status updates live
- [ ] Message history loads when opening an old chat
- [ ] Works on mobile and desktop browsers
- [ ] Deployed with a public URL

---

> **Next Step →** Say **"start Phase 1"** and we'll scaffold the React + Vite + Tailwind app and build the full frontend.
