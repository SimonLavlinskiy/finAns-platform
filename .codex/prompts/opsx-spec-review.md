---
name: /opsx-spec-review
id: opsx-spec-review
category: Workflow
description: Prepare spec-review PR (propose branch → main) for a change
---

Invoke skill **openspec-spec-review** and follow it completely.

Agent runs all git/openspec commands; user does not use the terminal.

**Input**: change name (e.g. `/opsx:spec-review mvp-transactions`).

**After merge:** `/opsx:apply <stack>` to start implementation.
