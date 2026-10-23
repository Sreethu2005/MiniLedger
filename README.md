# 📒 MiniLedger

MiniLedger is a clean, reliable full-stack application designed to track money lent to friends. It is built with a focus on simplicity, readability, and production best practices—making it easy for any engineer to explain line by line in an interview.

---

## 🚀 Tech Stack

- **Backend**: Node.js, TypeScript, Express, PostgreSQL using the native `pg` driver (pure SQL, no heavy ORMs).
- **Authentication**: Passwordless phone authentication with expiring OTPs and signed JSON Web Tokens (JWT).
- **Validation**: Schema-driven validation using `zod` on both server and mobile client.
- **File Storage**: Image receipt uploads with `multer` (5MB limit, image MIME filtering, static file serving).
- **Mobile App**: React Native with Expo (SDK 52), TypeScript, React Navigation (Native Stack), Axios, `expo-secure-store`, and `expo-image-picker`.
- **Testing**: End-to-end integration test suite using `jest` and `supertest`.

---

## 📁 Repository Structure (Monorepo)

```text
Mini_ledger/
├── docker-compose.yml          # PostgreSQL 16 container definition
├── README.md                   # Complete documentation & interview guide
├── backend/                    # Express + TypeScript API server
│   ├── src/
│   │   ├── config/             # Environment & app configuration
│   │   ├── controllers/        # Request handlers (auth, loans)
│   │   ├── db/                 # Connection pool, schema.sql, migration script
│   │   ├── middleware/         # Auth, Zod validation, Multer upload
│   │   ├── routes/             # Express route definitions (/auth, /loans)
│   │   ├── types/              # TypeScript namespace extensions (Express.Request)
│   │   ├── utils/              # JWT, OTP generator, Zod schemas
│   │   ├── app.ts              # Express application setup
│   │   └── server.ts           # Server bootstrap & graceful shutdown
│   ├── tests/                  # Jest + Supertest integration test suites
│   ├── uploads/                # Directory where uploaded receipt images reside
│   ├── .env.example            # Sample environment variables
│   ├── package.json
│   └── tsconfig.json
└── app/                        # React Native (Expo) mobile client
    ├── src/
    │   ├── api/                # Axios client with JWT interceptor & API methods
    │   ├── components/         # SummaryCard, LoanItem, ReceiptModal
    │   ├── config/             # Dynamic API base URL (Android 10.0.2.2 / iOS)
    │   ├── context/            # AuthContext (SecureStore token persistence)
    │   ├── navigation/         # React Navigation RootNavigator
    │   └── screens/            # LoginScreen, HomeScreen, AddLoanScreen
    ├── App.tsx                 # App entry point
    ├── app.json                # Expo configuration
    ├── package.json
    └── tsconfig.json
```

---

## 🛠️ Prerequisites

- **Node.js**: v18.x or v20.x or higher (tested on Node v24)
- **npm**: v9.x or higher
- **Docker**: Docker Desktop / Docker Engine (for running PostgreSQL)
- **Mobile Testing**: Expo Go (Android/iOS) or Android Emulator / iOS Simulator

---

## 🗄️ Setting Up PostgreSQL

A `docker-compose.yml` is provided at the root of the repository.

1. **Start the PostgreSQL container:**
   ```bash
   docker compose up -d
   ```

2. **Verify container is running:**
   ```bash
   docker compose ps
   ```
   *The container exposes PostgreSQL on port `5432` with username `postgres`, password `postgrespassword`, and database `miniledger`.*

---

## 🔄 Running Database Migrations

The migration script reads `backend/src/db/schema.sql` and executes it idempotently against PostgreSQL.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the migration script:
   ```bash
   npm run migrate
   ```

You will see:
```text
🔄 Running database migrations...
✅ Database migration completed successfully!
```

---

## ⚙️ Backend Setup & Execution

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   Create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Default configuration in `.env`:*
   ```env
   PORT=4000
   NODE_ENV=development
   BASE_URL=http://localhost:4000
   DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/miniledger
   JWT_SECRET=supersecret_miniledger_jwt_key_change_in_production
   JWT_EXPIRES_IN=30d
   ```

3. **Start the backend development server:**
   ```bash
   npm run dev
   ```
   The server will start at `http://localhost:4000`. You can test health by visiting:
   `http://localhost:4000/health`

---

## 📱 Where to Find the OTP in the Logs (Mock SMS)

To keep local development zero-cost and reliable without third-party SMS gateways (Twilio/AWS SNS), the backend implements a **Mock SMS service**.

When you trigger `POST /auth/request-otp` from the mobile app or API:
1. The server generates a random 6-digit code.
2. It saves the code to PostgreSQL with a 5-minute expiry.
3. It prints a formatted message to your **backend terminal console**:

```text
======================================================
📱 [MOCK SMS] OTP for Phone: +15551234567
🔑 Verification Code: 428307
⏳ Valid until: 2:23:14 pm (5 minutes)
======================================================
```

Simply copy the 6-digit code from the terminal and enter it in the app's verification screen.

---

## 📱 Mobile App Setup & Execution

1. **Navigate to the app folder:**
   ```bash
   cd app
   npm install
   ```

2. **Configure API Base URL (`app/src/config/index.ts`):**
   - **Android Emulator**: Uses `http://10.0.2.2:4000` automatically (which maps to host `localhost`).
   - **iOS Simulator**: Uses `http://localhost:4000` automatically.
   - **Physical Device via Expo Go**: Open `app/src/config/index.ts` and set your computer's local Wi-Fi IP:
     ```typescript
     const MANUAL_OVERRIDE_URL = 'http://192.168.1.100:4000';
     ```

