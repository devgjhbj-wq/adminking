# Agency API - Admin Side

## Base URL

```
https://backend-ledger-0ra6.onrender.com/api
```

## Authentication

All endpoints require Bearer token with admin privileges:

```
Authorization: Bearer <admin_token>
```

---

## Level Config Management

### Get All Level Configs

```
GET /agency/configs
```

**Response:**

```json
{
  "status": "success",
  "configs": [
    { "level": 0, "minMembers": 0, "minBets": 0, "minDeposit": 0, "l1Rate": 0.006, "l2Rate": 0.0018, "l3Rate": 0.00054 }
  ]
}
```

### Update a Level Config

```
PUT /agency/configs/:level
```

**Body:**

```json
{
  "minMembers": 10,
  "minBets": 1000000,
  "minDeposit": 200000,
  "l1Rate": 0.0075,
  "l2Rate": 0.0028125,
  "l3Rate": 0.00105469
}
```

### Seed Default Configs

```
POST /agency/configs/seed
```

---

## Admin Agency Endpoints

### Get Agent Level (Admin) — Unified

```
GET /agency/admin/level?userId=32545513
GET /agency/admin/level?userId=32545513&date=2026-06-03
```

`date` is optional, defaults to today. Returns per-tier lifetime + daily stats, and commission data — replaces the old `/daily` endpoint.

**Response:**

```json
{
  "status": "success",
  "rebate_level": 1,
  "date": "2026-06-03T00:00:00.000Z",
  "level1": {
    "members": 5,
    "todayMembers": 1,
    "totalBets": 200000,
    "todayBets": 20000,
    "totalDeposit": 50000,
    "todayDeposit": 4000,
    "depositCount": 1,
    "firstDepositCount": 1,
    "totalWithdrawal": 10000,
    "todayWithdrawal": 500
  },
  "level2": {
    "members": 4,
    "todayMembers": 1,
    "totalBets": 150000,
    "todayBets": 15000,
    "totalDeposit": 40000,
    "todayDeposit": 3000,
    "depositCount": 1,
    "firstDepositCount": 1,
    "totalWithdrawal": 8000,
    "todayWithdrawal": 600
  },
  "level3": {
    "members": 3,
    "todayMembers": 0,
    "totalBets": 150000,
    "todayBets": 7417,
    "totalDeposit": 30000,
    "todayDeposit": 1000,
    "depositCount": 0,
    "firstDepositCount": 0,
    "totalWithdrawal": 7000,
    "todayWithdrawal": 400
  },
  "total": {
    "members": 12,
    "todayMembers": 2,
    "totalBets": 500000,
    "todayBets": 42417,
    "totalDeposit": 120000,
    "todayDeposit": 8000,
    "depositCount": 2,
    "firstDepositCount": 2,
    "totalWithdrawal": 25000,
    "todayWithdrawal": 1500
  },
  "commission": {
    "thisWeek": 1234.56,
    "total": 56789.01,
    "today": 456.78
  }
}
```

| Field | Description |
|---|---|
| `rebate_level` | Current commission rebate level (0–10) |
| `date` | The date the daily tally is for |
| `level1/2/3.members` | Lifetime unique team members at that tier |
| `level1/2/3.todayMembers` | New members registered for that date at that tier |
| `level1/2/3.totalBets` | Lifetime bet amount from that tier |
| `level1/2/3.todayBets` | Bet amount for that date from that tier |
| `level1/2/3.totalDeposit` | Lifetime deposit amount from that tier |
| `level1/2/3.todayDeposit` | Deposit amount for that date from that tier |
| `level1/2/3.depositCount` | Number of deposit transactions for that date from that tier |
| `level1/2/3.firstDepositCount` | First-time depositors for that date from that tier |
| `level1/2/3.totalWithdrawal` | Lifetime withdrawal amount from that tier |
| `level1/2/3.todayWithdrawal` | Withdrawal amount for that date from that tier |
| `commission.thisWeek` | Total commission earned this week (Mon–Sun) |
| `commission.total` | Lifetime total commission earned |
| `commission.today` | Commission earned on that date |

---

### View Agent Team (Admin) — Unified

Returns team aggregation stats plus agent and inviter info. Individual member details are available via a separate endpoint (see below).

```
GET /agency/admin/team?agentId=32545513&toDate=2026-05-26&page=1&limit=25
GET /agency/admin/team?agentId=32545513&fromDate=2026-05-01&toDate=2026-05-26&tier=1&page=1&limit=25
```

`toDate` is **required** and must be yesterday or earlier.

**Response:**

```json
{
  "status": "success",
  "total": 50,
  "page": 1,
  "limit": 25,
  "agent": {
    "userId": 32545513,
    "mobile": "98***13",
    "admin": false,
    "referredBy": 100001,
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "inviter": {
    "userId": 100001,
    "mobile": "98***00",
    "createdAt": "2025-12-01T00:00:00.000Z"
  },
  "aggregation": {
    "level1": { "depositCount": 120, "depositAmount": 450000, "bettorCount": 45, "betAmount": 1200000, "firstDepositCount": 30, "firstDepositAmount": 75000 },
    "level2": { "depositCount": 60, "depositAmount": 200000, "bettorCount": 25, "betAmount": 600000, "firstDepositCount": 15, "firstDepositAmount": 35000 },
    "level3": { "depositCount": 20, "depositAmount": 50000, "bettorCount": 10, "betAmount": 150000, "firstDepositCount": 5, "firstDepositAmount": 10000 },
    "total": { "depositCount": 200, "depositAmount": 700000, "bettorCount": 80, "betAmount": 1950000, "firstDepositCount": 50, "firstDepositAmount": 120000 }
  }
}
```

---

### View Team Members (Admin) — Full Details

Returns individual team member details with unmasked mobile numbers and total bet amount. Filterable by tier.

```
GET /agency/admin/team-members?agentId=32545513&toDate=2026-05-26&page=1&limit=25
GET /agency/admin/team-members?agentId=32545513&fromDate=2026-05-01&toDate=2026-05-26&tier=1&page=1&limit=25
GET /agency/admin/team-members?agentId=32545513&toDate=2026-05-26&tier=2&page=1&limit=25
```

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `agentId` | Yes | Agent's userId whose team members to view |
| `tier` | No | Filter by downline level (1=direct, 2=indirect, 3=3rd level) |
| `userId` | No | Search specific user by userId |
| `fromDate` | No | Registration start date (YYYY-MM-DD) |
| `toDate` | No | Registration end date (YYYY-MM-DD) |
| `page` | No | Page number (default: 1) |
| `limit` | No | Items per page (default: 25, max: 100) |

**Response:**

```json
{
  "status": "success",
  "total": 50,
  "page": 1,
  "limit": 25,
  "items": [
    {
      "userId": 32545514,
      "mobile": "9876543210",
      "registeredAt": "2026-01-15T10:30:00.000Z",
      "tier": 1,
      "totalDeposit": 15000,
      "totalWithdrawal": 3000,
      "totalBet": 120000
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| `userId` | User ID of the team member |
| `mobile` | Full mobile number (unmasked) |
| `registeredAt` | Registration timestamp |
| `tier` | Downline level (1, 2, or 3) |
| `totalDeposit` | Lifetime deposit amount |
| `totalWithdrawal` | Lifetime withdrawal amount |
| `totalBet` | Total bet amount placed (all games) |

---

### Run Midnight Batch Manually

```
POST /agency/admin/run-midnight
```

**Response:**

```json
{
  "status": "success",
  "processed": 150,
  "totalCommission": 4523.5
}
```
