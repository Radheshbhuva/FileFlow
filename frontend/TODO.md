# TODO - FileFlow Essential MVP Pages



## Step 1 — Routing + integration audit
- [x] Read existing routes and auth pages (AppRoutes, AuthLayout, ForgotPasswordPage/Form, ResetPasswordPage/Form, LoginPage/Form).
- [x] Identify mismatches vs requested MVP spec (forgot/reset copy + fields; 404 + unauthorized routes missing; common components missing).

## Step 2 — Add reusable common components
- [x] Create `src/components/common/EmptyState.tsx`
- [x] Create `src/components/common/ErrorState.tsx`
- [x] Create `src/components/common/SuccessState.tsx`
- [x] Create `src/components/common/AuthCard.tsx`

## Step 3 — Create missing pages
- [x] Create `src/pages/Unauthorized/UnauthorizedPage.tsx`
- [x] Create `src/pages/NotFound/NotFoundPage.tsx`


## Step 4 — Routing updates
- [x] Update `src/routes/AppRoutes.tsx`
  - [x] Add `/unauthorized` route
  - [x] Add catch-all `*` -> NotFoundPage
  - [ ] Ensure Home redirect behavior matches requirements


## Step 5 — Auth recovery page spec alignment
- [ ] Update Forgot Password to match spec
  - [ ] Title: “Forgot Your Password?”
  - [ ] Subtitle copy per spec
  - [ ] Fields: Email Address only (remove username)
  - [ ] Success message: “We've sent a verification code to your email address.”
- [ ] Update Reset Password to match spec
  - [ ] Fields: Verification Code, New Password, Confirm Password
  - [ ] Real-time validation + show toggle (already present for password)
  - [ ] Success state copy: “Password Updated Successfully”
  - [ ] Redirect placeholder to `/login`

## Step 6 — Prepare service layer / mock API
- [ ] Add `src/services/authService.ts`
- [ ] Add `src/types/auth.ts`
- [ ] Refactor page/form to use service layer (mock only)

## Step 7 — Verify production readiness
- [ ] Run `npm run build`
- [ ] Sanity-check routes manually (login/forgot/reset/unauthorized/404)
- [ ] Fix any TypeScript or Tailwind accessibility issues

