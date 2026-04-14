# SMU Classroom Dashboard — Full Project Audit
**Date:** 2026-04-13  
**Scope:** Full codebase review — security, architecture, bugs, UX, and improvement roadmap

---

## 1. What the Project Is

A **React + Firebase + Flask** smart classroom management dashboard for SMU (Sousse Medical University). Professors log in, see their live classroom sessions (sensors, attendance, device controls), and review/export attendance history. An admin panel manages professor accounts and course assignments.

**Stack:**
- Frontend: React 19, Vite 8, Tailwind CSS 4, React Router 7, Firebase JS SDK 12
- Realtime DB: Firebase Realtime Database (RTDB)
- Auth: Firebase Authentication (email/password only)
- Backend: Flask (SQLite/PostgreSQL via SQLAlchemy) — serves professor/course/student data from a local academic database (Moodle-style schema)
- IoT: Raspberry Pi publishes sensor/device/attendance data directly to Firebase RTDB

---

## 2. What's Working Well

- **Authorization layering is solid**: Database rules + client-side `hasRoomAccess()` + session ownership checks (`professorUid`/`professorId`) provide defense in depth.
- **Mock mode** (`VITE_USE_MOCK=true`) is well-implemented — every hook has a clean mock path.
- **Atomic transactions** in `transactionHelpers.js` for course assignments prevent data races.
- **Schedule normalization** (`scheduleHelpers.js`) correctly handles both Flask and Firebase format divergence.
- **Auth state machine** (`status`: loading → unauthenticated/professor/admin/not-approved) is clean and easy to route on.
- **`useSession` ownership check** prevents a professor from seeing another professor's session in the same room.

---

## 3. Vulnerabilities

### 🔴 CRITICAL

#### V1: `adminjson.json` committed to git history
`adminjson.json` exists in the repo root **and is tracked in git** (present in 9 commits). Even though it currently only contains admin UIDs, it was previously found alongside `serviceAccountKey.json` during a period of active debugging, and the file name implies it may have contained more sensitive data at some point.

**Fix:** Run `git filter-repo --path adminjson.json --invert-paths` to purge it from history. Add `adminjson.json` to `.gitignore`.

#### V2: Firebase config exposed via `.env.local` (in .gitignore — but was it always?)
The `.env.local` file contains real Firebase credentials (`AIzaSyB...`, project ID, app ID, sender ID). The `.gitignore` entry `*.local` protects it **now**, but earlier commits should be audited. Firebase web API keys are semi-public (they identify the project), but the **Measurement ID and Sender ID** don't need to be in a public repo.

**Fix:** Add `.env.local` explicitly to `.gitignore` (already done), verify it was never committed, rotate credentials if unsure.

#### V3: Database rules allow ANY authenticated user to read ALL data
```json
".read": "auth != null || root.child('_system').child('allowUnauthenticatedRead').val() === true"
```
This **root-level read rule** means **every authenticated user can read every path** that doesn't have a more restrictive rule. This includes:
- `/sessions` — all sessions for all professors
- `/classrooms` — all classroom data (partially overridden but root fallthrough may apply)
- `/pendingProfessors` — list of pending professors including emails

**Fix:** Remove the root-level `auth != null` read. Define explicit read rules per path. Use `.read: false` as the default.

#### V4: `admins` node is publicly readable
```json
"admins": {
  ".read": "true"  ← anyone (even unauthenticated) can list all admin UIDs
}
```
This exposes a list of admin Firebase UIDs to the public. While UIDs alone don't grant access, they reduce the attack surface for social engineering and enumeration.

**Fix:** Change `admins/.read` to `auth != null` at minimum.

---

### 🟠 HIGH

#### V5: No rate limiting on login
`Login.jsx` only validates `@smu.tn` email format client-side. Firebase auth `too-many-requests` is the only protection. A credential-stuffing attack against known `@smu.tn` emails would work silently until Firebase throttles.

**Fix:** Add Firebase App Check to prevent automated clients. Consider a CAPTCHA after 3 failed attempts (client-side count stored in sessionStorage).

#### V6: `serviceAccountKey.json` is in the repo root (working tree)
Even though it's `.gitignore`'d, the file exists at `c:/.../serviceAccountKey.json` inside the project directory. If a developer accidentally runs `git add .` or a tool scans the directory, it could leak.

