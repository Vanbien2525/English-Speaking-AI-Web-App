---
description: "Universal Windows OS architecture and native PowerShell runtime directives"
trigger: always_on
---

# Windows Operating System & PowerShell Runtime Directives

The execution environment is **Windows 10/11** running **PowerShell** as the primary interactive shell. 
Never generate Linux/Bash-specific commands (`export`, `grep`, `cat`, `source`, raw `&&` without verification) that result in runtime execution errors.

## 1. Syntax Translation Matrix (Linux/Bash -> Windows PowerShell)

| Operation | PROHIBITED (Linux / Bash) | MANDATORY (Windows PowerShell) |
| :--- | :--- | :--- |
| **Set Environment Variable** | `export PORT=3000` | `$env:PORT = "3000"` |
| **Persist / Read Env Var** | `echo $PORT` | `$env:PORT` |
| **Read File Content** | `cat file.txt` | `Get-Content -Path "file.txt" -Raw -Encoding UTF8` |
| **Write File Content** | `echo "text" > file.txt` | `Set-Content -Path "file.txt" -Value "text" -Encoding UTF8` |
| **Append File Content** | `echo "text" >> file.txt` | `Add-Content -Path "file.txt" -Value "text" -Encoding UTF8` |
| **Command Chaining (Guarded)** | `cd app && npm start` | `Set-Location app; if ($?) { npm start }` (or native `&&` in PS 7+) |
| **Search String / Regex** | `grep -rn "error" .` | `Select-String -Path ".*" -Pattern "error" -AllMatches` |
| **Create Directory (Recursive)**| `mkdir -p a/b/c` | `New-Item -ItemType Directory -Path "a\b\c" -Force` |
| **Check Path Existence** | `test -f file.txt` | `Test-Path -Path "file.txt"` |
| **Delete File / Directory** | `rm -rf dir` | `Remove-Item -Path "dir" -Recurse -Force` |
| **Activate Python Virtualenv** | `source venv/bin/activate` | `.\venv\Scripts\Activate.ps1` |
| **HTTP Request** | `curl -X POST ...` | `curl.exe -X POST ...` or `Invoke-RestMethod` (Avoid alias collision) |

## 2. File Encoding, Escaping & Path Safety
- **Strict UTF-8 Encoding:**
  - Always enforce `-Encoding UTF8` on `Get-Content`, `Set-Content`, and `Out-File`. Default Windows PowerShell (5.1) outputs in ANSI or UTF-16 LE, which breaks JSON, YAML, `.env` configs, and package manager lockfiles.
- **Escape Character Rule:**
  - PowerShell uses the backtick (`` ` ``) as its escape character, NOT the backslash (`\`).
  - Example: Use `` `n `` for newline, `` `t `` for tab, and `` `" `` for nested double quotes inside expandable strings.
- **Path Separation Standard:**
  - **Terminal / CLI Commands:** Use standard Windows backslashes `\` or encapsulate paths with spaces in double quotes: `"C:\Users\Admin\Project\file.ts"`.
  - **Source Code, JSON, and YAML:** Always use forward slashes `/` (e.g., `"src/components/App.tsx"`) to prevent accidental regex or escape interpretation.
- **No Unix Root Assumptions:**
  - Never reference `/tmp`, `/var`, or `/home`. Use the designated project workspace or `$env:TEMP` for temporary artifacts.

## 3. Network, Process & Port Management
- **Find Process Occupying a Port:**
  ```powershell
  # Primary: Native TCP query
  Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess

  # Fallback: Netstat filter
  netstat -ano | findstr :3000
  ```
- **Terminate Process Safely:**
  ```powershell
  Stop-Process -Id <PID> -Force
  ```
- **Localhost vs 127.0.0.1 Resolution:**
  - If a local Node.js or Python service fails to connect over localhost due to IPv6 (`::1`) binding differences on Windows, explicitly fall back to `127.0.0.1`.

## 4. Script Execution & ExecutionPolicy Guardrails
- **Bypass Execution Policy:**
  - When invoking automated `.ps1` setup or migration scripts, bypass execution restrictions dynamically without modifying global system policy:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\setup.ps1
  ```
- **Python Virtualenv Execution Policy:**
  - If activating a virtual environment fails with `File cannot be loaded because running scripts is disabled`, run within the session:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  .\venv\Scripts\Activate.ps1
  ```

## 5. Strict Anti-Patterns (NEVER DO)
- NEVER generate Linux-specific shell commands (`export`, `source`, `chmod`, `sudo`, `which`, `apt-get`).
- NEVER run standalone `cd` commands (use the tool's working directory parameter `Cwd` instead).
- NEVER write files using redirection operators (`>`, `>>`) without specifying `-Encoding UTF8`.
