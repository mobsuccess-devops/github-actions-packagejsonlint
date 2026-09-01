---
name: branch-commit-pr-ticket
version: 1.3.0
description: Full automated workflow from local changes to a pull request with Linear ticket creation. Analyzes git diff, creates branch, commits, pushes, creates Linear ticket (French title, sub-issue of a `SUP-XXXX` support issue when one is given), and opens a PR linked to the ticket.
---

# Branch, Commit, Linear Ticket and PR Workflow

Automate the full workflow from local changes to a pull request with Linear ticket creation.

## Description (optional)

$ARGUMENTS

## Support Issue (optional)

If the description above contains a **`SUP-<digits>`** reference, the Linear issue created in Step 11 becomes a **sub-issue of it** (`parentId`). Only the literal `SUP-` prefix triggers this; any other identifier is treated as plain text.

Rules:

- **Do not validate the reference first.** No `get_issue` or `list_issues` call — pass the identifier directly to `save_issue` and let the server resolve it.
- **The child keeps the configuration resolved in Step 2.** Team, project, status and labels are the resolved ones; the child does **not** inherit the support issue's team or project. A parent on a different team is expected.
- **The support issue itself is never modified.** No status change, no label, and no PR link — Step 13 links the PR to the created child issue only.
- **`SUP-…` must never appear in the branch name, the PR title, or the PR body.** The GitHub↔Linear integration scans all three and would attach the PR to the support issue. Mentioning it inside the Linear child issue's description is safe (Linear-side backlink only).
- **Strip the reference before inferring anything else.** The remaining description text feeds the commit message, the French title and the PR body, so `SUP-1234` never leaks into them.
- **If the reference cannot be resolved**, never abort: see Step 11.

## CRITICAL: Fully Automatic Mode

**This command operates in FULLY AUTOMATIC mode:**

- NEVER ask the user for any information
- NEVER prompt for confirmation
- NEVER ask questions about type, scope, description, priority, or estimate
- Automatically infer EVERYTHING from git diff, file paths, and code changes
- Proceed directly from analysis to ticket/PR creation

The command should be a single, seamless operation that requires zero user input.

## Instructions

### Step 1: Analyze Changes and Auto-Generate Everything

**CRITICAL**: NEVER ask the user for information. Automatically infer everything from the git diff and commits.

1. **Run analysis commands**:

   ```bash
   git status
   git diff --stat
   git diff
   git log --oneline -1  # Get last commit message if any
   ```

   **If no changes detected**: If `git status` shows a clean working tree (no staged or unstaged changes, and no untracked files), print a message and EXIT the workflow - do NOT create any branch, commit, ticket, or PR. **Untracked files count as changes** — proceed with the workflow if any exist (they will be staged in Step 5).

2. **Auto-detect all properties**:

   a. **Type** (chore, fix, feat, refactor, test, docs, style):
   - Look at file paths and changes
   - `fix`: Bug fixes, error corrections, validation fixes
   - `feat`: New components, new features, new functionality
   - `chore`: Dependencies, config, tooling, cleanup
   - `refactor`: Code restructuring without behavior change
   - `style`: Formatting, code style changes
   - `test`: Test files (.test., .spec., visual-test)
   - `docs`: README, comments, documentation files

   b. **Scope** (from file paths and business domains):
   - Find the best topic based on business domains
   - For multiple topics: use most significant one
   - Extract from directory structure or package names

   c. **Description**:
   - Analyze the actual code changes
   - Look at function names, component names, variable names
   - Identify the main change
   - Keep it concise and descriptive
   - Focus on WHAT changed, not HOW

   d. **Priority** (default to 3 - Medium, unless the change clearly matches one of these criteria):
   - 1 (Urgent): Security fixes, production blockers
   - 2 (High): Critical bugs, data loss prevention
   - 3 (Medium): Standard changes (default)
   - 4 (Low): Minor improvements, nice-to-haves

   e. **Estimate** (auto-calculate using rubric - Fibonacci sequence):
   - **1 point (Trivial)**: < 20 lines changed, 1-2 files
   - **2 points (Simple)**: 20-50 lines changed, 3 files
   - **3 points (Moderate)**: 50-150 lines changed, 4-5 files
   - **5 points (Complex)**: 150-300 lines changed, 6-9 files
   - **8 points (Very Complex)**: 300-500 lines changed, 10-14 files
   - **13 points (Highly Complex)**: 500-1000 lines changed, 15-19 files
   - **21 points (Extremely Complex)**: 1000+ lines changed, 20+ files

   f. **Labels** (auto-select based on type — final label list is built in Step 9 using config from Step 2):
   - Business Unit label (from config, default: "MOBSUCCESS Group")
   - Type label based on change type:
     - `fix` → "Bug 🐞"
     - `feat` → "Feature ✨"
     - `chore`, `refactor`, `style`, `docs`, `test` → "Improvement 🛠️"
   - Team label (from config, if present)
   - Product label (from config, if present)

