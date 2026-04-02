# 1. GLOBAL API CONVENTIONS

### Base URL

```
/api/v1
```

### Headers (MANDATORY)

```
Authorization: Bearer <access_token>
X-Request-Id: <uuid>  // auto-generated if not present
```

---

## Standard Success Response

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

## Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "requestId": "uuid"
  }
}
```

---

# 2. AUTH SERVICE

## POST `/auth/login`

Authenticate only pre-seeded workers.

### Request

```json
{
  "email": "user@example.com",
  "password": "string"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt",
    "refreshToken": "opaque",
    "expiresIn": 900
  }
}
```

---

## POST `/auth/refresh`

### Request

```json
{
  "refreshToken": "opaque"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt",
    "refreshToken": "new_refresh"
  }
}
```

---

## POST `/auth/logout`

### Request

```json
{
  "refreshToken": "opaque"
}
```

### Response

```json
{
  "success": true
}
```

---

# 3. WORKER SERVICE

## GET `/workers/me/profile`

### Behavior

* Fetch:

  * Postgres → identity
  * Mongo → hydrated profile
* Merge → DTO

### Response

```json
{
  "success": true,
  "data": {
    "id": "worker-uuid",
    "name": "Avinash",
    "email": "avinash@example.com",
    "cityId": "C1",
    "zoneId": "Z1",
    "walletBalance": 120.50,
    "profile": {
      "platform": "Zepto",
      "orderHistory": [],
      "rating": 4.7
    }
  }
}
```

---

# 4. POLICY SERVICE

## POST `/policies/quote`

### Request

```json
{
  "workerId": "uuid",
  "cityId": "C1"
}
```

### Internal Flow

* Check Redis → city risk
* If miss → call ML

### Response

```json
{
  "success": true,
  "data": {
    "policyId": "uuid",
    "status": "DRAFT",
    "premiumAmount": 50.00,
    "maxPayout": 200.00,
    "coverageMultiplier": 1.4
  }
}
```

---

## POST `/policies/{id}/activate`

### Flow (ACID TRANSACTION)

1. Check wallet balance
2. Insert ledger (negative)
3. Update wallet balance
4. Update policy → ACTIVE

### Response

```json
{
  "success": true,
  "data": {
    "policyId": "uuid",
    "status": "ACTIVE",
    "activatedAt": "timestamp"
  }
}
```

---

## GET `/policies`

### Query

```
?status=ACTIVE&page=1&limit=10
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "ACTIVE",
      "premiumAmount": 50,
      "maxPayout": 200
    }
  ],
  "meta": {
    "totalCount": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

# 5. WALLET SERVICE

## GET `/wallet`

### Response

```json
{
  "success": true,
  "data": {
    "availableBalance": 120.50
  }
}
```

---

## GET `/wallet/transactions`

### Query

```
?page=1&limit=10
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "amount": -50,
      "type": "PREMIUM_PAYMENT",
      "referenceId": "policy-id",
      "createdAt": "timestamp"
    }
  ],
  "meta": {}
}
```

---

# 6. CLAIMS SERVICE

## GET `/claims`

### Query

```
?startDate=2024-01-01&endDate=2024-01-30&page=1&limit=10
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "policyId": "uuid",
      "payoutAmount": 75,
      "severityMultiplier": 1.5,
      "disruptionType": "HEAVY_RAIN",
      "createdAt": "timestamp"
    }
  ],
  "meta": {}
}
```

---

# 7. NOTIFICATIONS SERVICE

## POST `/notifications/devices`

### Request

```json
{
  "fcmToken": "token",
  "deviceId": "device-uuid"
}
```

---

## GET `/notifications`

### Response

```json
{
  "success": true,
  "data": [
    {
      "title": "Claim Credited",
      "message": "₹50 added to wallet",
      "read": false,
      "createdAt": "timestamp"
    }
  ]
}
```

---

# 8. ADMIN SERVICE

## POST `/admin/simulate-disruption`

### Request

```json
{
  "zoneId": "Z1"
}
```

---

## POST `/admin/workers/{id}/wallet/topup`

```json
{
  "amount": 100
}
```

---

## GET `/admin/system-health`

```json
{
  "success": true,
  "data": {
    "mlService": "UP",
    "outboxLag": 2,
    "queueDepth": 5
  }
}
```

---

# 9. INTERNAL CONTRACTS

---

## Node → ML (FastAPI)

### POST `/v1/models/calculate-premium`

```json
{
  "cityId": "C1",
  "features": {
    "weather": {},
    "demand": {},
    "news": {}
  }
}
```

### Response

```json
{
  "cityRiskMultiplier": 1.4
}
```

---

## POST `/v1/models/detect-disruption`

```json
{
  "zoneId": "Z1",
  "features": {
    "weather": {},
    "platform": {},
    "news": {}
  }
}
```

### Response

```json
{
  "riskScore": 0.82,
  "classification": "HEAVY_RAIN",
  "severityMultiplier": 1.5
}
```

---

# 10. MOCK SERVER CONTRACT

## GET `/weather?cityId=C1`

## GET `/platform?zoneId=Z1`

## GET `/news?cityId=C1`

---

# 11. ASYNC JOB CONTRACT (BullMQ)

## Job: `detect-disruption`

```json
{
  "zoneId": "Z1",
  "cityId": "C1",
  "timestamp": "iso"
}
```

---

# 12. OUTBOX EVENT

```json
{
  "eventType": "ML_INFERENCE_COMPLETED",
  "payload": {
    "workerId": "uuid",
    "prediction": 0.82,
    "severityMultiplier": 1.5
  }
}
```

---

# 13. CLAIM EXECUTION LOGIC (FINALIZED)

```
payout = min(policy.premium_amount * severity_multiplier, policy.max_payout)
```
