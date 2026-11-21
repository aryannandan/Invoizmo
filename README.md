# Invoizmo

> Invoizmo is a modern, web-based invoice generator SaaS built with TypeScript, Node.js + Express, and MongoDB Atlas.

## Architecture Overview

- **Backend:** Node.js (Active LTS), Express 5, TypeScript (strict mode), Mongoose, Zod
- **Security:** Helmet, CORS allowlisting, NoSQL injection prevention, bcrypt password hashing, timing-safe token comparisons, HttpOnly/SameSite=Strict cookie rotation, per-route rate limiting.
- **Frontend (Target):** Next.js / React, Tailwind CSS, TanStack Query, React Hook Form + Zod.

---

## Getting Started (Backend)

### Prerequisites
- Node.js (v20+ or Active LTS v22/v24)
- npm (v10+)
- MongoDB Atlas cluster URI or local MongoDB instance (`mongodb://localhost:27017/invoizmo`)

### 1. Configure Environment
Copy the example environment file:
```bash
cd backend
cp .env.example .env
```
Fill in the generated secrets:
```bash
# Generate 64-character secrets for JWT
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Verify System Health
Open in browser or test via cURL:
- Liveness check: `http://localhost:5000/health`
- Readiness check (DB connected): `http://localhost:5000/ready`

### 5. Typecheck & Audit
```bash
npm run typecheck
npm audit
```

---

## Postman Collection
Import the collection and environment located in `backend/postman/`:
- `backend/postman/collection.json`
- `backend/postman/environment.json`