3. **Generate ticket description automatically**:

   ```markdown
   ## Problem

   <infer from the changes - what was broken/missing/inefficient>

   ## Solution

   <describe the approach taken in the code>

   ## Changes

   - <list modified files and key changes>

   ## Impact

   - <technical impact: performance, maintainability, etc.>
   - <business impact if any>
   ```

4. **NEVER ask for confirmation or clarification** - proceed directly to execution

### Step 2: Resolve Linear Configuration

Resolve each Linear field using a **4-level priority chain**. For each field, use the first level that provides a value:

1. **User conversation** — The user explicitly mentioned a preference earlier in this conversation (e.g., "use project X", "put it in team Y")
2. **Project context** — Already loaded in your system prompt from `CLAUDE.md` or `AGENTS.md`. Do NOT read these files — they are already in your context. Look for a `## Linear` section or similar instructions mentioning team, project, status, labels, etc.
3. **`.mobsuccess.yml`** — Read and parse the file at the project root:
   ```bash
   cat .mobsuccess.yml 2>/dev/null
   ```
4. **Command defaults** — Hardcoded fallback values (see table below)

#### Fields to resolve

| Field                     | Level 2: Context examples               | Level 3: `.mobsuccess.yml` keys (first match wins)                                            | Level 4: Default             |
| ------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------- |
| **team**                  | "Team: **Experiences**"                 | `linear.cli_defaults.feature_team` → `linear.team_identifier` → `linear.main_team_identifier` | `FT Tech Foundation`         |
| **project**               | "Project: **Workshop Experience 2026**" | `linear.cli_defaults.project[<team>]` (map) → `linear.project` (string)                       | `FT Tech - RUN`              |
| **status**                | "Initial status: **To Dev**"            | `linear.cli_defaults.status[<team>]` (map) → `linear.default_state`                           | `QA Accepted`                |
| **team_label**            | _(if mentioned)_                        | `linear.cli_defaults.team_label` → `linear.team_label_identifier`                             | _(none)_                     |
| **business_unit_label**   | _(if mentioned)_                        | `linear.cli_defaults.business_unit_label`                                                     | `MOBSUCCESS Group`           |
| **product_label**         | _(if mentioned)_                        | `linear.cli_defaults.product_label`                                                           | _(none)_                     |
| **priority_override**     | _(if mentioned)_                        | `linear.cli_defaults.priority`                                                                | _(none — use auto-detected)_ |
| **linear_issue_required** | _(if mentioned)_                        | `linear.linear_issue_required`                                                                | `true`                       |

#### `.mobsuccess.yml` patterns

Multiple config patterns exist across repos. The resolution order in the table above handles all of them:

