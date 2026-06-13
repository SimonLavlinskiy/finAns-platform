---
name: openspec-spec-review
description: Prepare spec-review PR (propose/<change> → main). Use after /opsx:propose or when spec artifacts need review.
license: MIT
compatibility: Requires git, openspec CLI. Schema spec-driven.
metadata:
  author: finAn
  version: "1.0"
---

Prepare **spec-review** for an OpenSpec change. **Agent runs all git/openspec commands** — user does not use the terminal.

**Input**: change name (optional — infer or ask).

## Steps

1. Announce `Using change: <name>`.

2. Verify artifacts:
   ```bash
   openspec status --change "<name>" --json
   ```
   Required: proposal.md, specs/, design.md, tasks_backend.md, tasks_frontend.md, test_case.md.

3. Commit and push (branch `propose/<name>` already created by `/opsx:propose`):
   ```bash
   git add openspec/changes/<name>/
   git commit -m "spec: propose <name>"
   git push -u origin propose/<name>
   ```

4. Output PR package (`propose/<name>` → `main`):
   - **Title:** `spec: <name> — <Title from proposal>`
   - **Reviewers:** из frontmatter proposal (или owner)
   - **After merge:** `/opsx:apply <stack>`

## Guardrails

- Do not edit `workspace/` in this phase — only spec artifacts.
- Do not run `/opsx:apply` before spec-PR merge (if team workflow applies).