**Fix:** Move service account keys outside the project directory entirely (e.g., `C:/Users/lenovo/.firebase/`). Use environment variables in production.

#### V7: Flask backend has no CORS whitelist for production
```python
CORS(app, origins=["http://localhost:5173", "https://YOUR_FIREBASE_HOSTING_URL"])
```
`YOUR_FIREBASE_HOSTING_URL` is a placeholder — this means the production domain is NOT whitelisted. Either CORS blocks production requests, or someone changed it to `*` (open CORS) without it being visible here.

**Fix:** Replace the placeholder with the real Firebase Hosting URL before deployment.

#### V8: Flask auth token is never verified in `/api/professors` and `/api/students` endpoints
Looking at the actual Flask routes (`professors.py`, `students.py`, `courses.py`): **none of them call `verify_token()`**. The token verification only exists in the `app.py` stub, not in the actual routes. Any client can fetch professor course data, student data, etc. without a valid Firebase token.

**Fix:** Add a `@require_auth` decorator to all routes in `professors.py`, `students.py`, `courses.py`.

#### V9: `moodleApi.js` sends requests without authentication
```js
const api = axios.create({ baseURL: import.meta.env.VITE_FLASK_URL })
// No interceptor adding Authorization header
```
`moodleApi.js` creates a separate axios instance **without** the auth interceptor that `api.js` has. Flask endpoints receive no token.

**Fix:** Either use the `api.js` instance from `src/api.js` (which has the interceptor), or add the same interceptor to `moodleApi.js`.

---

### 🟡 MEDIUM

#### V10: `useAlerts` has no room access check
All other hooks (`useSensors`, `useDevices`, `useAttendance`, `useSession`) check `hasRoomAccess()`. `useAlerts` does not — any authenticated professor can subscribe to alerts for any room if they know the room ID.

**Fix:** Add the same `hasRoomAccess` + `validateRoomId` check that the other hooks use.

#### V11: CSV export doesn't sanitize data (CSV injection risk)
```js
const rows = [['ID','Name','Present','Entry Time','Override','Note'],
  ...students.map(s => [s.id, s.name, ...])]
const csv = rows.map(r => r.join(',')).join('\n')
```
Student names or notes beginning with `=`, `+`, `-`, `@` could be interpreted as formulas in Excel (CSV injection). In an academic context where student names come from a DB, the risk is low but real.

**Fix:** Wrap each cell value in quotes and escape internal quotes: `` `"${String(v).replace(/"/g, '""')}"` ``

#### V12: Settings thresholds are not persisted
The sensor threshold inputs in `Settings.jsx` use local React state. The "Save thresholds" button does nothing (no `onClick` handler, no Firebase write). Thresholds reset on every page reload. This is a silent UX failure — users think they saved settings when they didn't.

**Fix:** Wire up the save button to write to `/professors/{uid}/settings/thresholds` in Firebase.

