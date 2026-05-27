# Deposit API - Admin Side

## Base URL

```
https://backend-ledger-0ra6.onrender.com/api
```

## Authentication

All admin endpoints require Bearer token with admin privileges:

```
Authorization: Bearer <admin_token>
```

---

## Get Deposit Orders

**Get all orders with filters:**

```
GET /admin/deposits?page=1&limit=50&status=PENDING&dateFrom=2026-03-01&dateTo=2026-03-20
```

**Get orders by user:**

```
GET /admin/deposits?userId=123456&page=1&limit=50
```

**Get single order:**

```
GET /admin/deposits?orderId=ODR1234567890123456
```

### Query Params

| Param | Type | Required | Description |
|-------|------|---------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 50, max: 100) |
| status | string | No | Filter: PENDING, SUCCESS, FAILED, REFUNDED, EXPIRED |
| userId | number | No | Filter by user ID |
| dateFrom | string | No | Start date (YYYY-MM-DD) |
| dateTo | string | No | End date (YYYY-MM-DD) |
| orderId | string | No | Get single order by ID |

### Response (paginated)

```json
{
  "status": "success",
  "total": 150,
  "page": 1,
  "limit": 50,
  "items": [
    {
      "_id": "...",
      "orderId": "ODR1234567890123456",
      "userId": 123456,
      "amount": 1000.0,
      "currency": "INR",
      "status": "PENDING",
      "gatewayOrderNo": "gw123456",
      "paymentLinks": {},
      "channelName": "SimplyPay",
      "note": "Deposit request",
      "createdAt": "2026-03-19T10:30:00.000Z",
      "updatedAt": "2026-03-19T10:30:00.000Z"
    }
  ]
}
```

### Deposit Status Values

| Status | Description |
|--------|-------------|
| PENDING | Deposit initiated, awaiting payment confirmation |
| SUCCESS | Payment received and credited to user wallet |
| FAILED | Payment failed or rejected |
| REFUNDED | Amount refunded to user |
| EXPIRED | Payment link expired |

---

## Approve Deposit Order

```
POST /admin/deposits/approve
```

**Body:**

```json
{
  "orderId": "ODR1234567890123456"
}
```

**Response:**

```json
{
  "msg": "Deposit approved",
  "orderId": "ODR1234567890123456",
  "userId": 123456,
  "amount": 1000.0,
  "status": "SUCCESS",
  "firstDepositBonus": 0
}
```
