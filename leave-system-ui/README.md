# LeaveSystemUI — Angular 21 Frontend

HR Leave Management frontend built with Angular 21 (standalone components) and RxJS.

---

## Tech Stack

| Tool              | Version  |
|-------------------|----------|
| Angular           | 21.2.0   |
| Angular CLI       | 21.2.8   |
| TypeScript        | 5.9.2    |
| RxJS              | 7.8.0    |
| Node.js           | 20+      |
| npm               | 10+      |

---

## Project Structure

```
LeaveSystemUI/
└── src/
    └── app/
        ├── dashboard/              # Employee dashboard (table + balance summary)
        ├── apply-leave/            # Leave application form
        ├── approvals/              # HR approval page (approve / reject / bulk)
        ├── leave-types/            # Leave type management (HR)
        ├── leave-settlements/      # Manual balance adjustments
        ├── home/                   # Home / landing page
        ├── leave-api.service.ts    # Centralized HTTP service (all API calls)
        ├── app.routes.ts           # Application routing
        ├── app.component.ts        # Root component
        └── app.config.ts           # App-level providers
```

---

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- npm 10+ (bundled with Node.js)
- Angular CLI:
  ```bash
  npm install -g @angular/cli
  ```

---

## Setup & Run

### 1 — Install dependencies

```bash
cd LeaveSystemUI
npm install
```

### 2 — Start the development server

```bash
ng serve
# or
npm start
```

App runs at **`http://localhost:4200`**.  
API calls are automatically proxied to `https://localhost:7277/api` via `proxy.conf.json` — no extra browser config needed.

> Make sure the backend API is running before starting the frontend.

### 3 — Production build

```bash
ng build
```

Output is placed in `dist/leave-system-ui/`.

---

## Routing

| Route              | Component               | Description                          |
|--------------------|-------------------------|--------------------------------------|
| `/`                | DashboardComponent      | Employee dashboard (default)         |
| `/apply-leave`     | ApplyLeaveComponent     | Submit a new leave request           |
| `/approvals`       | ApprovalsComponent      | HR approval queue                    |
| `/leave-types`     | LeaveTypesComponent     | Manage leave types (HR)              |
| `/settlements`     | LeaveSettlementsComponent | Manual balance adjustments         |

---

## API Integration

All HTTP calls are centralised in `leave-api.service.ts`.

**API Base URL:** `https://localhost:7277/api`

| Method                          | HTTP            | Description                        |
|---------------------------------|-----------------|------------------------------------|
| `getDashboard()`                | GET /dashboard  | Summary stats + recent requests    |
| `getLeaveTypes()`               | GET /leavetypes | Cached with `shareReplay(1)`       |
| `createLeaveType(dto)`          | POST /leavetypes| Create a new leave type            |
| `updateLeaveType(id, dto)`      | PUT /leavetypes/{id} | Edit a leave type             |
| `getLeaveBalances()`            | GET /leavebalances | Balances per leave type         |
| `getLeaveRequests(filters)`     | GET /leaverequests | Filterable list                 |
| `createLeaveRequest(dto)`       | POST /leaverequests | Submit a request              |
| `approveRequest(id, dto)`       | PUT /leaverequests/{id}/approve | Approve            |
| `rejectRequest(id, dto)`        | PUT /leaverequests/{id}/reject  | Reject             |
| `cancelRequest(id)`             | PUT /leaverequests/{id}/cancel  | Cancel             |
| `bulkApprove(dto)`              | POST /leaverequests/bulk-approve | Bulk approve      |
| `bulkReject(dto)`               | POST /leaverequests/bulk-reject  | Bulk reject       |
| `exportCsv()`                   | GET /leaverequests/export-csv   | Download CSV      |
| `getSettlements()`              | GET /leavesettlements | Settlement history           |
| `createSettlement(dto)`         | POST /leavesettlements | Manual adjustment            |

---

## Features

### Employee Dashboard
- Filterable and sortable table of leave requests (filter by status, leave type, date range)
- Summary cards showing leave balance per type

### Apply for Leave
- Form fields: Leave Type (dropdown), Start Date (datepicker), End Date (datepicker), Reason (textarea)
- Real-time validation — warns if balance is low
- **Draft persistence** — unsaved forms are stored in `localStorage` and restored on next visit

### Leave Approval Page (HR)
- Lists all pending requests with Approve / Reject buttons
- Optional rejection comment field per request
- **Bulk action** — select multiple requests and approve/reject all at once

### Leave Types Management (HR)
- Add and edit leave types
- Toggle `IsAccrued` flag (accrues at 1.25 days/month based on hire date)
- Set configurable default days (e.g. Maternity: 90 days)

### Leave Balance Widget
- Cards showing remaining balance per leave type on the dashboard

### Leave Settlements
- Manual balance adjustment form (increase or decrease days)
- Settlement history list

### Export
- Download full leave request history as a CSV file from the dashboard

### Notifications
- Toast messages for all key actions (submit, approve, reject, cancel, error)

---

## RxJS Patterns Used

| Pattern              | Where                                         |
|----------------------|-----------------------------------------------|
| `shareReplay(1)`     | Leave types cache in `leave-api.service.ts`   |
| `debounceTime`       | Search/filter inputs on the dashboard         |
| `switchMap`          | Cancellable HTTP calls on filter changes      |

---

## npm Scripts

| Script          | Command          | Description                   |
|-----------------|------------------|-------------------------------|
| `npm start`     | `ng serve`       | Development server            |
| `npm run build` | `ng build`       | Production build              |
| `npm run watch` | `ng build --watch` | Dev build with watch mode   |
| `npm test`      | `ng test`        | Unit tests (Vitest)           |

---

## Notes

- No authentication — single-user access assumed for this demo.
- The dev proxy (`proxy.conf.json`) forwards `/api/*` to `https://localhost:7277` — ensure the backend is running first.
- Standalone components are used throughout (no `NgModule`).
- Status values received from the API are strings: `Pending`, `Approved`, `Rejected`, `Cancelled`.
