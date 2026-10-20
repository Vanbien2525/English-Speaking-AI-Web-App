---
description: "Universal Git workflow, Trunk-Based branching strategy, and safety directives"
trigger: always_on
---

# Git Workflow & Conventional Commits Standards

All commits, branches, and pull requests across the repository must strictly adhere to the following version control and collaboration standards:

## 1. Conventional Commits Specification
Every proposed commit message must follow the international Conventional Commits pattern:
`<type>(<scope>): <short description>`

### Approved Types:
- `feat`: Introduce a new user-facing feature.
- `fix`: Patch a bug in the codebase.
- `refactor`: Restructure code without modifying external behavior or adding features.
- `perf`: Improve runtime execution speed, memory efficiency, or query performance.
- `test`: Add missing tests or correct existing unit, integration, or E2E test suites.
- `chore`: Update tooling, dependencies, or configuration without touching runtime logic.
- `docs`: Update documentation (README.md, docstrings, architecture diagrams).

### Breaking Changes:
- Append an exclamation mark (`!`) before the colon to denote backwards-incompatible changes:
  `feat(api)!: migrate auth payload from session token to jwt`

### Atomic Commits Principle:
- Separate database migrations, backend business logic, and UI components into distinct, modular commits. NEVER bundle an entire multi-tier system into a single monolithic commit.

### Valid Examples:
- `feat(auth): implement refresh token rotation with redis`
- `fix(payment): prevent duplicate transaction on network retry`
- `refactor(database): optimize user query using concurrent index`

## 2. Pre-Commit Safety & Secret Protection
Before staging and committing, always execute `git status` and `git diff --staged` to enforce repository hygiene:
- **Never Commit Secrets:** Strictly block all environment files (`.env*`), private keys, credentials, and API tokens.
- **Never Commit Build Artifacts:** Exclude dependencies and build output folders (`node_modules/`, `dist/`, `build/`, `target/`).
- **Never Commit System/IDE Files:** Ignore operating system artifacts (`.DS_Store`, `Thumbs.db`) and editor configurations (`.idea/`, `.vscode/`).
- **Automated Guardrails:** Pre-commit hooks (`husky` + `commitlint`) and secret scanners (e.g., Gitleaks) must actively block invalid commits at the local workstation.

## 3. Trunk-Based Branching Strategy
- **`main` is the Single Source of Truth:**
  - Direct commits and pushes to `main` are strictly prohibited.
  - All work must be conducted on short-lived, ephemeral feature branches.
- **Branch Naming Conventions:**
  - Feature: `feature/<feature-name>` (e.g., `feature/auth-login`, `feature/payment-stripe`)
  - Bug Fix: `fix/<issue-name>` (e.g., `fix/uuid-generation`, `fix/sql-injection-risk`)
  - Refactor: `refactor/<task-name>` (e.g., `refactor/modular-cards`)

## 4. Pull Request (PR) Lifecycle & Autonomous CI (GitHub Actions & Jules)

> [!IMPORTANT]
> **Single PR per Feature Mandate (Bắt buộc Duy Nhất 1 PR Mỗi Tính Năng):**
> Mỗi vòng đời tính năng chỉ được phép tồn tại **DUY NHẤT 1 Pull Request** từ `feature/<name>` vào `main`.
> Toàn bộ quá trình kiểm thử CI và audit/sửa lỗi của Google Labs Jules ở Giai đoạn 5 bắt buộc phải diễn ra trên cùng nhánh `feature/<name>` của PR đó. Jules phải commit trực tiếp vào nhánh tính năng hiện có để cập nhật thẳng vào PR duy nhất, giúp Tech Lead chỉ cần review và merge 1 lần duy nhất.
1. **Open Pull Request:**
   - Head (Source): `feature/<branch-name>`
   - Base (Target): `main`
   - Include a concise PR summary outlining technical changes, issue references, and verification steps.
2. **Automated CI Verification:**
   - GitHub Actions triggers automatically, initializes dependent service containers (e.g., PostgreSQL 16), and runs test/lint suites.
   - Google Labs Jules evaluates source code security, business logic integrity, and performance boundaries.
3. **Google Labs Jules Operational Contract (Learned Pattern):**
   - **Prerequisites:** Repository root MUST contain `AGENTS.md` specifying Node.js >=22.0.0, resilient install `npm ci || npm install`, strict test commands `npm test`, `npx tsc --noEmit`, and `npm run lint`.
   - **Issue-Triggered Autonomous Execution:** Applying the label `jules` to any GitHub Issue automatically dispatches Google Labs Jules to comment on the issue, spin up an isolated Google Cloud VM, implement code, execute `npm test` until 100% green, and submit a PR.
   - **PR Verification & Web Dashboard:** Jules can be monitored or dispatched directly via `https://jules.google.com` or configured via `google-labs-code/jules-action` with `JULES_API_KEY`.
   - If tests fail during execution, Jules captures the failure trace and applies self-healing code updates autonomously.
   - The CI pipeline re-triggers automatically to validate the patched state.
4. **Human Merge Authority & Strategy:**
   - Merging is permitted only when both GitHub Actions and Jules report full approval (Passed ✅).
   - Final authority belongs exclusively to human reviewers. Inspect the final diff and select **Squash and Merge**.
   - The squashed commit message on `main` must strictly follow Conventional Commits formatting.

## 5. Post-Merge Branch Pruning
- **Immediate Branch Deletion:**
  - Purge ephemeral branches immediately after merging to eliminate branch rot and remote clutter.
  - Enable GitHub's repository configuration: *"Automatically delete head branches"*.
- **Local Repository Cleanup:**
  ```bash
  git checkout main
  git pull origin main
  git branch -d <branch-name>
  git remote prune origin
  ```

## 6. Strict Git Anti-Patterns (NEVER DO)
- NEVER run destructive reset commands (`git reset --hard`, `git clean -fxd`) without explicit, prior user confirmation.
- NEVER run `git push --force` or `--force-with-lease` on `main`.
- NEVER run indiscriminate bulk additions (`git add .` or `git add -A`) without verifying `git status` to prevent staging untracked scratch files.
