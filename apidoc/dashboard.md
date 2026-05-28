# Dashboard API

## Base URL

```
https://backend-ledger-0ra6.onrender.com/api
```

## Authentication

Requires Bearer token with admin privileges:

```
Authorization: Bearer <admin_token>
```

---

## Get Admin Dashboard

```
GET /admin/dashboard
```

### Query Params

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| period | string | No | `today` or `month` — filters by date range |
| date | string | No | Specific date in `YYYY-MM-DD` format |

If no filter is provided, returns **all-time** data.

### Examples

```
GET /admin/dashboard
GET /admin/dashboard?period=today
GET /admin/dashboard?period=month
GET /admin/dashboard?date=2026-03-20
```

### Response

```json
{
  "status": "success",
  "period": "today",
  "overview": {
    "totalUsers": 1000,
    "newUsers": 25
  },
  "deposits": {
    "total": 50000.0,
    "count": 50,
    "pendingCount": 5
  },
  "withdrawals": {
    "total": 30000.0,
    "chargeTotal": 1050.0,
    "count": 30,
    "success": {
      "count": 25,
      "total": 25000.0,
      "chargeTotal": 875.0
    },
    "pending": {
      "count": 3,
      "total": 3000.0,
      "chargeTotal": 105.0
    },
    "failed": {
      "count": 2,
      "total": 2000.0,
      "chargeTotal": 70.0
    },
    "byStatus": {
      "SUCCESS": { "count": 25, "total": 25000.0 },
      "PENDING": { "count": 2, "total": 2000.0 },
      "AUDITING": { "count": 1, "total": 1000.0 },
      "FAILED": { "count": 2, "total": 2000.0 }
    }
  },
  "agentCommission": {
    "total": 500.0,
    "count": 20
  }
}
```

### Field Descriptions

| Field | Description |
|-------|-------------|
| period | Filter applied: `today`, `month`, date string, or `all` |
| overview.totalUsers | Total registered user accounts |
| overview.newUsers | New users registered in the filtered period |
| deposits.total | Total deposit amount (SUCCESS only) |
| deposits.count | Number of successful deposits |
| deposits.pendingCount | Number of pending deposits |
| withdrawals.total | Total withdrawal amount (all statuses) |
| withdrawals.chargeTotal | Total charges across all withdrawals |
| withdrawals.count | Total number of withdrawal orders |
| withdrawals.success | Successful withdrawals breakdown |
| withdrawals.pending | Pending + AUDITING withdrawals combined |
| withdrawals.failed | Failed withdrawals breakdown |
| withdrawals.byStatus | Raw breakdown grouped by exact status |
| agentCommission.total | Total agent commission amount |
| agentCommission.count | Number of commission transactions |

### Error Response

```json
{
  "msg": "Error fetching admin dashboard data",
  "status": "failed",
  "error": "error message"
}
```
