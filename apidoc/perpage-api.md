# Per-Page API & Purpose

Backend Base URL: `https://admin-backend-7lwn.onrender.com/api/admin`

---

## 1. Login (`src/pages/Login.tsx`)

**Purpose:** Authenticate the admin user and obtain a session token. Entry point to the entire admin panel.

| Aspect | Detail |
|--------|--------|
| **API** | `POST /api/auth/login` (raw axios, not shared instance) |
| **Trigger** | Form submit button |
| **Body** | `{ mobile, password }` |
| **Response** | `{ token, user }` |

---

## 2. Dashboard (`src/pages/Dashboard.tsx`)

**Purpose:** Show a high-level platform overview — total users, deposits, withdrawals, revenue, and other KPIs for the selected period.

| Aspect | Detail |
|--------|--------|
| **API** | `GET /api/admin/dashboard?period=&date=` |
| **Trigger** | "Search" button |
| **Filters** | Period (`today`/`month`/`custom`) + date picker (for `custom`) |
| **Pagination** | None |

---

## 3. User Search (`src/pages/UserSearch.tsx`)

**Purpose:** Look up an individual user by ID or mobile number. View their profile, transactions, and perform actions like changing status or editing payment details.

| Aspect | Detail |
|--------|--------|
| **APIs** | `GET /api/admin/user?userId=` or `GET /api/admin/user?mobile=` |
| **Trigger** | "Search" button or Enter on input |
| **Logic** | If User ID is filled → `searchUser(id)`; else if mobile is 10 digits → `searchUserByMobile(mob)` |
| **Sub-actions** | `PATCH /api/admin/user` — Change Status sheet |
| | `PUT /api/admin/user/payments` — Edit Payment sheet |
| | `GET /api/admin/users-by-ip?ip=` — View Users sharing same IP |
| **Pagination** | None (single user result) |

---

## 4. Admin Logs (`src/pages/AdminLogs.tsx`)

**Purpose:** View server-side application logs (info/error) for debugging and auditing admin actions.

| Aspect | Detail |
|--------|--------|
| **API** | `GET /api/admin/logs?level=&since=&limit=` |
| **Trigger** | Auto-load on mount + "Apply" button |
| **Filters** | Level (`info`/`error`), Since (datetime), Limit |
| **Pagination** | None |

---

## 5. Deposits (`src/pages/Deposits.tsx`)

**Purpose:** Manage user deposit orders — search, filter, approve pending deposits, and configure deposit channels / bonus tiers.

### Tab: Orders

| Aspect | Detail |
|--------|--------|
| **API** | `GET /api/admin/deposits?userId=&mobile=&orderId=&status=&dateFrom=&dateTo=&page=&limit=` |
| **Trigger** | "Search" button; Enter on page input |
| **Filters** | User ID, Phone, Order ID, Status dropdown, From/To date pickers |
| **Approve** | `POST /api/admin/deposits/approve` — inline Approve button per row |
| **Pagination** | Page numbers + Go to input |

### Tab: Config

| **API** | `GET /api/admin/deposit-config`, `PUT /api/admin/deposit-config/:channel` |
| **Trigger** | Auto-load on tab switch; Save per channel card |

### Tab: Bonus

| **API** | `GET /api/admin/deposit-bonus-config`, `PUT /api/admin/deposit-bonus-config` |
| **Trigger** | Auto-load on tab switch; Save per bonus tier card |

---

## 6. Withdrawals (`src/pages/Withdrawals.tsx`)

**Purpose:** Manage user withdrawal requests — search by user/order/global filters, approve or cancel with a reason, and configure withdrawal limits.

### Tab: Orders

| Aspect | Detail |
|--------|--------|
| **APIs** | |
| User ID search | `GET /api/admin/withdrawals?userId=&page=&limit=` |
| Order ID search | `GET /api/admin/withdrawals?orderId=` |
| Global search | `GET /api/admin/withdrawals?status=&dateFrom=&dateTo=&page=&limit=` |
| Approve | `POST /api/admin/withdrawals/approve` |
| Cancel | `POST /api/admin/withdrawals/cancel` |
| **Triggers** | |
| User ID | "Search" button or Enter key → `loadByUserId(1)` |
| Order ID | "Search" button or Enter key → `loadByOrderId()` |
| Global | "Search" button → `loadGlobalSearch(1)` |
| Action | "Action" button → dialog → Approve or Cancel (with reason textarea) |
| **Filters** | User ID, Order ID, Status, Charge from, From/To dates |
| **Pagination** | Page numbers + Go to input (adapts to last search type) |

### Tab: Config

| **API** | `GET /api/admin/withdrawal-config`, `PUT /api/admin/withdrawal-config` |
| **Trigger** | Auto-load on tab switch; Save Config button |

---

## 7. Transactions (`src/pages/Transactions.tsx`)

**Purpose:** Browse all financial transactions across the platform. Requires at least one identifier (user/order/transaction ID) to search.

| Aspect | Detail |
|--------|--------|
| **API** | `GET /api/admin/transactions?userId=&orderId=&transactionId=&type=&dateFrom=&dateTo=&page=&limit=` |
| **Trigger** | "Search" button; Enter on any search input |
| **Filters** | User ID, Order ID, Transaction ID, Type dropdown, From/To dates |
| **Validation** | At least one of userId/orderId/transactionId required |
| **Pagination** | Page numbers + Go to input |

---

## 8. Bet Records (`src/pages/BetRecords.tsx`)

**Purpose:** View betting history from game providers. Used to audit player bets and investigate disputes.