- **Minimal**: `linear.team_identifier` + `linear.team_label_identifier` under `linear:` node
- **cli_defaults with maps**: `linear.cli_defaults.feature_team`, `linear.cli_defaults.project.FTTECH`, `linear.cli_defaults.status.FTTECH`, etc.
- **Cross-team**: `linear.main_team_identifier` + `linear.cli_defaults.feature_team` overriding it

#### Early exit

If `linear_issue_required` resolves to `false`, skip all Linear-specific steps (including inferring the issue type label in Step 8, and Steps 9–11 and 13). When creating the PR, do not include any Linear ticket reference (no ticket ID in the title or body).

#### Validation

After resolving all fields, verify the team and project exist in Linear:

1. Call `get_team` with the resolved **team**. If not found, warn and fall back to default `"FT Tech Foundation"`.
2. Call `get_project` with the resolved **project**. If not found, warn and fall back to default `"FT Tech - RUN"`.

**Note**: If the context already provides UUIDs (e.g., `ID: 930b37e3-...`), you may use them directly without calling `get_team`/`get_project`.

Store all resolved and validated values for use in subsequent steps.

### Step 3: Determine Branch Name

- Generate the target branch name from the inferred type and description:
  - Format: `type/short-description` (see Reference: **Branch naming types**)
  - Example: `feat/add-user-profile`, `fix/auth-redirect`
- If already on a branch whose name is valid, use it
- If on `main`/`master`, create the generated valid branch
- If on any other branch whose name is invalid, including temporary worktree branches such as `worktree-feat+...`, `codex/...`, or branches containing `+`:
  - Do **not** reuse that branch for the PR
  - Rename the current branch to the generated valid branch if it has no upstream yet
  - Otherwise create a new generated valid branch from the current HEAD
  - Preserve the current working tree and staged changes

**IMPORTANT**: Branch name format is `<type>/<description>`, NOT `<ticket>-<description>` or a worktree/tool prefix.

Validate branch names with this rule before pushing or opening the PR:

```text
^(chore|fix|feat|refactor|style|test|docs)/[a-z0-9]+(-[a-z0-9]+)*$
```

If the current branch fails this validation, fix the branch name in Step 4 before continuing.

### Step 4: Create Branch (if needed)

```bash
CURRENT_BRANCH=$(git branch --show-current)
VALID_BRANCH_REGEX='^(chore|fix|feat|refactor|style|test|docs)/[a-z0-9]+(-[a-z0-9]+)*$'

if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  git checkout -b <branch-name>
elif [ -z "$CURRENT_BRANCH" ]; then
  git checkout -b <branch-name>
elif ! printf '%s' "$CURRENT_BRANCH" | grep -Eq "$VALID_BRANCH_REGEX"; then
  if ! git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
    git branch -m <branch-name>
  else
    git checkout -b <branch-name>
  fi
fi
```

### Step 5: Safety-Check Untracked Files

Before staging anything, scan for untracked files that should not be committed:

```bash
git ls-files --others --exclude-standard
```

Flag and **STOP the workflow** (do not stage, commit, push, or create a ticket) if any untracked file matches a suspicious pattern:

- Secrets / credentials: `.env`, `.env.*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*secret*`, `*credential*`, `*password*`, `*token*`
- Build / cache artefacts: `*.pyc`, `__pycache__/`, `node_modules/`, `dist/`, `build/`, `.cache/`
- Editor / OS noise: `.DS_Store`, `Thumbs.db`, `*.swp`, `*.swo`, `*~`
- Debug / temp: `*.log`, `*.tmp`, `*.bak`, `debug.*`, `test-output*`

When stopping, tell the user **which files matched** and suggest either adding them to `.gitignore` or reviewing them before proceeding.

If no suspicious files are found, continue to Step 6.

### Step 6: Stage and Commit

- Stage all relevant changes **including untracked files** with `git add -A` (or `git add .`) so new files are never forgotten. Files in `.gitignore` are excluded automatically.
- Generate a conventional commit with Co-authored-by trailer — see Reference: **Commit format with Co-authored-by**
- Create the commit (use `git commit -m "..."` or `-F -` with heredoc for multi-line)

