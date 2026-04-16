# TaskFlow — Team Task Manager with Dependencies

A full-stack task management application with task dependencies, subtasks, and optimized dashboard queries.

## Tech Stack

- **Backend:** Node.js, Express, SQLite (via Knex.js + better-sqlite3)
- **Frontend:** React (Vite), Vanilla CSS

## Features

- **Dashboard** — View all tasks assigned to you, grouped by project
- **Task Dependencies** — Tasks can depend on other tasks within the same project
- **Blocked Detection** — Red "Blocked" badges on tasks with incomplete dependencies
- **Hover Tooltips** — Hover over blocked tasks to see what they're waiting for
- **Task Creation** — Create tasks with a multi-select dependency picker
- **Task Completion** — Mark tasks complete with toast notifications showing newly unblocked tasks
- **Subtasks** — Tasks can have subtasks (1 level deep)
- **User Switching** — Switch between users to see their dashboards
- **Optimized Queries** — Dashboard loads in ≤3 database queries

## Project Structure

```
├── backend/
│   ├── server.js                  # Express entry point
│   ├── knexfile.js                # Database config
│   ├── migrations/
│   │   └── 001_initial.js         # Schema (users, projects, tasks, etc.)
│   └── src/
│       ├── db.js                  # Knex instance
│       ├── seed.js                # Demo data
│       └── routes/
│           ├── users.js           # GET /api/users/:id/dashboard
│           └── tasks.js           # POST /api/tasks, PUT /api/tasks/:id/complete
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── api.js                 # API client
│       ├── index.css              # Design system
│       └── components/
│           ├── Dashboard.jsx      # Main dashboard
│           ├── ProjectSection.jsx # Collapsible project group
│           ├── TaskCard.jsx       # Task with badges, actions
│           ├── TaskForm.jsx       # Creation modal
│           ├── Toast.jsx          # Notifications
│           └── Tooltip.jsx        # Hover blocked-by info
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
npm install
npx knex migrate:latest   # Create database tables
node src/seed.js           # Seed demo data
npm run dev                # Start API on port 3001
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev                # Start dev server on port 5173
```

### Open in Browser

Navigate to [http://localhost:5173](http://localhost:5173)

## API Endpoints

### `GET /api/users/:id/dashboard`

Returns projects + tasks assigned to user. For each task, includes:
- `is_blocked` (true/false)
- `blocked_by_titles` (array of task names with incomplete dependencies)
- Optimized to **≤3 database queries**

### `POST /api/tasks`

Create a task with:
- `title`, `project_id`, `assignee_id`, `due_date`
- Optional `dependency_ids` (must be from same project)
- Optional `parent_task_id` (for subtasks, max 1 level deep)

### `PUT /api/tasks/:id/complete`

Mark a task complete. Returns `newly_unblocked` — tasks that were blocked by this one and are now fully unblocked.

## Database Schema

| Table | Description |
|---|---|
| `users` | User accounts |
| `projects` | Projects |
| `project_user` | Many-to-many: users ↔ projects |
| `tasks` | Tasks with optional `parent_task_id` for subtasks |
| `task_dependencies` | Many-to-many self-reference for task dependencies |
