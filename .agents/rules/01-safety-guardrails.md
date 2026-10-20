---
description: "Global Safety Guardrails, Disaster Prevention, and Zero-Leakage Directives"
trigger: always_on
---

# Global Safety & Disaster Prevention Directives

> [!CAUTION]
> Any action carrying the potential for irreversible data loss, history corruption, secret exposure, or production service disruption MUST be guarded with automated fail-safes and requires explicit confirmation in interactive sessions.

## 1. Prohibited Destructive Operations (Blacklist & Safe Fallbacks)
Never generate or autonomously execute destructive commands without verified human consent:

### Filesystem & Workspace:
- **Prohibited:** Unconstrained recursive file deletions (`rm -rf *`, `Remove-Item -Recurse -Force`, `rmdir /s /q`).
- **Standard:** Target explicit paths; never execute wildcards against root or workspace parent directories.

### Version Control & Git History:
- **Prohibited:** Destructive history rewrites (`git push --force`, `git push -f`, uninspected `git clean -fd`).
- **Safe Rollback Mandatory Alternative:** Never run a naked `git reset --hard` on uncommitted or unsaved working trees. Always create an emergency checkpoint branch beforehand:
  ```powershell
  # Safe checkpoint pattern
  git checkout -b "rescue-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
  git add -A
  git commit -m "chore: emergency checkpoint before rollback"
  git checkout main
  ```

### Database DDL/DML & Migrations:
- **Prohibited:** Unconditional data purges (`DROP DATABASE`, `DROP TABLE`, `TRUNCATE TABLE`, `DELETE/UPDATE` without a `WHERE` clause).
- **Prohibited Migration CLI Resets:** `prisma migrate reset`, `drizzle-kit drop`, `alembic downgrade base`.
- **Non-Blocking DDL:** In PostgreSQL, never run raw table-locking index commands on production tables. Always append the concurrent flag:
  ```sql
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entity_lookup ON entities (column_name);
  ```

### Cloud & Infrastructure:
- **Prohibited:** Infrastructure tear-down commands (`terraform destroy`, `aws s3 rb --force`, `gcloud projects delete`).

## 2. Zero-Leakage Policy & Secret Protection
- **Credential Exposure Prevention:**
  - Never print, echo, or stream raw contents of sensitive files (`.env*`, `*.pem`, `*.key`, `id_rsa`, `service-account.json`, `credentials`).
  - Always supply sanitized placeholders in templates and generated configs: `API_KEY="your_api_key_here"`, `DB_PASSWORD="your_secure_password"`.
- **Indirect Leakage Prevention:**
  - **No Plaintext CLI Arguments:** Never pass raw secrets directly in shell arguments or flags (e.g., `docker run -e DB_PASS="secret"`), as they persist in OS process tables and shell history.
  - **No Environment Dumps:** Strictly forbid commands that output all active environment variables (`printenv`, `env`, `Get-ChildItem env:`).
  - **Masked HTTP Tracing:** Never enable verbose or payload-tracing flags (`-v`, `--trace`, `--trace-ascii`) in curl or HTTP clients when requests transmit Authorization, Cookie, or bearer token headers.
- **Pre-Flight Gitignore Audit:**
  - Before scaffolding or creating any local file that stores secrets, verify that its filename pattern exists within `.gitignore`. If missing, immediately append the rule to `.gitignore` prior to file creation.

## 3. Resilience, Snapshots & Non-Interactive Guardrails
- **Pre-Modification Snapshots:**
  - Prior to applying complex modifications to mission-critical infrastructure files (`docker-compose.yml`, `nginx.conf`, `tsconfig.json`, CI pipeline workflows), confirm the working tree is cleanly committed or persist an explicit backup snapshot (`.bak`).
- **Headless & Non-Interactive CI Fail-Safe:**
  - In automated, headless, or CI/CD execution environments (e.g., GitHub Actions, Jules, scheduled workers), if an unverified destructive command is encountered without pre-configured bypass flags, abort execution immediately with a non-zero exit code.
  - Never block or hang terminal pipelines waiting indefinitely for interactive standard input prompts (`[y/N]`).
- **Supply Chain Hygiene:**
  - Never pipe untrusted remote shell scripts directly into execution engines (e.g., `curl | bash`, `Invoke-Expression (iwr ...)`).
  - Always verify third-party package names against official public registries to prevent typosquatting attacks.
