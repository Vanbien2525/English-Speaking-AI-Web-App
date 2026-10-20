# AGENTS.md

Welcome, **Google Labs Jules** and autonomous AI agents! This document serves as your operational blueprint, execution environment contract, and engineering guardrails for **AI Speaking Tutor 3D** (`English-Speaking-AI-Web-App`).

---

## 1. Project Overview & System Mission

**AI Speaking Tutor 3D** is an interactive, high-performance web application designed for English pronunciation training. It combines real-time Web Audio recording, phoneme-level AI speech assessment (IPA accuracy, fluency, completeness), and interactive 3D vocal tract and articulatory visualizations using Three.js and React Three Fiber.

* **Repository:** `Vanbien2525/English-Speaking-AI-Web-App`
* **Default Branch:** `main`
* **Active Working Branch:** `feature/practice-studio-3d` (or task-specific branch)
* **Node.js Engine:** `>=22.0.0` (LTS recommended)
* **Package Manager:** `npm` (v10+)

---

## 2. Technology Stack & Key Dependencies

| Domain | Technologies |
| :--- | :--- |
| **Framework & Runtime** | Next.js 16 (App Router), React 19, TypeScript (Strict Mode) |
| **3D Rendering & Motion** | Three.js (`three`), `@react-three/fiber`, `@react-three/drei`, GSAP (`gsap`, `@gsap/react`), Motion (`motion`) |
| **Audio Processing** | Web Audio API (In-Memory RAM Blobs, 16kHz mono), Wavesurfer.js (`wavesurfer.js`) |
| **Database & Cache** | PostgreSQL 16 (UUIDv7, ACID transactions, row-level locks `SELECT ... FOR UPDATE`, integer basis points) |
| **Styling & Design DNA** | Tailwind CSS v4, OKLCH high-contrast tokens, `@fontsource/be-vietnam-pro`, `@fontsource/charis-sil` (IPA) |
| **Validation & State** | Zod v4 (`zod`), `@tanstack/react-query`, Sonner (`sonner`) |
| **Testing & CI/CD** | Vitest (`vitest`), React Testing Library, ESLint, GitHub Actions (`ubuntu-latest`) |

---

## 3. Setup & Environment Instructions

When initializing your cloud sandbox VM or Docker container:

```bash
# 1. Prepare Environment Variables
cp .env.example .env.local

# 2. Install Dependencies (Cross-platform resilient)
npm ci || npm install

# 3. Initialize PostgreSQL Database (Local/Docker)
npm run db:up
# Or connect directly using PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD

# 4. Apply Database Migrations (in order)
# Schema migration script: database/migrations/0001_init_schema.sql
```

---

## 4. Verification & Testing Commands

Before completing any task, opening a Pull Request, or approving changes, **ALL** of the following quality checks must pass with zero errors:

```bash
# 1. Run Full Automated Test Suite (Vitest)
npm test

# 2. Run Single Test File / Pattern (Targeted debugging)
npx vitest run tests/acceptance/practice-studio-3d.test.ts

# 3. TypeScript Strict Typecheck (Must be 0 errors)
npm run typecheck

# 4. ESLint Static Analysis (Must be 0 warnings)
npm run lint

# 5. Production Build Validation
npm run build
```

---

## 5. Architectural Layering & Coding Conventions

Adhere strictly to Clean Layered Architecture:

1. **Route Handlers (`src/app/api/...`):**
   - Strictly handle HTTP request extraction, multipart form parsing, and DTO validation via Zod schemas.
   - Never place raw SQL or core scoring business logic directly inside route handlers.
   - Delegate immediately to application services or repositories.

2. **Services (`src/core/services/...`):**
   - Encapsulate 100% of domain business logic, scoring formulas, SLA timeouts, and integration orchestration.
   - External Speech AI calls must adhere to an **SLA timeout budget of 1500ms** via `AbortController`. If timeout occurs, record attempt with zero XP mutation and return appropriate fallback.

3. **Repositories (`src/core/repositories/...`):**
   - Manage isolated database access.
   - Multi-table mutations (`practice_attempts`, `user_stats`, `xp_ledger`) **MUST** be wrapped in an ACID PostgreSQL transaction with explicit row-level locking (`SELECT ... FOR UPDATE` on `user_stats`).
   - Implement idempotency checks using `UNIQUE(user_id, idempotency_key)` to prevent duplicate score or XP submissions.

4. **Frontend Components (`src/components/...`):**
   - Micro-component architecture: Keep presentation components modular, declarative, and accessible.
   - Use OKLCH tokens defined in `src/app/globals.css`.
   - Use semantic colors: Emerald/Green for correct phonemes (`score >= 8000`), Amber/Yellow for mild drift (`6000 <= score < 8000`), Coral/Red for erroneous articulation (`score < 6000`).

---

## 6. Critical Engineering Guardrails

### 6.1. Zero-Footprint In-Memory Audio
* Never write user microphone audio recordings to local disk or temp files.
* Keep audio strictly in memory as a Web Audio RAM Blob (16kHz mono).
* Always invoke `URL.revokeObjectURL(url)` immediately after audio playback or component unmount to prevent memory leaks.

### 6.2. Database & Data Integrity
* Primary Keys: RFC 9562 `UUIDv7` generated via timestamp-ordered IDs.
* Scores: Always stored as **Integer Basis Points** (`0..10000`, where `8500 = 85.00%`). Never use floating-point numbers for scores.
* Currency & XP: Stored as `BIGINT` in an immutable, append-only ledger (`xp_ledger`).
* Never run destructive DDL/DML (`DROP TABLE`, `TRUNCATE`, `DELETE` without `WHERE`).

### 6.3. Secret & Credential Protection
* Never commit `.env*` files, private keys, database passwords, or third-party API credentials to git.
* Always check `git status` and `git diff` before committing.

### 6.4. Git & Commit Guidelines
* Follow **Conventional Commits**:
  - `feat(scope): ...` for new features
  - `fix(scope): ...` for bug fixes
  - `refactor(scope): ...` for architectural cleanup without behavior changes
  - `test(scope): ...` for test additions or corrections
  - `chore(scope): ...` for dependency, CI, or tool updates

---

## 7. Jules Autonomous Execution & Pull Request Checklist

When Jules is assigned a task or triggered on a Pull Request:

1. **Step 1: Environment Sanity Check:** Verify `node -v` and run `npm ci || npm install`.
2. **Step 2: Database Migration Check:** Ensure the migration `database/migrations/0001_init_schema.sql` is compatible with the latest schema.
3. **Step 3: Test Verification:** Execute `npm test` and `npm run typecheck`. If any test fails, analyze the root cause and apply surgical fixes.
4. **Step 4: Pull Request Comment & Audit:**
   - Post an executive review summary detailing verified acceptance criteria.
   - Set status to **APPROVED ✅** if all tests pass.
   - **DO NOT AUTO-MERGE**: Leave the final merge authority exclusively to the Human Tech Lead (`Vanbien2525`).
