---
description: "Universal Backend API architecture, security guardrails, and error handling directives"
globs:
  - "src/server/**/*.ts"
  - "src/api/**/*.ts"
  - "src/app/api/**/*.ts"
  - "src/controllers/**/*.ts"
  - "src/services/**/*.ts"
---

# Backend Core Architecture & Security Directives

All server-side APIs, controllers, and services must strictly adhere to the following production-grade standards:

## 1. Input Validation & DTO Hygiene
- Every incoming HTTP request payload (body, query, params) must be validated at the boundary using a strict schema parser (e.g., Zod).
- Strip unknown or unexpected fields automatically (`zod.strip()`).
- Zero `any` in TypeScript. All service methods, DTOs, and repository queries must have explicit typed interfaces.

## 2. Authentication, Authorization & IDOR Prevention
- NEVER trust `userId` or user identity supplied in request bodies or query parameters.
- Always extract and enforce user identity strictly from the cryptographically verified session token or JWT extracted from secure HTTP-only cookies or authorization headers.
- Multi-tenancy guardrail: All mutation queries (`UPDATE`, `DELETE`) and detail fetches must enforce ownership checks (e.g., `WHERE id = :id AND user_id = :authenticatedUserId`).

## 3. Error Handling & HTTP Status Discipline
- Clean Error Mapping: Catch domain and database-specific exceptions and map them to standard HTTP status codes:
  - Validation Failure -> `400 Bad Request`
  - Unauthorized / Unauthenticated -> `401 Unauthorized`
  - Forbidden / Access Denied -> `403 Forbidden`
  - Record Not Found -> `404 Not Found`
  - Unique Constraint Violation / Conflict -> `409 Conflict`
  - Unhandled Internal Errors -> `500 Internal Server Error`
- Observability: Always log unexpected errors internally with structured context (request ID, timestamp, error stack).
- Sensitive Data Masking: NEVER log passwords, credit cards, or raw JWTs to console or log aggregators.

## 4. Strict Anti-Patterns (NEVER DO)
- NEVER concatenate raw strings into SQL queries. Always use parameterized queries or trusted ORM interfaces to prevent SQL Injection.
- NEVER expose internal database error stacks, SQL query traces, or sensitive table schemas in API responses returned to the client.
- NEVER swallow errors silently with empty `catch (e) {}` blocks without logging and handling.
- NEVER bypass authentication middleware on protected endpoints.