3. **Start Expo:**
   ```bash
   npm start
   ```

4. **Launch on device/emulator:**
   - Press `a` in the terminal to launch on an **Android Emulator**.
   - Press `i` to launch on an **iOS Simulator**.
   - Scan the QR code with the **Expo Go** camera (Android) or Camera app (iOS).

---

## 🌐 API Endpoint Reference

All endpoints return a uniform error structure `{ error: string }` on failures.

| Method | Endpoint | Description | Auth Required | Request Body / Params | Response (Success) |
|---|---|---|---|---|---|
| `GET` | `/health` | API health check | No | None | `{ status: "ok", timestamp: ... }` |
| `POST` | `/auth/request-otp` | Generate & log 6-digit OTP | No | `{ phone: "+1234567890" }` | `{ message: "OTP sent successfully", phone: ... }` |
| `POST` | `/auth/verify-otp` | Validate OTP & issue JWT | No | `{ phone: "+1234567890", otp: "123456" }` | `{ token: "jwt...", user: { id, phone } }` |
| `GET` | `/loans` | List loans (newest first) | **Yes** (Bearer) | None | `[{ id, friendName, amount, dueDate, status, isOverdue, ... }]` |
| `GET` | `/loans/summary` | Aggregate financial statistics | **Yes** (Bearer) | None | `{ totalLent: 250, totalRepaid: 100, overdueAmount: 50 }` |
| `POST` | `/loans` | Record a new loan | **Yes** (Bearer) | `{ friendName: "Bob", amount: 50.00, dueDate: "2026-12-31" }` | Created loan object (HTTP 201) |
| `PATCH` | `/loans/:id/repay` | Mark a loan as repaid | **Yes** (Bearer) | URL param `:id` | Updated loan object (`status: "repaid"`) |
| `POST` | `/loans/:id/receipt` | Upload image receipt | **Yes** (Bearer) | Multipart form with `receipt` file | Updated loan object (`receiptUrl: "/uploads/..."`) |

---

## 🧪 Running Automated Tests

The backend includes a comprehensive Jest test suite using `supertest` that runs against the database.

1. Ensure PostgreSQL is running (`docker compose up -d`).
2. Run tests:
   ```bash
   cd backend
   npm test
   ```

### What the test suite covers:
- **Authentication Flow**: Requesting OTP, expiry checks, verification, and prevention of replay attacks.
- **Input Validation**: Rejection of negative amounts, invalid dates, and empty names via Zod.
- **Tenant Isolation**: Guarantees User A cannot view, repay, or upload receipts to User B's loans (HTTP 404).
- **Repayment Lifecycle**: Repaying marks `repaid_at`, duplicate repayment attempts return HTTP 409 Conflict.
- **Overdue Logic**: Verifies `isOverdue` evaluates to `true` for past dates and `false` for future dates.
- **SQL Aggregations**: Mathematical verification of `totalLent`, `totalRepaid`, and `overdueAmount`.
- **Receipt Uploads**: Multer file size verification, image MIME validation, and disk cleanup on failure.

---

## 🧠 "How It Works" (Interview Deep Dive)

### 1. The Authentication Flow & Replay Attack Defense
- **Passwordless UX**: Rather than requiring passwords that users forget or reuse, users enter their phone number.
- **OTP Generation & Expiry**: `POST /auth/request-otp` creates a cryptographically-generated 6-digit numeric OTP and stores it with an expiration timestamp (`expires_at = NOW() + 5 minutes`).
- **Atomic Single-Use**: In `POST /auth/verify-otp`, when the correct code is supplied, the database immediately marks `used = true`. If a malicious actor intercepts and replays the same code, the verification query rejects it.
- **JWT Authorization**: Once verified, the server issues a signed JWT containing `{ userId, phone }`. The client stores this in encrypted hardware storage using `expo-secure-store`.
- **Auto-Login**: When the mobile app mounts, `AuthContext` checks `SecureStore` for an existing token. If found, it bypasses the login screen without flickering.

### 2. Overdue Logic & Financial Summary Math
- **SQL-Level Evaluation**:
  Instead of fetching all loans into Node.js and calculating overdue flags with JavaScript loops, the database computes it in real time:
  ```sql
  CASE 
    WHEN status = 'pending' AND due_date < CURRENT_DATE THEN true 
    ELSE false 
  END AS is_overdue
  ```
- **PostgreSQL Date Parser & Timezone Protection**:
  Standard JavaScript `Date` conversions often cause off-by-one errors due to local timezone offsets (e.g. UTC midnight shifting to 18:30 the previous day). In `src/db/index.ts`, we register `types.setTypeParser(1082, (val) => val)` so PostgreSQL `DATE` types remain pure, exact `YYYY-MM-DD` strings.
- **Pushing Math into SQL (`/loans/summary`)**:
  Financial aggregates are calculated in a single query using conditional aggregation:
  ```sql
  SELECT
    COALESCE(SUM(amount), 0) AS total_lent,
    COALESCE(SUM(CASE WHEN status = 'repaid' THEN amount ELSE 0 END), 0) AS total_repaid,
    COALESCE(SUM(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN amount ELSE 0 END), 0) AS overdue_amount
  FROM loans
  WHERE user_id = $1;
  ```
  `COALESCE(..., 0)` guarantees that if a user has 0 loans, the database returns `0` instead of `NULL`.
- **Express Route Precedence**:
  In Express, routes are evaluated in registration order. `/loans/summary` is declared before `/loans/:id` so the literal string `"summary"` is never accidentally parsed as a numeric loan ID.
