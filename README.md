# Signal-Style Secure Messaging Platform

A production-quality **Signal-inspired secure messaging web application** built with **Next.js**, **TypeScript**, **FastAPI**, **SQLAlchemy**, **SQLite (WAL Mode)**, and **WebSockets**.

---

## 🌟 Key Architecture & Performance Highlights

- **Desktop-First Signal UI/UX**: 3-pane layout (Vertical SideRail Navigation, Conversation List Panel, and Active Chat Pane) with support for light and dark themes.
- **SQLite WAL & Foreign Keys**: SQLite configured with `PRAGMA journal_mode = WAL;` and `PRAGMA foreign_keys = ON;` to eliminate database locking during concurrent WebSocket writes and REST reads.
- **$N+1$ Query Optimization**: Conversation sidebar performance is optimized by maintaining `conversations.last_message_id` and `conversations.last_activity_at` within atomic SQL transactions during message creation.
- **Cursor-Based Message Pagination**: Prevents expensive SQL `OFFSET` overheads by using cursor filtering on indexed composite key `messages(conversation_id, created_at)`.
- **Ephemeral Events Routing**: Real-time typing indicators (`TYPING_START`, `TYPING_STOP`) are routed entirely in-memory through the `WebSocketManager` without disk writes.
- **Delivery & Read Receipts**: Real-time receipt state transitions (`SENT` $\rightarrow$ `DELIVERED` $\rightarrow$ `READ`) tracked per-user via `message_receipts` table.
- **Group Member Management**: Admin controls for creating groups, adding members, and removing members.

---

## 📁 Repository Layout

```text
secure_messaging_platform/
│
├── backend/
│   ├── .venv/                         # Local Python virtual environment (Git ignored)
│   ├── data/                          # SQLite database directory (app.db)
│   ├── database/
│   │   ├── database.py                # Engine, SessionLocal, WAL & FK setup
│   │   └── seed.py                    # Database seeding script (8 users, messages)
│   ├── models/                        # SQLAlchemy database models
│   ├── schemas/                       # Pydantic schemas
│   ├── services/                      # Business logic layer
│   ├── routers/                       # REST API route handlers
│   ├── websocket/                     # WebSocket manager & event dispatcher
│   ├── utils/                         # Hashing (bcrypt), JWT, and validators
│   ├── tests/                         # Pytest unit & integration tests
│   ├── main.py                        # FastAPI application entry point
│   ├── config.py                      # App settings loaded from .env
│   ├── requirements.txt               # Backend dependencies
│   ├── .env                           # Backend environment variables
│   └── .env.example                   # Backend environment template
│
├── frontend/
│   ├── app/                           # Next.js 14 App Router pages & layouts
│   ├── components/                    # UI components (SideRail, ChatPane, Modals)
│   ├── hooks/                         # React hooks (useAuth, useConversations, useMessages)
│   ├── services/                      # API client & WebSocket client
│   ├── types/                         # TypeScript interfaces
│   ├── package.json                   # Frontend dependencies
│   ├── .env.local                     # Frontend environment variables
│   └── .env.local.example             # Frontend environment template
│
├── .gitignore                         # Master gitignore
└── README.md                          # Platform documentation
```

---

## 🛠️ Step-by-Step Environment Setup & Execution Guide

### Prerequisites
- **Python**: `3.10+` or `3.11+`
- **Node.js**: `v18.x` or `v20.x`
- **npm**: `v9.x` or `v10.x`

---

### 1. Backend Setup

1. Open PowerShell or Terminal and navigate to the project root:
   ```bash
   cd backend
   ```

2. Create an isolated Python virtual environment inside `backend/.venv`:
   ```bash
   python -m venv .venv
   ```

3. Activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     source .venv/bin/activate
     ```

4. Install backend dependencies into the virtual environment:
   ```bash
   pip install -r requirements.txt
   ```

5. Configure backend environment file:
   ```bash
   copy .env.example .env
   ```

6. Seed the SQLite database with realistic test users, contacts, conversations, and message history:
   ```bash
   python -m backend.database.seed
   ```

7. Run backend REST & WebSocket server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend API will be live at `http://localhost:8000`. Swagger documentation is available at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

1. Open a second PowerShell or Terminal window and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install Node.js frontend dependencies:
   ```bash
   npm install
   ```

3. Configure frontend environment file:
   ```bash
   copy .env.local.example .env.local
   ```

4. Start Next.js development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

## 🔑 Demo Login Credentials

The database seed script initializes the system with realistic test users:

| Username | Password | Display Name | Role |
| :--- | :--- | :--- | :--- |
| `alice` | `password123` | Alice Smith | Admin (`Signal Core Engineering`) |
| `bob` | `password123` | Bob Jones | Group Member |
| `charlie` | `password123` | Charlie Brown | Group Member |
| `grace` | `password123` | Grace Hopper | Group Member |

*Note: On the login page, instant 1-click login buttons are provided for fast evaluation!*

---

## 🧪 Running Automated Tests

To execute the backend pytest suite:

```bash
.\backend\.venv\Scripts\python -m pytest backend/tests
```

All authentication, session validation, direct conversation creation, and message retrieval tests will execute against an isolated test database session.

---

## 📝 Performance Optimization Summary

1. **SQLite WAL Mode**: Enabled globally to allow concurrent readers during active WebSocket database writes.
2. **Denormalized Metadata**: `conversations.last_message_id` and `last_activity_at` are updated atomically during message insertion to make sidebar loading $O(1)$ relative to message table size.
3. **In-Memory Typing Routing**: Ephemeral typing events (`TYPING_START` / `TYPING_STOP`) bypass SQLite entirely to reduce unnecessary I/O operations.
4. **Indexed Joins**: Indexed foreign keys on `conversation_members(user_id, conversation_id)` and composite key `messages(conversation_id, created_at)` ensure lightning-fast message queries.