### Step 7: Push to Remote

```bash
git push -u origin <branch-name>
```

### Step 8: Infer Issue Type Label

Based on branch/change type:

- `feat/` → Type = "Feature ✨"
- `fix/` → Type = "Bug 🐞"
- `chore/`, `refactor/`, `style/`, `docs/`, `test/` → Type = "Improvement 🛠️"

### Step 9: Gather Linear Data

Use Linear MCP to find required UUIDs:

1. **Team**: Find team using resolved **team** from Step 2
2. **Project**: Find project using resolved **project** from Step 2. If multiple projects match, select the one with the exact name match.
3. **Labels**: Find these labels by name using `list_issue_labels`:
   - **IMPORTANT** — This API returns PAGINATED results. Iterate through ALL pages (pass `cursor` when `hasNextPage` is true) until you have UUIDs for every required label. Do NOT stop after the first page.
   - Business Unit: resolved **business_unit_label** from Step 2 (default: "MOBSUCCESS Group")
   - Type: "Feature ✨", "Improvement 🛠️" or "Bug 🐞" (based on Step 8)
   - Team label: resolved **team_label** from Step 2 (only if present — skip if empty/none)
   - Product label: resolved **product_label** from Step 2 (only if present — skip if empty/none)
4. **Status**: Find resolved **status** from Step 2 (default: "QA Accepted") via `list_issue_statuses` with team UUID
5. **Current User**: Get authenticated user for assignee
6. **MCP Tool Schema**: Before calling `save_issue`, check the tool descriptor/schema for the exact parameter names (e.g. `projectId`, `labelIds`, `stateId`). Use the names from the schema.

### Step 10: Generate Linear Title and Description

**Title**: Actionable verb in infinitive form, max 17 words, in French

- Example: "Ajouter un endpoint pour récupérer les utilisateurs actifs"
- Example: "Corriger le bug d'authentification sur la page login"

**Description**:

```markdown
## Problem

<what issue are we solving - infer from the changes>

## Solution

<how we're solving it - describe the approach>

## Changes

- <file 1>: <what changed>
- <file 2>: <what changed>

## Impact

- <technical impact>
- <business impact if any>
```

### Step 11: Create Linear Issue

Create an issue via Linear MCP with all UUIDs retrieved in Step 9:

```
title: <generated French title>
description: <generated description with Problem/Solution/Changes/Impact>
team: <resolved team from Step 2> (use UUID)
status: <resolved status from Step 2> (use UUID)
assignee: me
priority: <priority_override from Step 2 if set, otherwise auto-detected 1-4>
estimate: <calculated from rubric - MANDATORY>
project: <resolved project from Step 2> (use UUID)
labels: [
  <business_unit_label> (use UUID),
  <Type label> (use UUID),
  <team_label> (use UUID — only if present from Step 2),
  <product_label> (use UUID — only if present from Step 2)
]
parentId: <SUP-XXXX — only if the description carried a support reference; omit otherwise>
```

**Unresolvable parent**: if the call fails because of `parentId` (unknown or inaccessible support issue), the issue was not created. Re-send the same `save_issue` **without** `parentId`, then warn loudly in the final output. A bad support reference must never abort a workflow whose commit is already pushed.

**IMPORTANT**: The `estimate` parameter is mandatory and must be provided using the Fibonacci rubric (1, 2, 3, 5, 8, 13, 21).

**Post-create validation**: After creating the issue, call `get_issue` to verify it has the correct project and labels. If missing, call `save_issue` with the issue `id` to add `projectId` and `labelIds`. If updates still don't persist, suggest the user verify the Linear MCP is enabled (see Common Issues: "Linear updates don't persist").

The issue identifier (e.g., `FTTECH-123`) will be used in the next step.

### Step 12: Create Pull Request

