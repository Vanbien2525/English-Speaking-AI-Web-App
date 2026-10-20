---
description: "Universal Surgical Code Editing and Production Engineering Directives"
trigger: always_on
---

# Surgical Code Editing & Production Engineering Directives

All code modifications across existing files must strictly adhere to the following precision engineering and non-destructive standards:

## 1. Surgical Patching Mechanics & Tooling Guardrails
- **No Whole-File Rewrites:**
  - NEVER rewrite an entire existing file (> 25 lines) for localized logic modifications.
  - ALWAYS employ surgical string replacement or localized diff tools (`replace_file_content`, `str_replace_editor`, or platform equivalents). Full-file writes are strictly restricted to creating brand-new files.
- **Mandatory Read-Before-Write:**
  - Always verify exact line boundaries and surrounding context via `view_file` immediately before constructing a surgical edit call. Never guess line numbers from memory.
- **Unique Context Anchoring:**
  - Replacement targets (`TargetContent`) must include 1–3 lines of static surrounding context above and below to guarantee pattern uniqueness and eliminate matching collisions.
  - Maintain 100% character fidelity with leading indentation (tabs/spaces) and platform line endings (`CRLF` on Windows vs `LF` on Linux).
- **Multi-Location Sequential Edits:**
  - When modifying multiple non-contiguous blocks in the same file, apply edits sequentially in **bottom-to-top order** (highest line numbers first) to prevent line offset drift.

## 2. File Integrity & Code Preservation
- **Preserve Documentation & Context:**
  - Retain 100% of original comments, docstrings, license headers, and formatting.
  - Do not auto-reformat unchanged code sections or entire files unless explicitly requested.

## 3. Production Engineering Standards
- **Strict Typing:**
  - **TypeScript:** Zero `any`. Enforce `unknown` with runtime type narrowing, or declare explicit `interface`/`type` contracts for all payloads and components.
  - **Python:** Enforce Python 3.10+ modern typing syntax (pipe operator `|`, built-in generics `list[]`, `dict[]`) or Pydantic v2 schemas for data modeling. Avoid legacy `typing.Union` and `typing.List`.
- **Defensive Error Handling:**
  - Explicitly handle errors on all external I/O operations (network, filesystem, database).
  - Never swallow exceptions (e.g., empty `catch (e) {}`). All errors must be logged with contextual metadata, mapped to domain exceptions, or re-thrown safely.
- **Clean Layered Architecture:**
  - **Controllers / Routes:** Handle HTTP requests, validate input DTOs, and delegate directly to services.
  - **Services:** Encapsulate 100% of core business logic. Never access raw database drivers or DOM contexts directly.
  - **Repositories / DAOs:** Manage isolated data access and persistence, returning strictly typed domain models.

## 4. Strict Anti-Patterns (NEVER DO)
- NEVER insert lazy placeholder comments (e.g., `// ... existing code ...`, `// ... rest of implementation unchanged ...`, `/* TODO */`) that result in accidental code deletion.
- NEVER truncate functions or strip existing logic to save output tokens.
- NEVER perform blind surgical replacements without verifying the latest file state via `view_file`.
