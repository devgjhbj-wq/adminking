# User Management API

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

## 1. Search User

Get user details, wallet, and count of users sharing the same IP. Search by `userId` or `mobile`.

```
GET /admin/user?userId=12345678
GET /admin/user?mobile=3333333333
```

### Query Params

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| userId | number | One required | User ID to search |
| mobile | string | One required | 10-digit mobile number to search |

### Response

```json
{
  "user": {
    "userId": 12345678,
    "mobile": "9899***10",
    "admin": false,
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-05-28T12:00:00.000Z"
  },
  "account": {
    "user": 12345678,
    "balance": 15000.50,
    "totalDeposits": 50000,
    "totalWithdrawals": 30000,
    "status": "active",
    "statusRemark": "",
    "gameMemberCreated": true,
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-05-28T12:00:00.000Z"
  },
  "paymentMethods": {
    "userId": 12345678,
    "holderName": "John Doe",
    "bank": {
      "bankName": "SBI",
      "ifsc": "SBIN0001234",
      "accountNo": "1234567890"
    },
    "upi": {
      "address": "john@paytm"
    },
    "upay": {
      "address": ""
    },
    "isDefault": true,
    "isActive": true,
    "createdAt": "2026-01-20T05:00:00.000Z",
    "updatedAt": "2026-05-28T12:00:00.000Z"
  },
  "sameIpUsers": 3,
  "lastIp": "2409:40d4:204a:2522:1c58:192c:1d24:fffa",
  "deviceInfo": {
    "ip": "2409:40d4:204a:2522:1c58:192c:1d24:fffa",
    "network": "2409:40d4:2000::/37",
    "version": "IPv6",
    "city": "Jodhpur",
    "region": "Rajasthan",
    "region_code": "RJ",
    "country": "IN",
    "country_name": "India",
    "country_code": "IN",
    "country_code_iso3": "IND",
    "country_capital": "New Delhi",
    "country_tld": ".in",
    "continent_code": "AS",
    "in_eu": false,
    "postal": "342001",
    "latitude": 26.2692,
    "longitude": 73.009,
    "timezone": "Asia/Kolkata",
    "utc_offset": "+0530",
    "country_calling_code": "+91",
    "currency": "INR",
    "currency_name": "Rupee",
    "languages": "en-IN,hi,bn,te,mr,ta,ur,gu,kn,ml,or,pa,as,bh,sat,ks,ne,sd,kok,doi,mni,sit,sa,fr,lus,inc",
    "country_area": 3287590.0,
    "country_population": 1352617328,
    "asn": "AS55836",
    "org": "Reliance Jio Infocomm Limited",
    "isp": "Reliance Jio Infocomm Limited",
    "createdAt": "2026-06-07T10:30:00.000Z"
  }
}
```

| Field | Description |
|-------|-------------|
| user | User profile (userId, mobile, admin flag) |
| account | Wallet, status, turnover info |
| paymentMethods | Single object per user with embedded `bank`, `upi`, `upay` sub-objects |
| sameIpUsers | Number of other users sharing the same last-known IP |
| lastIp | The user's last-known IP address |
| deviceInfo | Full geolocation and network details from registration (`ip`, `city`, `region`, `country_name`, `asn`, `org`, `latitude`, `longitude`, `timezone`, `isp`, etc.) |

### Error

```json
{ "msg": "Invalid or missing userId" }
{ "msg": "User or account not found" }
```

---

## 2. Ban / Suspend / Activate User

```
PATCH /admin/user
```

### Request Body

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| userId | number | Yes | User ID |
| status | string | Yes | `active`, `suspended`, `ban`, `banned`, or `inactive` |
| remark | string | **Yes** when banning or suspending | Reason for the action |

### Example (ban)

```json
{
  "userId": 12345678,
  "status": "ban",
  "remark": "Fraudulent activity detected"
}
```

### Example (activate)

```json
{
  "userId": 12345678,
  "status": "active"
}
```

### Response

```json
{
  "msg": "Status updated",
  "userId": 12345678,
  "status": "inactive",
  "statusRemark": "Fraudulent activity detected",
  "updatedAt": "2026-05-28T12:00:00.000Z"
}
```

| Status Value | Maps To | Effect |
|-------------|---------|--------|
| `active` | active | User can login and use the platform |
| `suspended` | suspended | Login blocked, requires remark |
| `ban`, `banned`, `inactive` | inactive | Login blocked, requires remark |

### Error

```json
{ "msg": "Remark is required when banning or suspending" }
{ "msg": "Invalid or missing userId" }
{ "msg": "Missing status" }
```

---

## 3. Update User Payment Details

Create or update a user's payment method (BANK, UPI, or UPAY).

```
PUT /admin/user/payments
```

### Request Body

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| userId | number | **Yes** | User ID |
| type | string | **Yes** | `BANK`, `UPI`, or `UPAY` |

**For BANK type:**

| Param | Type | Description |
|-------|------|-------------|
| accountNo | string | Bank account number |
| ifsc | string | IFSC code |
| bankName | string | Bank name |
| bankCode | string | Bank code (alias for ifsc) |
| accountHolder | string | Account holder name |