Use GitHub CLI to create the PR **with the Linear ticket ID already in the title**:

```bash
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
gh pr create --base "$DEFAULT_BRANCH" --title "type(scope): description [ISSUE_ID]" --body "..."
```

**PR Title:** `type(scope): description [FTTECH-XXX]` - Max 150 characters

- Include the Linear issue identifier from Step 11
- Example: `feat(user): add profile endpoint [FTTECH-123]`
- Always the **created** issue, never the support issue: no `SUP-…` string in the title or the body, otherwise the integration attaches this PR to the support issue as well

**PR Body:** Follow the repository's PR template if it exists, otherwise use:

```markdown
## What Does It Do?

<brief description of what this PR does>

## Context

<why this change is being made, what problem it solves, links to relevant discussions>

## Test Plan

- [ ] <how to verify this works>
```

### Step 13: Link PR to Linear Ticket and Ensure Status

**13a. Add PR link to ticket**

Get the PR URL:

```bash
gh pr view --json url --jq '.url'
```

Then call `save_issue` with the issue `id` and `links: [{ url: "<pr_url>", title: "PR #<number>" }]` to attach the PR to the Linear ticket.

**13b. MANDATORY status verification loop — DO NOT SKIP**

The workflow is **not complete** until this loop is executed. The GitHub-Linear integration often switches the ticket to "Development In Progress"; the resolved status (default: "QA Accepted") must be restored.

1. **Wait 1–2 seconds** after adding the PR link (to let the integration apply its changes)
2. **Call `get_issue`** with the issue identifier (e.g. `FTTECH-123`) to read the current status
3. **If status ≠ target** (resolved status from Step 2): call `save_issue` with `state: "<target status>"` (e.g. `"QA Accepted"`)
4. **Repeat** steps 2–3 up to **5 times** (wait 1–2 seconds between each check)
5. **If status still reverts** after 5 retries: tell the user: "Status remains 'Development In Progress' — please set to 'QA Accepted' manually in Linear, or adjust the GitHub-Linear integration rules." Also suggest checking the Linear MCP is enabled (see Common Issues: "Linear updates don't persist")

**CRITICAL**: Skipping this loop causes PRs to stay unmergeable. Always execute it when a Linear ticket was created.

## Output

When complete, display:

```
## Workflow Complete

### Git
- **Branch**: `<branch_name>`
- **Commit**: <commit_hash_short> - <commit_message>

### Pull Request
- **Title**: <pr_title>
- **URL**: <pr_url>

### Linear Ticket
- **Status**: <resolved status>
- **Issue**: <issue_identifier> - <title>
- **URL**: <linear_url>
- **Project**: <resolved project>
- **Parent**: <SUP-XXXX> (omit this line when no support issue was given)
- **Priority**: <priority> | **Estimate**: <estimate>
```

If the parent could not be resolved, replace the `Parent` line with:

```
- ⚠️ **Parent**: `SUP-XXXX` could not be resolved — ticket created without a parent, link it manually in Linear
```

## Common Issues & Solutions

### Issue: "Branch name is invalid"

**Solution**: Branch must be `<type>/<description>`, NOT include ticket number.

- correct: `chore/remove-exports`
- wrong: `fttech-123-remove-exports`

### Issue: "Issue does not have a Teams label"

**Solution**: Ensure these labels are added:

- Business Unit label (from config, default "MOBSUCCESS Group")
- Type label: "Improvement 🛠️", "Feature ✨", or "Bug 🐞"
- Team label (if resolved from context or config)
- Product label (if resolved from context or config)

### Issue: "PR not mergeable"

**Solution**: Linear ticket status must match the resolved status (default: "QA Accepted")

### Issue: "Status keeps changing back"

**Solution**: The GitHub-Linear integration may override status. Use the retry loop with delays to ensure status stays at the resolved target value.

### Issue: "Support issue `SUP-XXXX` not found"

