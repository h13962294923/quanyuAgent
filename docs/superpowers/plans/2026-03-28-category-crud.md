# Category CRUD Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make monitor categories real SQLite-backed data with add, rename, delete, and list behavior that drives the dashboard UI.

**Architecture:** Add a dedicated `categories` table as the source of truth, seed the current default categories into it, expose category CRUD through local Next.js APIs, and switch the client to load and mutate categories through those APIs. Deleting a category will cascade through settings, collected articles, and collection runs inside a transaction.

**Tech Stack:** Next.js App Router, React, better-sqlite3, Node test runner

---

## Chunk 1: Database Model

### Task 1: Add failing database tests for category lifecycle

**Files:**
- Create: `tests/category-crud.test.mjs`
- Modify: `lib/content-monitor-db.mjs`

- [ ] **Step 1: Write the failing tests**

```js
test('initializeDatabase seeds the default categories once', () => {});
test('createCategory adds a new category with a generated color and order', () => {});
test('renameCategory updates only the category name', () => {});
test('deleteCategory removes the category, settings, articles, and collection runs', () => {});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/category-crud.test.mjs`
Expected: FAIL with missing category helpers

- [ ] **Step 3: Write minimal implementation**

Add the `categories` table, seed helpers, CRUD helpers, validation, and transactional delete in `lib/content-monitor-db.mjs`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/category-crud.test.mjs`
Expected: PASS

## Chunk 2: Category APIs

### Task 2: Expose categories through local API routes

**Files:**
- Create: `app/api/categories/route.js`
- Create: `app/api/categories/[categoryId]/route.js`
- Modify: `lib/wechat-collection-service.mjs`

- [ ] **Step 1: Write the failing tests**

Add API-level tests or helper-level assertions for:
- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/:id`
- `DELETE /api/categories/:id`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL due to missing routes or missing behavior

- [ ] **Step 3: Write minimal implementation**

Implement list/create/rename/delete handlers and make settings creation rely on real categories.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

## Chunk 3: Dashboard Wiring

### Task 3: Replace in-memory categories with API-backed state

**Files:**
- Modify: `app/page.js`
- Modify: `app/globals.css`
- Modify: `lib/category-config.mjs`

- [ ] **Step 1: Write the failing tests**

Extend view/data tests where practical, then manually verify:
- new categories appear and become active
- rename updates sidebar and header
- delete cascades and switches to a fallback category

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL or coverage gap identified before implementation

- [ ] **Step 3: Write minimal implementation**

Load categories from API on startup, add rename/delete actions, handle loading/error states, and keep the add modal wired to the new API.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

## Chunk 4: Final Verification

### Task 4: Verify the full flow

**Files:**
- Modify as needed based on verification fixes

- [ ] **Step 1: Run automated verification**

Run:
- `npm test`
- `npm run lint`
- `npm run build`

Expected: all commands exit 0

- [ ] **Step 2: Run manual browser verification**

Check:
- create category
- rename category
- delete category with cascade
- content/settings tabs still load for the active category

- [ ] **Step 3: Summarize results and residual risks**
