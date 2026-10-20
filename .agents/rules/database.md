---
description: "Universal PostgreSQL architecture, performance, and data safety directives"
globs:
  - "src/db/**/*.ts"
  - "src/server/**/*.ts"
  - "prisma/schema.prisma"
  - "drizzle/**/*.ts"
  - "migrations/**/*.sql"
---

# PostgreSQL Core Safety & Performance Directives

All database schema designs, migrations, and queries must strictly adhere to the following production-grade standards:

## 1. Schema & Data Modeling
- **Primary Keys:** Use time-ordered `UUIDv7` (application-generated or via native functions) or auto-incrementing `BIGINT`. Never use random `UUIDv4` to prevent B-Tree index fragmentation.
- **Financial Precision:** Store currency in the smallest unit as `BIGINT` or `INTEGER` (e.g., cents, VND) or use `NUMERIC(precision, scale)`. NEVER use floating-point types (`FLOAT`, `REAL`, `DOUBLE`).
- **Timezone Awareness:** Always use `TIMESTAMPTZ` with `DEFAULT NOW()` for all temporal fields. Never use timezone-naive `TIMESTAMP`.
- **Audit Trails:** Critical entities must include non-destructive soft-delete capability (`deleted_at TIMESTAMPTZ NULL`) and audit timestamps (`created_at`, `updated_at`).

## 2. Transactions & Concurrency
- **Atomic Operations:** Wrap any multi-table mutations (>= 2 write operations) inside an explicit, single database transaction.
- **Race Condition Prevention:** For sensitive resource mutations (balances, inventory, seat quotas), eliminate race conditions using pessimistic row-level locking (`SELECT ... FOR UPDATE`) or optimistic concurrency control via a `version` column.

## 3. Indexing Strategy
- **Foreign Key Indexing:** Explicitly index every foreign key column to accelerate relational `JOIN` operations and prevent table-wide locks during cascade deletes.
- **Partial Indexes:** For low-cardinality status columns (`status`, `is_active`, `role`), use Partial Indexes (e.g., `CREATE INDEX ... WHERE status = 'pending'`) instead of full B-Tree indexes.
- **Compound Query Alignment:** Design multi-column indexes matching the exact `WHERE` and `ORDER BY` left-to-right query patterns.

## 4. Query Safety & Performance Boundaries
- **Mandatory Pagination:** All list/read queries must include an explicit `LIMIT` boundary (max 100 rows per request) to protect server memory pools from Out-Of-Memory (OOM) crashes.
- **Zero Accidental Data Loss:** Unconditional bulk `UPDATE` or `DELETE` statements without an explicit `WHERE` clause are strictly prohibited.
- **Eliminate N+1 Queries:** Never execute database queries inside iterative loops. Use batch joins, `JOIN FETCH`, or dataloaders instead.
- **Execution Timeouts:** Ensure client connections enforce strict query statement timeouts (e.g., `statement_timeout = 5000`) to prevent runaway blocking queries.
