# Profile API Reference

All profile endpoints reside under `/api/v1/users/` and require a valid `Authorization: Bearer <token>` header.

---

## 1. Retrieve Current User (`GET /api/v1/users/me`)
Returns the authenticated user's profile details.

### Response (200 OK)
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "e444cf7f-c0a9-4753-a05e-ebac9444cf7f",
      "fullName": "Jane Doe",
      "email": "jane@fileflow.com",
      "role": "USER",
      "planType": "FREE",
      "emailVerified": true,
      "accountStatus": "ACTIVE",
      "storageUsed": 0,
      "storageLimit": 5368709120,
      "timezone": "UTC",
      "company": "FileFlow Inc.",
      "jobTitle": "Security Engineer",
      "createdAt": "2026-06-19T14:15:37Z",
      "updatedAt": "2026-06-19T14:20:00Z"
    }
  }
}
```

---

## 2. Update Profile Information (`PUT /api/v1/users/profile`)
Updates standard profile fields.

### Request Body
```json
{
  "fullName": "Jane Smith",
  "timezone": "America/New_York",
  "company": "Growth Co.",
  "jobTitle": "Lead Architect"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "e444cf7f-c0a9-4753-a05e-ebac9444cf7f",
      "fullName": "Jane Smith",
      "email": "jane@fileflow.com",
      "role": "USER",
      "planType": "FREE",
      "emailVerified": true,
      "accountStatus": "ACTIVE",
      "storageUsed": 0,
      "storageLimit": 5368709120,
      "timezone": "America/New_York",
      "company": "Growth Co.",
      "jobTitle": "Lead Architect",
      "createdAt": "2026-06-19T14:15:37Z",
      "updatedAt": "2026-06-19T14:24:00Z"
    }
  }
}
```

---

## 3. Update Avatar (`PUT /api/v1/users/avatar`)
Updates the avatar image reference.

### Request Body
```json
{
  "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Avatar updated successfully",
  "data": {
    "user": {
      "id": "e444cf7f-c0a9-4753-a05e-ebac9444cf7f",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
      "updatedAt": "2026-06-19T14:24:00Z"
    }
  }
}
```

---

## 4. Change Password (`PUT /api/v1/users/change-password`)
Securely updates account password credentials.

### Request Body
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewSecretPassword99!",
  "confirmPassword": "NewSecretPassword99!"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```
