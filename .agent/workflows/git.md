---
description: git
---

Git is REQUIRED for all work.

The agent must use Git as part of its workflow.

---

## Core Rules

1) Never make large changes without commits.

2) Commit after each completed step or workflow.

3) Never rewrite history unless explicitly told.

4) Prefer small commits over big ones.

5) Each feature must be in its own branch.

---

## Branch Strategy

main → production-ready only

dev → integration branch

feature/* → all work happens here

Examples:
feature/auth
feature/registration
feature/judging
feature/leaderboard

---

## Required Flow

Before starting work:

git checkout -b feature/<name>

During work:

git add .
git commit -m "feat: <clear description>"

After workflow completion:

git checkout dev
git merge feature/<name>

---

## Commit Style

Use conventional commits:

feat: new feature
fix: bug fix
refactor: internal improvement
docs: documentation
chore: setup/config

Examples:
feat: implement team registration API
fix: prevent duplicate scoring
refactor: simplify leaderboard query

---

## Safety Rules

Before risky refactors:
Create a commit checkpoint.

Before DB migrations:
Commit schema changes first.

Never delete code without commit history.

---

## Definition of Done (Git)

A workflow is NOT complete unless:

- Changes committed
- Branch merged or ready
- No untracked files