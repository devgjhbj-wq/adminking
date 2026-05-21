# Wingo Admin API — Frontend Integration Guide

## Base URL

```
https://<your-domain>/api/wingo/admin
```

## Authentication

All endpoints require a **Bearer JWT token** of an admin user.

```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Get Current Round

```
GET /current-round
```

Returns the current active round with live bet statistics.

**Response**

```json
{
  "success": true,
  "round": {
    "_id": "6a0ef14e86a36173e0392a21",
    "issueNumber": "2026052102080",
    "startTime": 1779364170000,
    "endTime": 1779364200000,
    "result": { "number": null, "color": null, "size": null },
    "resultMode": "RANDOM",
    "status": "open"
  },
  "stats": {
    "totalBets": 45,
    "totalBetAmount": 12500,
    "uniqueUsers": 12,
    "breakdown": {
      "red": 3200,
      "green": 2800,
      "violet": 1500,
      "big": 2100,
      "small": 1900,
      "0": 200,
      "1": 150,
      "2": 300,
      "3": 0,
      "4": 100,
      "5": 50,
      "6": 0,
      "7": 400,
      "8": 0,
      "9": 800
    }
  }
}
```

| Field | Type | Description |
|---|---|---|
| `round.issueNumber` | string | Current period number |
| `round.startTime` | number | Round start (epoch ms) |
| `round.endTime` | number | Round end (epoch ms) |
| `round.status` | string | `open`, `closed`, or `settled` |
| `round.result` | object | `{ number, color, size }` — null until settled |
| `stats.totalBets` | number | Total bets placed this round |
| `stats.totalBetAmount` | number | Sum of all bet amounts |
| `stats.uniqueUsers` | number | Distinct users who bet |
| `stats.breakdown` | object | Bet amount per type (red/green/violet/big/small/0-9) |

---

### 2. Get Current Round Bets

```
GET /current-round/bets?page=1&limit=50
```

**Query Parameters**

| Param | Default | Description |
|---|---|---|
| `page` | 1 | Page number |
| `limit` | 50 | Items per page (max 100) |

**Response**

```json
{
  "success": true,
  "page": 1,
  "limit": 50,
  "total": 45,
  "issueNumber": "2026052102080",
  "items": [
    {
      "_id": "...",
      "userId": "32545513",
      "mobile": "9876543210",
      "orderNumber": "WG2026052112345678901",
      "betAmount": 100,
      "fee": 2,
      "selectType": "green",
      "status": "pending",
      "result": null,
      "createdAt": "2026-05-21T11:49:34.724Z"
    }
  ]
}
```

---

### 3. Get Round Stats by Period

```
GET /round-stats/{issueNumber}
```

Full statistics for any specific round — past or current.

**Example**

```
GET /round-stats/2026052102075
```

**Response**

```json
{
  "success": true,
  "issue": {
    "_id": "...",
    "issueNumber": "2026052102075",
    "result": { "number": 7, "color": "green", "size": "big" },
    "resultMode": "MAX_LOSS",
    "status": "settled",
    "startTime": 1779364050000,
    "endTime": 1779364080000
  },
  "stats": {
    "totalBets": 120,
    "totalBetAmount": 35000,
    "totalPayout": 28500,
    "profitLoss": 6500,
    "wonCount": 30,
    "lostCount": 90,
    "uniqueUsers": 25,
    "breakdown": {
      "red":   { "count": 25, "amount": 8000 },
      "green": { "count": 20, "amount": 6000 },
      "violet":{ "count": 10, "amount": 3000 },
      "big":   { "count": 15, "amount": 4500 },
      "small": { "count": 15, "amount": 4500 },
      "0":     { "count": 2,  "amount": 500 },
      "1":     { "count": 3,  "amount": 900 },
      "2":     { "count": 1,  "amount": 200 },
      "3":     { "count": 5,  "amount": 1500 },
      "4":     { "count": 4,  "amount": 1200 },
      "5":     { "count": 6,  "amount": 1800 },
      "6":     { "count": 2,  "amount": 600 },
      "7":     { "count": 4,  "amount": 1200 },
      "8":     { "count": 3,  "amount": 700 },
      "9":     { "count": 5,  "amount": 1500 }
    }
  }
}
```

| Field | Description |
|---|---|
| `stats.totalBets` | Total bets placed |
| `stats.totalBetAmount` | Sum of bet amounts |
| `stats.totalPayout` | Total winnings paid out |
| `stats.profitLoss` | `totalBetAmount - totalPayout` (positive = house profit) |
| `stats.wonCount` | How many bets won |
| `stats.lostCount` | How many bets lost |
| `stats.uniqueUsers` | Distinct users |
| `stats.breakdown` | Per-type: `{ count, amount }` |

**Possible `status` values**
| Status | Meaning |
|---|---|
| `open` | Betting ongoing, no result yet |
| `closed` | Round ended, settlement in progress |
| `settled` | Complete — result available, all bets processed |

---

### 4. Get Rounds (Paginated)

```
GET /rounds?page=1&limit=25
```

Paginated list of **settled** rounds with per-round stats.

**Query Parameters**

| Param | Default | Description |
|---|---|---|
| `page` | 1 | Page number |
| `limit` | 25 | Items per page (max 50) |

**Response**

```json
{
  "success": true,
  "page": 1,
  "limit": 25,
  "total": 200,
  "items": [
    {
      "issueNumber": "2026052102090",
      "result": { "number": 3, "color": "green", "size": "small" },
      "resultMode": "RANDOM",
      "status": "settled",
      "startTime": 1779364290000,
      "endTime": 1779364320000,
      "createdAt": "2026-05-21T11:51:30.000Z",
      "stats": {
        "totalBets": 55,
        "totalBetAmount": 16200,
        "totalPayout": 13100,
        "wonCount": 18,
        "lostCount": 37
      }
    }
  ]
}
```

Use this for a rounds history table. The `total` field gives you total pages: `Math.ceil(total / limit)`.

---

### 5. Get Current Result Mode

```
GET /result-mode
```

```json
{
  "success": true,
  "mode": "RANDOM"
}
```

---

### 6. Set Result Mode

```
POST /result-mode
Content-Type: application/json

{ "mode": "MAX_PROFIT" }
```

**Body**

| Field | Type | Values |
|---|---|---|
| `mode` | string | `RANDOM`, `MAX_PROFIT`, `MAX_LOSS` |

**Response**

```json
{
  "success": true,
  "currentIssue": "2026052102090",
  "applyIssue": "2026052102091"
}
```

| Field | Description |
|---|---|
| `currentIssue` | The current live round (mode does NOT affect this) |
| `applyIssue` | The next round where the new mode takes effect |

**Modes explained**

| Mode | Behavior |
|---|---|
| `RANDOM` | Pure random 0-9 (default) |
| `MAX_PROFIT` | Picks result that minimizes payout (house wins more) |
| `MAX_LOSS` | Picks result that maximizes payout (house loses more) |

---

## Integration Tips

1. **Polling current round**: Poll `/current-round` every 3-5 seconds. When `status` changes to `settled`, refetch stats.
2. **Result color mapping**:

   | Number | Color |
   |---|---|
   | 0 | red,violet |
   | 1,3,7,9 | green |
   | 2,4,6,8 | red |
   | 5 | green,violet |

3. **Result size**: 0-4 = `small`, 5-9 = `big`.
4. **30-second cycle**: Each round lasts 30s. First 25s = betting, last 5s = settlement.
5. **Profit/Loss**: Positive `profitLoss` means the house made money; negative means the house lost money.
