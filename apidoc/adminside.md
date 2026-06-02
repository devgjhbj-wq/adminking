# Bet Search - Admin API

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

## Bet Search (All Bets by Member)

```
GET /api/game/all-bets?member=u12345&site=JE&status=1&dateFrom=2026-01-01&dateTo=2026-03-20&page=1&limit=50
```

Search provider game bet records by member (userId). Requires admin privileges.

**Query Params:**
| Param | Type | Required | Description |
|-------|------|---------|-------------|
| member | string | Yes | Member ID (format: `u` + userId, e.g. `u12345`) |
| site | string | No | Provider code: JE, PG, JD, TU |
| status | number | No | Bet status (1=valid) |
| dateFrom | string | No | Start date (YYYY-MM-DD) |
| dateTo | string | No | End date (YYYY-MM-DD) |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 50, max: 100) |

**Response:**

```json
{
  "status": "success",
  "member": "u12345",
  "page": 1,
  "limit": 50,
  "total": 25,
  "summary": {
    "totalBet": 5000,
    "totalPayout": 3000,
    "totalTurnover": 5000,
    "netPnl": -2000
  },
  "items": [
    {
      "_id": "...",
      "bet": 200,
      "payout": 100,
      "turnover": 200,
      "gameId": "51",
      "betTime": "2026-03-19T10:30:00.000Z",
      "createdAt": "2026-03-19T10:30:00.000Z"
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| items[].bet | Bet amount |
| items[].payout | Payout amount |
| items[].turnover | Turnover amount |
| items[].gameId | Game ID |
| totalBet | Sum of all bet amounts in current page |
| totalPayout | Sum of all payouts in current page |
| totalTurnover | Sum of all turnover amounts |
| netPnl | totalPayout - totalBet (negative = platform profit) |

---

## Wingo Bet Search (All Bets)

```
GET /api/wingo/all-bets?userId=123&orderNumber=WGO123...&issueNumber=...&status=...&page=1&limit=50
```

Search Wingo bets. Admins can search by userId, orderNumber, issueNumber, and status.

**Query Params:**
| Param | Type | Required | Description |
|-------|------|---------|-------------|
| userId | number | No | Admin only — filter by user ID |
| orderNumber | string | No | Admin only — filter by exact order number (unique) |
| issueNumber | string | No | Filter by issue/round number |
| status | string | No | Filter: `pending`, `won`, `lost` |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 50, max: 100) |

**Response:**

```json
{
  "status": "success",
  "page": 1,
  "limit": 50,
  "total": 1,
  "summary": { "totalBet": 100, "totalPayout": 0 },
  "items": [
    {
      "_id": "...",
      "userId": "123",
      "mobile": "9876543210",
      "issueNumber": "202605100000001",
      "orderNumber": "WGO1712345678901",
      "betAmount": 100,
      "fee": 0,
      "selectType": "green",
      "status": "pending",
      "result": null,
      "createdAt": "2026-03-19T10:30:00.000Z"
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| totalBet | Sum of all bet amounts in current page |
| totalPayout | Sum of all profit amounts in current page |
| items[].mobile | User's mobile number (joined from user model) |
| items[].orderNumber | Unique order number for this bet |
| items[].selectType | Bet selection: red, green, violet, big, small, or 0-9 |
| items[].status | Bet status: pending, won, lost |
| items[].result | Result object with profitAmount, etc., or null if pending |


