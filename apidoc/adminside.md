# Game API - Admin Side

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

## Move Game Balance to Wallet

```
POST /admin/move-game-to-wallet
```

**Options:**

```json
// Single user
{ "userId": 100001, "providerCode": "JE" }

// Range of users
{ "userId": 100001, "userIdTo": 100050, "providerCode": "ALL" }

// Array of users
{ "userIds": [100001, 100002, 100003], "providerCode": "ALL" }
```

| Param | Type | Required | Description |
|-------|------|---------|-------------|
| userId | number | Yes* | Start user ID |
| userIdTo | number | No | End user ID for range |
| userIds | array | Yes* | Array of user IDs |
| providerCode | string | No | PG, JE, JD, TU, or ALL (default: ALL) |

**Response:**

```json
{
  "status": "success",
  "msg": "Balance moved from all games to wallet",
  "totalUsersProcessed": 50,
  "totalAmountMoved": 5000,
  "users": [
    {
      "userId": 100001,
      "success": true,
      "providers": [
        { "provider": "JE", "amount": 100, "success": true, "referenceId": "GMOUT123456" }
      ],
      "moved": 100,
      "walletBalance": 1100
    }
  ]
}
```
