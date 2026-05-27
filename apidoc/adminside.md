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

## Get Agent Stats

```
GET /admin/agent-stats?userId=123456&page=1&limit=50
```

**Response:**

```json
{
  "agent": {
    "userId": 123456,
    "mobile": "9876543210",
    "admin": false,
    "referredBy": 100001,
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "inviter": {
    "userId": 100001,
    "mobile": "9876543100",
    "createdAt": "2025-12-01T00:00:00.000Z"
  },
  "totalInvitees": 25,
  "page": 1,
  "limit": 50,
  "invitees": [
    {
      "userId": 123457,
      "mobile": "9876543211",
      "createdAt": "2026-02-01T00:00:00.000Z",
      "totals": {
        "deposit": 5000.0,
        "withdraw": 1000.0
      }
    }
  ]
}
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

### Get Agent Level (Admin)

```
GET /agency/admin/level?userId=32545513
```

Returns same shape as `/agency/level`.

---

### Get Agent Daily Stats (Admin)

```
GET /agency/admin/daily?userId=32545513&date=2026-05-24
```

Returns same shape as `/agency/daily`:

```json
{
  "status": "success",
  "date": "2026-05-24T00:00:00.000Z",
  "thisWeekCommission": 244.8,
  "totalCommission": 5678.9,
  "yesterdayTotalCommission": 94.08,
  "totalRegister": {
    "level1": 15,
    "level2": 8,
    "level3": 3
  },
  "level1": { "deposit": 5000, "regCount": 2, "depositCount": 3, "firstDepositCount": 1 },
  "level2": { "deposit": 0, "regCount": 1, "depositCount": 0, "firstDepositCount": 0 },
  "level3": { "deposit": 0, "regCount": 0, "depositCount": 0, "firstDepositCount": 0 }
}
```

---

### View Agent Team (Admin)

```
GET /agency/admin/team?agentId=32545513&toDate=2026-05-26&page=1&limit=25
GET /agency/admin/team?agentId=32545513&fromDate=2026-05-01&toDate=2026-05-26&tier=1&page=1&limit=25
```

`toDate` is **required** and must be yesterday or earlier. Returns same shape as `/agency/team` with `aggregation`:

```json
{
  "status": "success",
  "total": 50,
  "page": 1,
  "limit": 25,
  "items": [
    {
      "userId": 32545514,
      "mobile": "98***10",
      "registeredAt": "2026-01-15T10:30:00.000Z",
      "tier": 1,
      "totalDeposit": 15000
    }
  ],
  "aggregation": {
    "level1": { "depositCount": 120, "depositAmount": 450000, "bettorCount": 45, "betAmount": 1200000, "firstDepositCount": 30, "firstDepositAmount": 75000 },
    "level2": { "depositCount": 60, "depositAmount": 200000, "bettorCount": 25, "betAmount": 600000, "firstDepositCount": 15, "firstDepositAmount": 35000 },
    "level3": { "depositCount": 20, "depositAmount": 50000, "bettorCount": 10, "betAmount": 150000, "firstDepositCount": 5, "firstDepositAmount": 10000 },
    "total": { "depositCount": 200, "depositAmount": 700000, "bettorCount": 80, "betAmount": 1950000, "firstDepositCount": 50, "firstDepositAmount": 120000 }
  }
}
```

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
