# AWS Cognito MFA & Security Preparation Guide

This document outlines the security preparation blueprint for hardening FileFlow's identity boundaries via Amazon Cognito, focusing on Multi-Factor Authentication (MFA), Device Tracking, Account Lockouts, and Suspicious Activity monitoring.

---

## 1. Multi-Factor Authentication (MFA) Strategy

To meet enterprise compliance, Amazon Cognito User Pools will be configured to support two modes of MFA:

```
                  ┌──────────────────────────────┐
                  │   Cognito User Pool Setup    │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
   SMS-Based MFA                                   TOTP Software Tokens
   • Easy setup via AWS SNS                        • Hardened security
   • Uses user's phone number                      • Apps: Google Authenticator, Authy
   • Standard network SMS fees                     • Self-scan QR setup flows
```

### Configuration Rules
*   **MFA Status**: `OPTIONAL` (or `REQUIRED` for Admin roles).
*   **SMS Configuration**: AWS SNS must be configured with a spend limit and SMS sender ID.
*   **TOTP Setup**: The frontend displays a QR code containing the secret code returned by `AssociateSoftwareTokenCommand`. Verification is confirmed via `VerifySoftwareTokenCommand`.

---

## 2. Device Tracking & Trusted Devices

To enhance user experience and bypass repetitive MFA prompts, Device Tracking is activated:

1.  **Device Remembering**: Set Cognito's device configuration to `Always Remember` or `User Opt-In`.
2.  **MFA Bypass**: When a device is remembered, Cognito generates a cryptographic key pair stored securely on the client. During future logins, Cognito verifies the device signature and bypasses the MFA challenge.
3.  **SDK Commands**: Uses `ConfirmDeviceCommand` and `UpdateDeviceStatusCommand` on the client side.

---

## 3. Account Hardening & Recovery Policies

### A. Lockout Policies
Cognito automatically enforces lockouts on consecutive failed logins to mitigate brute-force attempts:
*   **Temporary Lockout**: Triggers after 5 failed login attempts.
*   **Lockout Duration**: Accounts remain locked for 15 minutes.
*   **Lockout Reset**: The duration resets after successful logins or manual administrative overrides (`AdminUserGlobalSignOut` or password reset).

### B. Password Policies
*   **Minimum Length**: 10 characters.
*   **Complexity**: Requires at least one uppercase, lowercase, number, and special character.
*   **Temporary Password Age**: Default admin-set passwords expire in 7 days if not completed.

---

## 4. Suspicious Activity Detection & Custom Challenges

Amazon Cognito Advanced Security Features (ASF) will be configured to monitor for anomalous activities:

*   **Risk Evaluation**: Cognito evaluates device footprints, IP addresses, and login velocities.
*   **Custom Challenges (Lambda Triggers)**:
    *   **Define Auth Challenge**: Custom Lambda trigger evaluating risk levels.
    *   **Create Auth Challenge**: Generates security challenges (e.g. captcha or hardware token prompts) if suspicious velocities or locations are detected.
    *   **Verify Auth Challenge Response**: Validates client answers prior to issuing session JWTs.
