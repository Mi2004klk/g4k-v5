# Games4King Workplace OS

A single, modern workplace platform that brings **attendance, leave, people management, and company-wide
visibility** together in one place — built for the whole team: business owners, HR, and employees.

> **Status:** Actively in progress — core day-to-day workflows are working and being refined toward a
> production launch. This file is the running record of what the platform does and where it's headed.

---

## What this product does

Games4King Workplace OS replaces scattered spreadsheets and punch machines with one connected system:

- **Sign in & access** — one secure login for everyone, with the right view for each role.
- **Daily attendance** — clock in, take breaks, clock out; a live running timer; automatic overtime and
  late tracking; a personal calendar heat-map of active days.
- **Leave** — request time off, route it to the right approver (employee → HR → owner), and track status
  live.
- **People directory** — a searchable, professional company directory with photos, roles, and direct
  messaging.
- **Owner & HR control** — manage employees, HR accounts, departments, approvals, attendance oversight,
  company-wide reports, holidays, and company settings.
- **Real-time updates** — notifications, messages, and dashboard changes appear live without refreshing.

The interface is designed to feel **clean, colorful, and fast** — compact on small screens, roomy on large
ones, and consistent across every page.

---

## Who it's for

| Role | What they get |
|---|---|
| **Owner / Admin** | A full company-wide dashboard, user & department management, all attendance & approvals, system settings, holidays, and company profile. |
| **HR** | A team-level dashboard, team attendance oversight, leave approvals, quick task assignment, and employee insights. |
| **Employee** | A personal daily summary, one-tap attendance with a live timer, leave requests, and a company directory. |

---

## How it's hosted (in plain terms)

The product is split across three reliable, fast services so each part runs where it performs best:

- **The website (what users see)** runs on **Vercel** — fast global delivery, automatic updates on every change.
- **The engine (the behind-the-scenes logic)** runs on **Google Cloud (Mumbai)** — close to the data for speed.
- **The database (where everything is stored)** runs on **Supabase (Mumbai)** — secure, backed-up Postgres, plus file storage for photos and documents.

Everything is in the **Mumbai** region so the team gets the quickest response times.

---

## Development journey

The platform was built across an intense, focused build window — **August 8–12, 2026** — moving from a blank
canvas to a working, role-based workplace system. Here's the path it took, in order:

| Date (2026) | Milestone — what was delivered |
|---|---|
| **Aug 8** | Project foundation: the database design, the core data models, and the first end-to-end skeleton (sign-in, users, roles). |
| **Aug 9** | The heart of the system: attendance tracking (clock-in/break/clock-out, shift timelines, overtime), leave requests, projects, tasks, chat, announcements, and the approval workflow. Capabilities, audit logging, and the dashboard foundation. |
| **Aug 10** | Reliability & speed: metrics caching, queue supervision, database indexes, the dashboard widget engine, loading skeletons, and the native attendance calendar grid. |
| **Aug 11** | Hardening: form validation & input security, data privacy for sensitive fields, UI polish (responsive tables, dialogs), authentication security fixes, and production stabilization across dozens of edge cases. Added soft-deletes, active-role handling, and performance indexes. |
| **Aug 12** | Production push: the ClickUp-style design overhaul, direct API routing for speed, deployment configuration, and a series of focused fixes for stability, sign-in correctness, and the move from the old host to **Google Cloud**. Refined the build pipeline, the background workers (reminders, scheduler), and the real-time (WebSocket) layer. |

**In progress (refinement toward launch):**
- Completing the attendance story: a per-employee weekly/monthly insights graph, a "continue shift" option,
  and richer break summaries.
- Polishing consistency across every list (uniform search/filter/sort bars, page numbers, and clear
  empty/loading/error states).
- Finishing a few admin controls (HR-managed departments, task review states, system-wide notification
  preferences, password-expiry options).
- Final accessibility and responsive-behavior pass.

---

## What works today

- ✅ Secure sign-in (email or employee ID), password recovery, and multi-role selection.
- ✅ Live attendance with running timer, overtime, late tracking, and a personal history calendar.
- ✅ Leave requests with correct approval routing and live status.
- ✅ Owner, HR, and Employee dashboards with the right data for each role.
- ✅ Employee directory with search and direct messaging.
- ✅ User, department, and designation management (owner).
- ✅ Company-wide attendance overview, filters, manual corrections, and exports.
- ✅ Real-time notifications and chat.
- ✅ Holiday calendar and shift reminders.
- ✅ Responsive design for desktop, tablet, and mobile.

## What's being refined

- Per-employee attendance insights graphs and a few advanced HR/admin controls.
- A final consistency pass on filters, pagination, and component states across every list.
- Accessibility finishing touches and performance tuning for launch.

---

## Project structure (high level)

```
apps/
  api/    → The backend engine (Laravel) — business logic, APIs, background tasks
  web/    → The website (Next.js) — everything users see and click
packages/
  ui/     → The shared design system — buttons, cards, tables, colors, used everywhere
supabase/ → Database configuration
Dockerfile, cloudbuild.yaml → How the backend is packaged and deployed to Google Cloud
```

---

## Notes for the team

- **Passwords are never stored in plain text** and sensitive configuration lives outside the code.
- **Daily database backups** are handled by Supabase; the website and engine each keep their own deployment
  history for one-click rollback.
- This repository contains **only the product source** — planning notes, scratch files, and tooling configs
  are kept out of GitHub on purpose, so what you see here is the clean, shippable product.

---

© Games4King Workplace OS · Gen2k Conglomerate