**Solution**: Re-create the issue without `parentId` and warn the user in the output. Never abort the workflow, and never validate the reference with an extra `get_issue` call beforehand.

### Issue: "The PR got attached to the support issue"

**Solution**: A `SUP-…` string leaked into the branch name, PR title or PR body — the GitHub↔Linear integration scans all three. Remove it there; the reference belongs in `parentId` (and optionally the child issue's description), nowhere else.

### Issue: "Linear updates don't persist" (project, labels, status unchanged after save_issue)

**Solution**: The Linear MCP may be disabled or disconnected. Ask the user to verify it is enabled in their environment.

## Defaults Summary

All fields follow the **4-level priority chain**: User conversation > CLAUDE.md/AGENTS.md context > `.mobsuccess.yml` > Command defaults.

| Setting               | Command default (Level 4)                                   |
| --------------------- | ----------------------------------------------------------- |
| Team                  | `FT Tech Foundation`                                        |
| Project               | `FT Tech - RUN`                                             |
| Status                | `QA Accepted`                                               |
| Team Label            | _(none)_                                                    |
| Business Unit         | `MOBSUCCESS Group`                                          |
| Product Label         | _(none)_                                                    |
| Priority              | Medium (3) — auto-detected                                  |
| Linear Issue Required | `true`                                                      |
| Estimate              | Auto-calculated (Fibonacci: 1, 2, 3, 5, 8, 13, 21)          |
| Type                  | Improvement 🛠️ (or Bug 🐞 if `fix/`, Feature ✨ if `feat/`) |

## Reference

### Commit format with Co-authored-by (required)

Always append the Co-authored-by trailer so the AI appears as co-author on GitHub. **Use your platform's identity** — this is a placeholder per platform, not a fixed string to copy.

- **Cursor**: use `Cursor <cursoragent@cursor.com>` (example below)
- **Claude/Codex/Copilot/others**: check your platform's docs

```bash
git commit -m "fix(athena): hide reason and URL from unauthorized clients

Co-authored-by: $PLATFORM_COAUTHOR"
```

Replace $PLATFORM_COAUTHOR with your platform's identity.
For longer messages, use a file or heredoc to avoid shell escaping issues.

### Branch naming types

- `chore/` - Maintenance, cleanup, dependencies
- `fix/` - Bug fixes
- `feat/` - New features
- `refactor/` - Code refactoring
- `style/` - Formatting changes
- `test/` - Adding/updating tests
- `docs/` - Documentation changes

### Priority levels

| Level | Name   | Use for                             |
| ----- | ------ | ----------------------------------- |
| 1     | Urgent | Security fixes, production blockers |
| 2     | High   | Critical bugs, data loss prevention |
| 3     | Medium | Standard changes (default)          |
| 4     | Low    | Minor improvements, nice-to-haves   |

### Estimate rubric (Fibonacci sequence)

| Points | Lines Changed | Files | Complexity                            |
| ------ | ------------- | ----- | ------------------------------------- |
| 1      | < 20          | 1-2   | Trivial                               |
| 2      | 20-50         | 3     | Simple                                |
| 3      | 50-150        | 4-5   | Moderate                              |
| 5      | 150-300       | 6-9   | Complex                               |
| 8      | 300-500       | 10-14 | Very Complex                          |
| 13     | 500-1000      | 15-19 | Highly Complex                        |
| 21     | 1000+         | 20+   | Extremely Complex (split recommended) |

### Required labels

1. **Business Unit**: From `linear.cli_defaults.business_unit_label` or fallback `"MOBSUCCESS Group"` (always required)
2. **Type**: One of "Improvement 🛠️" (chore, refactor, style, docs, test), "Feature ✨" (feat), "Bug 🐞" (fix)
3. **Team**: From `linear.cli_defaults.team_label` or `linear.team_label_identifier` (optional, included only if configured)
4. **Product**: From `linear.cli_defaults.product_label` (optional, included only if configured)
