# GAMMART

A full-stack game marketplace platform for buying and selling game accounts, top-ups, boosting services, and in-game items — built with React, Express, TypeScript, and PostgreSQL.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| State | Zustand + React Query |
| Backend | Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Validation | Zod |
| Auth | JWT + bcrypt |
| Payment (ID) | Midtrans Snap |
| Payment (Crypto) | USDT (post-MVP) |
| CI/CD | GitHub Actions |
| Deployment | Vercel (frontend) + Railway (backend + DB) |

---

## Project Structure

```
gammart/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma     # DB schema
│   │   └── seed.ts           # Dev seed data
│   └── src/
│       ├── config/           # Env, Prisma client
│       ├── controllers/      # HTTP request handlers
│       ├── services/         # Business logic
│       ├── repositories/     # All DB queries
│       ├── routes/           # Express routers + Zod schemas
│       ├── middlewares/      # Auth, error handler, validator
│       ├── types/            # Shared TypeScript types
│       └── utils/            # AppError, asyncHandler
│
├── client/
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── hooks/            # React Query hooks
│       ├── pages/            # Route-level components
│       ├── services/         # API call functions
│       ├── store/            # Zustand stores
│       └── types/            # Shared TS types
│
├── docker-compose.yml        # Local PostgreSQL
└── .github/workflows/ci.yml  # GitHub Actions CI
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker (for local PostgreSQL)

### 1. Clone & install

```bash
git clone https://github.com/yourusername/gammart.git
cd gammart

# Install root deps (concurrently)
npm install

# Install backend deps
cd backend && npm install && cd ..

# Install frontend deps
cd frontend && npm install && cd ..
```

### 2. Start the database

```bash
docker-compose up -d
```

### 3. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your values
```

### 4. Run migrations & seed

```bash
cd backend
npm run db:migrate   # Apply migrations
npm run db:seed      # Seed test data
```

Seed creates three test accounts:

| Role | Email | Password |
|---|---|---|
| Admin | admin@gammart.id | Admin123! |
| Seller | seller@gammart.id | Seller123! |
| Buyer | buyer@gammart.id | Buyer123! |

### 5. Start the dev servers

```bash
# From root — starts both frontend and backend
npm run dev

# Backend runs on  http://localhost:5000
# Frontend runs on http://localhost:5173
```

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |

### Products

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | — | List products (with filters) |
| GET | `/api/products/:id` | — | Get product detail |
| POST | `/api/products` | Seller | Create listing |
| GET | `/api/products/my/listings` | Seller | Get own listings |
| PATCH | `/api/products/:id/deactivate` | Seller | Deactivate listing |

**Query params for GET /api/products:**
- `search` — full-text search on title, description, game
- `category` — `GAME_ACCOUNT | TOP_UP | BOOSTING | ITEM | OTHER`
- `game` — filter by game name
- `page` — page number (default: 1)
- `limit` — results per page (default: 20, max: 100)

### Orders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/orders` | Buyer | Create order + init payment |
| GET | `/api/orders/my` | Buyer | Get my orders |
| GET | `/api/orders/selling` | Seller | Get orders on my products |
| GET | `/api/orders/:id` | Buyer/Seller | Get order detail |
| PATCH | `/api/orders/:id/complete` | Seller | Mark order complete |

### Payments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/webhook/midtrans` | — | Midtrans payment callback |

---

## Payment Integration

### Midtrans (Indonesian payment gateway)

1. Create a [Midtrans](https://midtrans.com) account
2. Get your **Server Key** and **Client Key** from the dashboard
3. Add them to `backend/.env`
4. For local webhook testing, use [ngrok](https://ngrok.com):
   ```bash
   ngrok http 5000
   # Set https://your-ngrok-url.ngrok.io/api/payments/webhook/midtrans
   # in Midtrans dashboard > Settings > Configuration > Payment Notification URL
   ```
5. Add the Midtrans Snap script to `frontend/index.html`:
   ```html
   <!-- Sandbox -->
   <script src="https://app.sandbox.midtrans.com/snap/snap.js"
           data-client-key="YOUR_CLIENT_KEY"></script>
   <!-- Production -->
   <script src="https://app.midtrans.com/snap/snap.js"
           data-client-key="YOUR_CLIENT_KEY"></script>
   ```

### USDT (post-MVP)
USDT support via [NOWPayments](https://nowpayments.io) is planned for the next milestone.

---

## Deployment

### Backend → Railway

1. Push to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Add a PostgreSQL service
4. Deploy the backend service, set `ROOT_DIRECTORY` to `backend`
5. Add all environment variables from `.env.example`
6. Run migrations: set start command to `npm run db:migrate && npm start`

### Frontend → Vercel

1. Import the repo on [Vercel](https://vercel.com)
2. Set `Root Directory` to `frontend`
3. Add environment variables (`VITE_API_URL`, `VITE_MIDTRANS_CLIENT_KEY`)
4. Deploy

---

## Development Guidelines

### Git branches
```
main          ← always deployable, protected
dev           ← integration branch
feat/*        ← new features
fix/*         ← bug fixes
chore/*       ← tooling, deps, config
```

### Commit messages (Conventional Commits)
```
feat: add Midtrans payment webhook handler
fix: resolve order status not updating on payment callback
chore: upgrade Prisma to v5.10
docs: add API reference to README
```

### Code principles
- **Thin controllers** — controllers only handle HTTP in/out, all logic lives in services
- **Repository pattern** — all DB queries go through repository functions, never raw Prisma in services
- **Zod validation** — all request bodies are validated before reaching controllers
- **AppError** — throw `new AppError(message, statusCode)` for expected errors; the central error handler catches everything

---

## Roadmap

### MVP (current)
- [x] Auth (register, login, JWT)
- [x] Product listings (CRUD, search, filter)
- [x] Order creation + status flow
- [x] Midtrans payment integration
- [x] Seller dashboard (orders)
- [x] Buyer dashboard (orders)

### Next milestone
- [ ] USDT payment via NOWPayments
- [ ] Reviews & ratings system
- [ ] Seller wallet + withdrawal
- [ ] Real-time chat (Socket.IO)
- [ ] Email notifications
- [ ] Admin panel
- [ ] Dispute / escrow system

---

## License

MIT