**For UPI type:**

| Param | Type | Description |
|-------|------|-------------|
| upiId | string | UPI ID (e.g. name@upi) |
| accountHolder | string | Account holder name |

**For BANK type:**

| Param | Type | Description |
|-------|------|-------------|
| accountNo | string | Bank account number |
| ifsc | string | IFSC code |
| bankName | string | Bank name |
| bankCode | string | Alias for ifsc (used if `ifsc` not provided) |
| accountHolder | string | Account holder name (maps to `holderName`) |

**For UPI type:**

| Param | Type | Description |
|-------|------|-------------|
| upiId | string | UPI ID (e.g. name@upi, maps to `upi.address`) |
| accountHolder | string | Account holder name |

**For UPAY type:**

| Param | Type | Description |
|-------|------|-------------|
| rplId | string | UPAY RPL ID (maps to `upay.address`) |
| accountHolder | string | Account holder name |

### Example (BANK)

```json
{
  "userId": 12345678,
  "type": "BANK",
  "bankName": "SBI",
  "ifsc": "SBIN0001234",
  "accountNo": "1234567890",
  "accountHolder": "John Doe"
}
```

### Example (UPI)

```json
{
  "userId": 12345678,
  "type": "UPI",
  "upiId": "john@paytm",
  "accountHolder": "John Doe"
}
```

### Example (UPAY)

```json
{
  "userId": 12345678,
  "type": "UPAY",
  "rplId": "RPL123456",
  "accountHolder": "John Doe"
}
```

### Response

```json
{
  "msg": "Updated",
  "userId": 12345678,
  "paymentMethods": {
    "userId": 12345678,
    "holderName": "John Doe",
    "bank": {
      "bankName": "SBI",
      "ifsc": "SBIN0001234",
      "accountNo": "1234567890"
    },
    "upi": { "address": "" },
    "upay": { "address": "" },
    "isDefault": true,
    "isActive": true
  }
}
```

### Error

```json
{ "msg": "type must be BANK, UPI, or UPAY" }
{ "msg": "Invalid or missing userId" }
```

---

## 4. View User Payment Methods

Get a user's payment methods document.

```
GET /admin/user/payment-methods?userId=12345678
```

### Query Params

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| userId | number | Yes | User ID |

### Response

```json
{
  "status": "success",
  "data": {
    "userId": 12345678,
    "holderName": "John Doe",
    "bank": {
      "bankName": "SBI",
      "ifsc": "SBIN0001234",
      "accountNo": "1234567890"
    },
    "upi": { "address": "john@paytm" },
    "upay": { "address": "" },
    "isDefault": true,
    "isActive": true
  }
}
```

Returns `null` in `data` if user has no payment methods.

---

## 5. Update User Payment Method (by ID)

Partially update a specific payment method document. Fields are merged — sending only the fields you want to change.

```
PUT /admin/user/payment-methods/:id
```

### Request Body

All fields optional.

| Param | Type | Description |
|-------|------|-------------|
| holderName | string | Update account holder name |
| upiId | string | Updates `upi.address` |
| rplId | string | Updates `upay.address` |
| accountNo | string | Updates `bank.accountNo` |
| ifsc | string | Updates `bank.ifsc` |
| bankName | string | Updates `bank.bankName` |
| isActive | boolean | Set `false` to disable |
| isDefault | boolean | Set flag |

### Example

```json
{
  "upiId": "new@paytm",
  "isDefault": true
}
```

### Response

```json
{
  "status": "success",
  "data": { "...": "full document" }
}
```

---

## 6. List Users by IP

Get all users who have logged in from a specific IP address.

```
GET /admin/users-by-ip?ip=192.168.1.1
```

### Query Params

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| ip | string | Yes | IP address to search |

### Response

```json
{
  "status": "success",
  "ip": "192.168.1.1",
  "totalUsers": 3,
  "users": [
    {
      "userId": 12345678,
      "mobile": "9899***10",
      "createdAt": "2026-01-15T10:30:00.000Z"
    },
    {
      "userId": 87654321,
      "mobile": "9899***11",
      "createdAt": "2026-02-20T14:00:00.000Z"
    }
  ]
}
```

### Error

```json
{ "status": "failed", "msg": "ip is required" }
```

---

## Summary of Changes

| Action | Old Endpoint | New Endpoint |
|--------|-------------|-------------|
| Search user (optimized) | `GET /admin/user` | Same — now returns `sameIpUsers` instead of `deviceRisk` |
| Ban/activate user | `PATCH /admin/user` | Same — now requires `remark` for ban/suspend |
| Edit payment details | `PUT /admin/user/bind-bank` | **`PUT /admin/user/payments`** — single doc per user with embedded `bank`/`upi`/`upay` |
| View payment methods | _(did not exist)_ | **`GET /admin/user/payment-methods`** — new |
| Update payment method (partial) | _(did not exist)_ | **`PUT /admin/user/payment-methods/:id`** — new |
| Users by IP | _(did not exist)_ | **`GET /admin/users-by-ip`** — new |
| Ban enforcement | _(did not exist)_ | Auth middleware now blocks banned users from login or API access |
