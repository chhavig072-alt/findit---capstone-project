# FindIt - Campus Lost and Found

MERN capstone: students post lost/found items, claim items, and get "possible matches".

## Stack
- Backend: express, mongoose, dotenv, bcrypt, jsonwebtoken
- Frontend: react, react-router-dom, Fetch API, Context API (Vite)

## Setup
Requires Node 18+ and a running MongoDB (local or Atlas).

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env        # then edit the secrets and MONGO_URI
npm run seed:admin          # creates the admin (security staff) account from .env
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :5000)
```

## Auth design
- Passwords hashed with bcrypt (10 rounds).
- Access token (JWT, 15 min) is sent as `Authorization: Bearer` and kept in memory only (React Context).
- Refresh token (JWT, 7 days) is an httpOnly cookie, stored hashed (sha256) in the DB and rotated on every refresh.
- On page load the app calls `/api/auth/refresh` to restore the session; a 401 triggers one silent refresh and retry.
- Everyone registers as `user`. Admin accounts are created only with `npm run seed:admin`.
- RBAC: `requireRole('admin')` guards all `/api/admin/*` routes.
- Note: one refresh token per user, so logging in on a new device ends the old session.

## API
| Method | Route | Access |
|---|---|---|
| POST | /api/auth/register, /login, /refresh, /logout | public |
| GET | /api/auth/me | user |
| GET | /api/items?type=&category=&place=&q=&from=&to=&status=&page= | user |
| POST | /api/items | user |
| GET | /api/items/mine | user |
| GET / DELETE | /api/items/:id | user / owner |
| GET | /api/items/:id/matches | user |
| POST / GET | /api/items/:id/claims | user / poster |
| GET | /api/claims/mine, /api/claims/received | user |
| PATCH | /api/claims/:id  `{status: approved|rejected}` | item poster |
| GET | /api/admin/items, /api/admin/stats | admin |
| DELETE | /api/admin/items/:id | admin |

## Possible matches (the twist)
`backend/utils/matcher.js` returns open items of the opposite type with the same category,
at least one shared title keyword (stopwords removed, regex-escaped) and a date within 7 days.
Works from both lost and found posts.

## Claim flow
A user claims an open item with a message -> the poster approves or rejects ->
approving marks the item `resolved` and auto-rejects the other pending claims.
Rules: no claiming your own post, one pending claim per user per item.

## Collections
User, Item, Claim (see `backend/models`).
