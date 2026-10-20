<!-- JULES_AUTOMATION_TRIGGER: CODE_REVIEW_AND_VERIFY -->

## 🤖 GITHUB JULES AUTOMATED VERIFICATION DIRECTIVE

GitHub Jules: Please automatically execute the following independent audit for this Pull Request:

### 1. Sandbox Test Execution
- Sandbox Runtime: Clean Linux Container (Ubuntu Latest)
- Database: Verify PostgreSQL connection & migrations
- Commands: `npm test` & `npx tsc --noEmit` & `npm run lint`

### 2. Audit Checklist
- [ ] ZERO REGRESSION: 100% of existing tests and new acceptance tests must PASS.
- [ ] SECURITY AUDIT: Check for OWASP Top 10 vulnerabilities, unindexed queries, raw SQL injection, and IDOR vulnerabilities.
- [ ] ATOMIC TRANSACTIONS: Ensure all multi-table database operations are wrapped inside a PostgreSQL Transaction.
- [ ] ZERO SECRET LEAK: Verify no `.env` or credentials exist in git diffs.

### 3. Policy on Merge
- If all checks PASS: Post an executive summary review comment and set review status to **APPROVED ✅**.
- DO NOT AUTO-MERGE: Leave the final merge decision to the Tech Lead (Human).
- If checks FAIL: Push automated fix commits to this PR branch if possible, or report exact failure traces.
