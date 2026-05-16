# FlowDesk

A full-stack team task manager for creating projects, assigning tasks, and tracking progress with role-based access (Admin / Member).

## Features

- User authentication (register, login, logout)
- Project and Kanban task boards (To Do, In Progress, Review, Done)
- Task assignment, due dates, and status updates
- Admin dashboard with team management
- Member permissions for assigned task updates
- Profile and account settings

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript
- **Backend:** Next.js API routes
- **Database:** Prisma ORM (SQLite locally, PostgreSQL recommended for production)
- **Auth:** JWT (httpOnly cookies)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone <your-repo-url>
cd flowdesk
npm install
```

### Environment variables

Copy the example env file and adjust values:

```bash
cp .env.example .env
```

| Variable       | Description                                      |
| -------------- | ------------------------------------------------ |
| `DATABASE_URL` | Database connection string                       |
| `JWT_SECRET`   | Secret key for signing auth tokens (use a long random string in production) |

### Database setup

```bash
npx prisma db push
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The first registered user becomes an **Admin**. Everyone after that is a **Member**.

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Production build         |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

## Deploy on Railway

1. Create a new project on [Railway](https://railway.app).
2. Add a **PostgreSQL** database service.
3. Connect your GitHub repo or deploy from this folder.
4. Set environment variables:
   - `DATABASE_URL` — from the PostgreSQL service
   - `JWT_SECRET` — a strong random secret
5. Update `prisma/schema.prisma` datasource to `postgresql` if you are moving off SQLite.
6. Set the build/start commands (or use defaults):
   - **Build:** `npx prisma generate && npx prisma db push && npm run build`
   - **Start:** `npm run start`

## Project structure

```
src/
  app/          # Pages and API routes
  components/   # UI components
  lib/          # Auth and database helpers
prisma/         # Schema and migrations
```

## License

Private / assignment project.