#### V13: `transactionHelpers.js` uses a broken transaction API
Firebase RTDB `runTransaction` takes a single update function — it does **not** expose a `transaction.get()` or `transaction.update()` API. The implementation pattern in `transactionHelpers.js` is incorrect for RTDB (it's the Firestore transaction API pattern). These functions likely throw at runtime.

**Fix:** Rewrite using the correct RTDB transaction pattern: `runTransaction(ref, (currentVal) => newVal)`. For multi-path atomic updates, use `update(ref(db), { 'path1': v1, 'path2': v2 })` with a fan-out object.

#### V14: `SessionContext` has a naming conflict with `useSession` hook
`src/context/SessionContext.jsx` exports `useSession`, and `src/hooks/useSession.js` also exports `useSession`. Any file that imports both will get the wrong one depending on import order.

**Fix:** Rename the context export to `useSessionContext` or `useActiveRoom`.

---

### 🔵 LOW

#### V15: `useSession` hook calls hooks conditionally (React rules violation)
```js
export function useSession(roomId) {
  if (!roomIdValid) { return { ... } }  // early return BEFORE useObjectVal call
  if (!hasRoomAccess(...)) { return { ... } }  // another early return
  const [data, loading, error] = useObjectVal(...)  // hook called conditionally
```
React hooks must be called unconditionally. The early returns before `useObjectVal` violate the Rules of Hooks. This **will** cause bugs when `roomIdValid` or `hasRoomAccess` changes between renders (e.g., profile loading).

Same issue exists in `useSensors`, `useDevices`, `useAttendance`.

**Fix:** Always call `useObjectVal`, then conditionally return based on the access check result.

#### V16: `firebaseAdmin` package in `devDependencies` (should be in neither)
`firebase-admin` is listed under `devDependencies` in `package.json`. It should never be in a frontend bundle — it's a server-side SDK. It should only be in the Flask backend's `requirements.txt` or a separate Node.js scripts folder. Having it here risks accidental bundling.

**Fix:** Move Firebase Admin usage to the Flask backend. Remove `firebase-admin` from `package.json` entirely.

---

## 4. Bugs

### B1: `findOrphanedAssignments` in `transactionHelpers.js` re-reads all courses for every room (O(n²))
Inside the transaction, for each professor's room, it re-reads the entire `/courses` node. With many professors, this is extremely expensive and will hit Firebase read quota.

### B2: `dataCleanup.js` — `fixProfessorRoomMismatches` writes `{ assigned: true, assignedAt: ... }` instead of `true`
The `database.rules.json` and all other code expects `assignedRooms[roomId] === true`. The cleanup function writes an object, which will break `hasRoomAccess()` (which checks `=== true`).

### B3: History page double-queries Firebase
`useSessionHistory` builds two `useListVals` queries: one by `professorId` and one by `professorUid`. Both run simultaneously. This doubles Firebase read costs and can cause a flash of duplicate sessions if the merge logic has a collision.

### B4: `useAlerts` doesn't filter by session — alerts accumulate for all time
The hook reads `/classrooms/{roomId}/alerts` without any session or time filter. Old alerts from previous sessions will always appear in the current session's feed.

### B5: `AttendanceReview` — session data is passed through as `professorId` (not `professorUid`)
When writing the session doc on validate/close, it uses `session.professorUid ?? null` — but the active session from Firebase might have `professorId` (Moodle numeric ID) instead of `professorUid` (Firebase UID). This mismatch causes the later query in `useSessionHistory` (`orderByChild('professorUid')`) to miss sessions.

---

## 5. Architecture Issues

### A1: Two separate Flask files (`app.py` in frontend root vs. `routes/` in `C:\Users\lenovo\smu-flask\`)
`app.py` at the project root is a placeholder/stub with hardcoded Moodle tokens. The real Flask app lives at `C:\Users\lenovo\smu-flask\`. The stub is misleading and could be accidentally deployed.

**Fix:** Delete `app.py` from the frontend repo or clearly mark it as an example stub.

### A2: Mock data hardcodes real course codes and student names
`useAttendance.js` contains 32 real Tunisian student names. Mock data with real-sounding names in production code is risky — if mock mode is accidentally enabled in production, it shows fake attendance.

**Fix:** Make mock data obviously fake (e.g., "Test Student 1") and add a console warning if `VITE_USE_MOCK=true` in a non-development build.

### A3: No error boundary — a single hook crash brings down the entire LiveSession page
`LiveSession.jsx` renders 5 hooks worth of data with no `<ErrorBoundary>`. If any one hook throws (e.g., Firebase permission error), the whole page is blank.

**Fix:** Wrap the page in an `<ErrorBoundary>` and show partial data (sensors work even if attendance fails).

### A4: `generateSessions` is called in multiple hooks (`useMoodleCourses`, `useSessionHistory`)
Both hooks independently call `generateSessions` with the same data. This duplicates computation and causes inconsistency if the logic ever diverges. The generated session IDs must match exactly between the two to merge properly.

**Fix:** Lift session generation to a shared context or memoized selector.

### A5: No loading state for the `AdminDebugger` cleanup operation shows stale data
After cleanup completes, it calls `setTimeout(loadDiagnostics, 1000)` — a hardcoded 1-second delay before refreshing. If Firebase is slow, the dashboard shows stale "0 issues" before data arrives.

**Fix:** Await the Firebase write to confirm before reloading diagnostics.

### A6: `useSessionHistory` uses `useListVals` with two simultaneous identical-direction queries
Firebase RTDB indexes only one `orderByChild` direction at a time. Running both `byProfessorId` and `byProfessorUid` queries simultaneously means the second query will always do a full scan if the index doesn't cover it.

**Fix:** Standardize on one field (prefer `professorUid`) and migrate old sessions.

---

## 6. Code Quality Issues

| Issue | Location | Impact |
|-------|----------|--------|
| `console.log` with emoji in production (`✅ Admin detected:`, `✅ Professor detected:`) | `AuthContext.jsx:52,63` | Leaks auth flow details in browser console |
| `MOODLE_URL = "https://your-moodle.smu.tn"` hardcoded placeholder | `app.py:13` | App.py stub would fail silently in production |
| `MOODLE_TOKEN = "YOUR_MOODLE_WEB_SERVICE_TOKEN"` hardcoded placeholder | `app.py:14` | Same |
| `window.confirm()` used for destructive actions | `AdminDebugger`, `AdminProfessors` | Doesn't work in some embedded environments; use a modal |
| `alert()` used for error display | `AdminDebugger:64` | Blocks the UI, not accessible |
| Settings `"Save thresholds"` button has no handler | `Settings.jsx:65` | Silent failure |
| `scripts/` folder has 18 diagnostic/seed scripts committed | repo root | Pollutes the repo with one-time scripts |
| `smart-class-6f3a8-default-rtdb-export.json` in repo root | repo root | May contain real Firebase data snapshot |
| `attendance_MATH142-2026-04-13-13_00-LIVE-0yZ7Ju.csv` in repo root | repo root | Real attendance data in the source repo |

---

## 7. Improvement Roadmap

### Priority 1 — Security (Do Now)

1. **Fix Firebase database rules**: Remove root-level `auth != null` read, make admin node non-public, add explicit path rules for `/sessions` and `/pendingProfessors`.
2. **Add auth to Flask routes**: Add `@require_auth` decorator to all `professors.py`, `courses.py`, `students.py` routes.
3. **Fix `moodleApi.js` to send auth tokens**: Use the `api.js` axios instance or add the same interceptor.
4. **Purge `adminjson.json` from git history**: Use `git filter-repo` and force-push.
5. **Move secrets out of project root**: `serviceAccountKey.json` should live outside the repo.
6. **Add `useAlerts` room access check**: Same pattern as other hooks.

### Priority 2 — Correctness (Fix Soon)

7. **Fix Rules of Hooks violations**: Move `useObjectVal` calls before any conditional returns in `useSession`, `useSensors`, `useDevices`, `useAttendance`.
8. **Rewrite `transactionHelpers.js`**: Use RTDB multi-path `update()` instead of Firestore-style transactions.
9. **Fix `dataCleanup.js` room assignment format**: Write `true` not `{ assigned: true }`.
10. **Fix CSV export injection**: Quote all cell values.
11. **Persist Settings thresholds**: Write to Firebase on save.
12. **Rename `useSession` exports**: Resolve the context/hook naming collision.

### Priority 3 — Performance & Architecture

13. **Consolidate session generation**: Single shared context instead of duplicate calls.
14. **Add `<ErrorBoundary>` to LiveSession**: Prevent full-page crashes from hook errors.
15. **Standardize session ID field** (`professorUid` vs `professorId`): Pick one, migrate data, clean up dual queries.
16. **Remove `firebase-admin` from `package.json`**: Server-only SDK doesn't belong here.
17. **Delete or clearly stub `app.py`**: Avoid confusion with the real Flask app.
18. **Add build-time guard for mock mode**: Fail the Vite build if `VITE_USE_MOCK=true` and `NODE_ENV=production`.

### Priority 4 — UX & Polish

19. **Alert filtering by session**: Only show alerts from current session, not historical ones.
20. **Replace `window.confirm`/`alert` with proper modals**: Especially for destructive operations.
21. **Add real-time connection indicator**: Firebase RTDB has `.info/connected` — surface this in the UI.
22. **History page performance**: Paginate or virtualize the session list when semester history grows large.
23. **Professor deletion should clean up assignedRooms/courses**: Currently only deletes the profile node.

---

## 8. Summary Scorecard

| Area | Score | Key Issue |
|------|-------|-----------|
| Security | 5/10 | Broad DB read rule, Flask no auth, adminjson in git |
| Correctness | 6/10 | Broken transaction API, hooks rules violation |
| Architecture | 7/10 | Dual session generation, no error boundary |
| Code Quality | 7/10 | Debug logs, hardcoded stubs, real data in repo |
| UX | 7/10 | Settings don't save, no connection indicator |
| Test Coverage | 3/10 | Only 3 test files, no integration tests |
