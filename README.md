# GEIMS Complaint Portal

Monorepo with:
- `backend/` = Node.js + Express
- `frontend/` = Next.js + Tailwind CSS

## Requirements
- Node.js 18+ recommended

## Setup

### 1) Install dependencies

From repo root:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2) Env files (optional)

Backend:
- copy `backend/.env.example` to `backend/.env`

Frontend (optional):
- copy `frontend/.env.local.example` to `frontend/.env.local`

## Run

From repo root:

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Backend health: http://localhost:5000/health
