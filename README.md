# FlowDesk — Premium Team Workspace

## Overview

FlowDesk is a polished team task workspace built with React, Vite, TypeScript, Tailwind CSS, and Supabase. It pairs a modern multi-theme UI with a kanban-style board, a workspace dashboard, project membership management, and an animated, theme-aware design system.

The backend remains Supabase Auth + Supabase Postgres with row-level security on every table. The redesign is a frontend-only evolution — no schema, RLS, or CRUD logic has been changed.

## Features

- Email/password signup, login, logout, password reset, and protected routes
- Dual-mode login screen (Admin / Member) — UI hint only, actual permissions still come from the existing `project_members` role data
- Project creation, editing, deletion, and member management
- Kanban task board with drag-and-drop status updates and animated cards
- Task CRUD with priorities, due dates, tags, and assignees
- Workspace dashboard with animated counters, status breakdowns, project progress, and recent activity
- 4 frontend themes — Midnight Tech, Aurora Light, Forest Focus, Sunset Studio — saved to localStorage
- Polished empty states, onboarding tips, and animated brand elements
- Responsive layout for desktop, tablet, and mobile

## Tech Stack

- React 18 + Vite + TypeScript
- Tailwind CSS with a CSS-variable theme token system
- Supabase Auth + Supabase Postgres (unchanged)
- React Router, React Hook Form, Zod
- Framer Motion for animations
- Recharts, React Beautiful DnD, Lucide icons

## Theme System

FlowDesk ships four production themes that are entirely client-side:

| Theme            | Mood                              |
| ---------------- | --------------------------------- |
| Midnight Tech    | Cyan + violet on deep navy        |
| Aurora Light     | Crisp white with indigo accents   |
| Forest Focus     | Calm slate green and mint         |
| Sunset Studio    | Warm orange and pink — creative   |

The active theme is stored in `localStorage` under `flowdesk.theme`. Nothing about the theme touches Supabase or backend data — switching themes only swaps CSS variables exposed on `<html data-theme="…">`.

## Role-Based Access

Project access is controlled through the `project_members` table and Supabase RLS policies — the FlowDesk frontend never bypasses them.

Admin users can:

- create, edit, and delete projects they own or administer
- add and remove project members
- create, edit, move, and delete tasks in their projects

Member users can:

- view projects where they are listed as members
- view project tasks
- update tasks assigned to themselves

The login page surfaces an "Admin Login / Member Login" toggle for hint text only. Both modes use the same Supabase email/password flow; the actual permissions come from existing project membership.

## Supabase Setup

Run the SQL migration files in the Supabase SQL Editor, in this order:

1. `supabase/migrations/20260514222852_create_core_tables_v1.sql`
2. `supabase/migrations/20260516013000_fix_project_membership_rls.sql`
3. `supabase/migrations/20260516024500_strict_assignment_role_policies.sql`

These migrations are unchanged by the FlowDesk redesign.

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase project values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_NAME=FlowDesk
VITE_APP_ENV=production
```

Only `VITE_`-prefixed variables are exposed to the browser. Never put service-role or other secret keys in this file.

## Local Installation & Scripts

```bash
npm install
npm run dev        # start the Vite dev server (default http://localhost:5173)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint .
npm run build      # production build into ./dist
npm run preview    # preview the production build
```

## Deployment

Standard Vite frontend deploy (Vercel, Netlify, Cloudflare Pages, …):

1. Set framework preset to Vite if not auto-detected.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional `VITE_APP_NAME`, `VITE_APP_ENV`.

Before deploying, run the Supabase migrations on the Supabase project the deployed site will use.

## Folder Structure

```text
src/
  components/
    auth/        # ProtectedRoute
    layout/      # AppLayout, Sidebar, Navbar
    projects/    # CreateProjectModal
    tasks/       # KanbanBoard, TaskCard, TaskModal
    ui/          # AnimatedCounter, Brand, EmptyState, LoadingState, ThemeSwitcher
  contexts/      # AuthContext, ProjectContext, TaskContext, ThemeContext
  lib/           # supabase client, database types, shared utils
  pages/         # Dashboard, Projects, ProjectDetail, MyTasks, Settings, auth/*
supabase/
  migrations/    # SQL migrations (unchanged by the redesign)
```

## Notes

- Dashboard numbers come from live Supabase data and are then animated client-side; the underlying counts are not changed.
- No dummy data is ever written to Supabase. Sample copy only appears in landing-side panels, empty states, and onboarding hints — it is replaced as soon as real user data is loaded.
- Theme switching is purely a client-side concern and respects no backend state.