### Tab: Provider

| Aspect | Detail |
|--------|--------|
| **API** | `GET /api/game/all-bets?member=&site=&status=&dateFrom=&dateTo=&page=&limit=` |
| **Trigger** | "Search" button; Enter on member input |
| **Filters** | Member ID, Site, Status, From/To dates |
| **Pagination** | Page numbers |

### Tab: Wingo

| **API** | `GET /api/wingo/all-bets?userId=&orderNumber=&issueNumber=&status=&page=&limit=` |
| **Trigger** | "Search" button; Enter on any input |
| **Filters** | User ID, Order Number, Issue Number, Status |
| **Pagination** | Page numbers |

---

## 9. Gift Codes (`src/pages/GiftCodes.tsx`)

**Purpose:** Create, edit, enable/disable, and delete promotional gift codes. Also view who redeemed each code.

| Aspect | Detail |
|--------|--------|
| **APIs** | |
| List | `GET /api/admin/gift-codes?search=&isActive=&page=&limit=` |
| Create | `POST /api/admin/gift-codes` |
| Update | `PUT /api/admin/gift-codes/:code` |
| Toggle | `PATCH /api/admin/gift-codes/:code/toggle` |
| Delete | `DELETE /api/admin/gift-codes/:code` |
| Redemptions | `GET /api/admin/gift-codes/:code/redemptions?page=&limit=` |
| **Trigger** | Auto-load on mount; Search button; Create/Edit form submit; Toggle/Delete inline buttons |
| **Filters** | Search text, Active filter toggle |
| **Pagination** | Page numbers |

---

## 10. VIP Config (`src/pages/VipConfig.tsx`)

**Purpose:** Configure VIP tier levels — set deposit thresholds, withdrawal limits, and benefits per tier.

| Aspect | Detail |
|--------|--------|
| **APIs** | `GET /api/admin/vip-config`, `PUT /api/admin/vip-config` |
| **Trigger** | Auto-load on mount; Save Changes button; Refresh button |
| **Pagination** | None |

---

## 11. Turnover Config (`src/pages/TurnoverConfig.tsx`)

**Purpose:** Manage turnover (wagering) requirements — configure multipliers per game, check user turnover status, and manually clear/add turnover.

| Aspect | Detail |
|--------|--------|
| **APIs** | `GET /api/admin/turnover-config`, `PUT /api/admin/turnover-config`, `GET /api/admin/turnover-status?userId=`, `POST /api/admin/turnover/clear`, `POST /api/admin/turnover/add` |
| **Trigger** | Auto-load on mount; Save per card; Clear/Add buttons |
| **Pagination** | None |

---

## 12. Agency Dashboard (`src/pages/AgencyDashboard.tsx`)

**Purpose:** Manage the agency/affiliate system — view agent hierarchy, team performance, commission levels, and run batch processes.

### Tab: Level

| **API** | `GET /api/agency/admin/level?userId=&date=` |
| **Trigger** | "Search" button |

### Tab: Team

| **API** | `GET /api/agency/admin/team?agentId=&fromDate=&toDate=&tier=&page=&limit=` |
| **Trigger** | "Search" button + pagination |

### Tab: Team Members (drawer)

| **API** | `GET /api/agency/admin/team-members?agentId=&tier=&userId=&fromDate=&toDate=&page=&limit=` |
| **Trigger** | "Search" button in drawer + pagination |

### Tab: Config

| **APIs** | `GET /api/agency/configs`, `PUT /api/agency/configs/:level`, `POST /api/agency/configs/seed` |
| **Trigger** | Auto-load on tab switch; Save per row; Seed Defaults |

### Admin Actions

| **API** | `POST /api/agency/admin/run-midnight` |
| **Trigger** | "Run Midnight Batch" button |

---

## 13. Wingo Dashboard (`src/pages/WingoDashboard.tsx`)

**Purpose:** Monitor and control the Wingo mini-game — view current round with live bets, browse settled round history, and configure result generation mode (random / max-profit / max-loss).

### Tab: Current Round

| **APIs** | `GET /api/wingo/admin/current-round` (polled 2s), `GET /api/wingo/admin/current-round/bets?page=&limit=` |
| **Trigger** | Auto-load on mount with 2s polling; Show / Refresh bets buttons |

### Tab: History

| **APIs** | `GET /api/wingo/admin/rounds?page=&limit=`, `GET /api/wingo/admin/round-stats/:issueNumber` |
| **Trigger** | Show history button; Stats button per row |

### Tab: Result Mode

| **APIs** | `GET /api/wingo/admin/result-mode`, `POST /api/wingo/admin/result-mode` |
| **Trigger** | Refresh button; Apply Change button |

---

## Trigger Summary

| Trigger | Pages |
|---------|-------|
| **"Search" button** | Dashboard, UserSearch, AdminLogs, Deposits, Withdrawals, Transactions, BetRecords (both), GiftCodes, AgencyDashboard (Level/Team) |
| **Enter key on input** | UserSearch, Withdrawals (User ID, Order ID), Transactions, BetRecords, GiftCodes search |
| **Auto-load on mount** | AdminLogs, GiftCodes, TurnoverConfig, VipConfig, WingoDashboard |
| **Auto-load on tab switch** | AgencyDashboard (Config), Deposits (Config/Bonus), Withdrawals (Config) |
| **Polling (2s)** | WingoDashboard (Current Round) |
| **Inline action buttons** | Deposits (Approve), Withdrawals (Action → Approve/Cancel), GiftCodes (Toggle/Delete) |
