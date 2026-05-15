# PWA Web Push Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CROWN installable as a PWA and add native Web Push notifications for essential member events and admin global announcements.

**Architecture:** Keep the app as a single Next.js App Router project. Add static PWA assets/service worker in `public/`, persist push subscriptions in Prisma, and route all push delivery through focused server-side services that run in Node.js runtime. Existing in-app notification triggers remain the source of truth; push delivery is a best-effort side effect.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma/Postgres, Auth.js, TypeScript, Vitest, native Web Push with VAPID via `web-push`.

---

## File Map

- Create `public/manifest.webmanifest`: PWA manifest with app name, icons, colors, display mode and start URL.
- Create `public/sw.js`: service worker for install/activate, offline fallback, push display and safe notification click handling.
- Create `src/app/offline/page.tsx`: branded offline fallback page.
- Modify `src/app/layout.tsx`: add manifest metadata, theme color, Apple PWA metadata and viewport hints.
- Modify `next.config.ts`: include Node-only push dependency in `serverExternalPackages`.
- Create PWA icons under `public/icons/`: generated from existing `public/logo.png` if possible.
- Modify `prisma/schema.prisma`: add `PushSubscription` and `AdminNotificationBroadcast` models, `User.pushSubscriptions`, `User.adminNotificationBroadcasts`, and optional `Notification.linkUrl`.
- Create: `prisma/migrations/*_add_web_push/migration.sql` via Prisma migrate.
- Create `src/lib/push/url.ts`: validate notification destination URLs.
- Create `src/lib/push/vapid.ts`: read and validate VAPID env config.
- Create `src/repositories/push-subscription.repository.ts`: database access for push subscription upsert/delete/find/cleanup.
- Create `src/services/push.service.ts`: Web Push delivery, batching, invalid-subscription cleanup, non-blocking error behavior.
- Create `src/services/admin-notification.service.ts`: global admin broadcast creation, in-app notification fan-out, push fan-out and audit counts.
- Modify `src/services/notification-trigger.service.ts`: send push for comment, reply, approval and event notifications; leave likes in-app only.
- Create `src/app/api/push/vapid-public-key/route.ts`: authenticated public key endpoint.
- Create `src/app/api/push/subscriptions/route.ts`: authenticated subscribe/unsubscribe endpoint.
- Create `src/app/api/admin/notifications/route.ts`: admin-only global broadcast endpoint.
- Modify `src/repositories/notification.repository.ts`: accept optional `linkUrl` and global batch creation helpers if needed.
- Create `src/components/pwa-notification-manager.tsx`: client UI for service worker registration, subscribe/unsubscribe and status messages.
- Modify `src/components/providers.tsx`: mount PWA notification manager inside authenticated app shell if appropriate.
- Modify `src/components/admin-shell.tsx`: add `Notificações` nav item.
- Create `src/app/admin/notifications/page.tsx`: admin form for global announcements.
- Create tests in `src/lib/push/*.test.ts`, `src/services/*.test.ts`, and repository/service tests where practical with mocks.
- Modify `package.json` and `package-lock.json`: add `web-push` and `@types/web-push`.

## Task 1: Add PWA Static Shell

**Files:**
- Create: `public/manifest.webmanifest`
- Create: `public/sw.js`
- Create: `src/app/offline/page.tsx`
- Modify: `src/app/layout.tsx`
- Create: `public/icons/*`

- [ ] **Step 1: Add PWA metadata and offline route**

Implement manifest metadata in `src/app/layout.tsx`:

```ts
export const metadata: Metadata = {
  title: "CROWN — Comunidade",
  description: "Comunidade CROWN para mulheres empreendedoras",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CROWN",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};
```

- [ ] **Step 2: Create manifest**

Use `name`, `short_name`, `start_url: "/inicio"`, `scope: "/"`, `display: "standalone"`, `background_color`, `theme_color`, and icon entries for 192, 512 and maskable variants.

- [ ] **Step 3: Create service worker**

Add install/activate, navigation-only `GET` fallback to `/offline`, `push` notification handling, `pushsubscriptionchange`, and `notificationclick`. Do not intercept `/api`, auth/session requests, POST/PUT/PATCH/DELETE, or dynamic authenticated responses. In `notificationclick`, only open URLs from the app origin or fallback to `/inicio`.

- [ ] **Step 4: Generate icons**

Use `public/logo.png` as source if dimensions allow. Prefer a local image tool if available; otherwise create minimal PNG assets manually from existing brand asset without changing app behavior.

- [ ] **Step 5: Verify PWA assets**

Run: `npm run build`

Expected: build succeeds and no missing public asset references.

## Task 2: Persist Push Subscriptions

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/*_add_web_push/migration.sql`
- Create: `src/repositories/push-subscription.repository.ts`
- Create: `src/repositories/push-subscription.repository.test.ts`

- [ ] **Step 1: Write repository tests with mocked Prisma**

Cover upsert by endpoint, delete by endpoint+user, find by user IDs, and delete invalid endpoints.

- [ ] **Step 2: Add Prisma models**

Add relation to `User`:

```prisma
pushSubscriptions PushSubscription[]
adminNotificationBroadcasts AdminNotificationBroadcast[]
```

Add optional link to `Notification`:

```prisma
linkUrl String?
```

Add `PushSubscription`:

```prisma
model PushSubscription {
  id             String   @id @default(cuid())
  userId         String
  endpoint       String   @unique @db.Text
  p256dh         String   @db.Text
  auth           String   @db.Text
  userAgent      String?  @db.Text
  expirationTime DateTime?
  lastSeenAt     DateTime @default(now())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([lastSeenAt])
}
```

Add `AdminNotificationBroadcast` with `createdByUserId`, unique `idempotencyKey`, title/body/link, status, target and delivery counters.

- [ ] **Step 3: Create Prisma migration**

Run: `npx prisma migrate dev --name add_web_push`

Expected: migration SQL is created and Prisma Client regenerates successfully.

- [ ] **Step 4: Implement repository**

Expose `upsertForUser`, `deleteForUser`, `findByUser`, `findByUsers`, and `deleteByEndpoints`.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/repositories/push-subscription.repository.test.ts`

Expected: tests pass.

## Task 3: Add Push URL and VAPID Utilities

**Files:**
- Create: `src/lib/push/url.ts`
- Create: `src/lib/push/url.test.ts`
- Create: `src/lib/push/vapid.ts`
- Create: `src/lib/push/vapid.test.ts`

- [ ] **Step 1: Write URL validation tests**

Cover internal URLs, same-origin absolute URLs, external URLs, malformed URLs and `javascript:`.

- [ ] **Step 2: Implement `normalizeNotificationUrl`**

Return a safe path for internal/same-origin URLs and `/inicio` for empty values. Throw or return invalid for unsafe destinations depending on caller needs.

- [ ] **Step 3: Write VAPID config tests**

Cover complete env, missing env and disabled behavior.

- [ ] **Step 4: Implement VAPID helper**

Read `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`; expose `getVapidPublicKey()` and `getVapidConfig()`.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/lib/push/url.test.ts src/lib/push/vapid.test.ts`

Expected: tests pass.

## Task 4: Implement Push Delivery Service

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `next.config.ts`
- Create: `src/services/push.service.ts`
- Create: `src/services/push.service.test.ts`

- [ ] **Step 1: Install dependency**

Run: `npm install web-push @types/web-push`

Expected: package files updated.

- [ ] **Step 2: Configure Next server external package**

Add `web-push` to `serverExternalPackages` in `next.config.ts` beside `nodemailer`.

- [ ] **Step 3: Write service tests**

Mock `web-push`, VAPID helper and subscription repository. Cover successful send, missing VAPID no-op, permanent 404/410 cleanup, transient error logging, and batching for multiple users.

- [ ] **Step 4: Implement service**

Expose `sendToUser(userId, payload)` and `sendToUsers(userIds, payload)`. Convert DB records to Web Push subscription shape and send JSON payload `{ title, body, url, notificationId }`. Never throw for per-device delivery failure.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/services/push.service.test.ts`

Expected: tests pass.

## Task 5: Add Push Subscription APIs and Client Manager

**Files:**
- Create: `src/app/api/push/vapid-public-key/route.ts`
- Create: `src/app/api/push/subscriptions/route.ts`
- Create: `src/app/api/push/subscriptions/route.test.ts`
- Create: `src/components/pwa-notification-manager.tsx`
- Modify: `src/components/providers.tsx`

- [ ] **Step 1: Implement API routes**

Set `export const runtime = "nodejs"`. Require auth. Public key route returns `{ publicKey }` when configured. Subscription route validates `endpoint`, `keys.p256dh`, `keys.auth`, optional `expirationTime`, then upserts/deletes for current user.

Deletion must only remove endpoints owned by the current user. Endpoint transfer to another account is only allowed on explicit `POST` subscribe while authenticated as that account, and only when the submitted endpoint keys match the existing subscription. Differing keys are rejected by the repository to avoid endpoint ownership confusion.

- [ ] **Step 2: Add route/security tests**

Cover unauthenticated requests, unauthenticated delete, delete ownership, explicit subscribe delegation to repository-owned transfer validation, malformed subscription body and missing VAPID public key behavior.

- [ ] **Step 3: Implement client manager**

Register `/sw.js`, check feature support, display a compact status/action UI, request permission only after user click, subscribe with VAPID key, POST subscription to API, and support unsubscribe/delete.

- [ ] **Step 4: Mount manager**

Mount in `Providers` so it is available throughout the app, but make the component no-op when unauthenticated or unsupported.

- [ ] **Step 5: Verify manually in browser**

Run: `npm run dev`

Expected: app loads, service worker registers, notification permission is only requested after click.

## Task 6: Connect Existing Notification Triggers to Push

**Files:**
- Modify: `src/services/notification-trigger.service.ts`
- Modify or create: `src/services/notification-trigger.service.test.ts`

- [ ] **Step 1: Write/extend tests**

Cover comment, reply, approval and event trigger calling push after in-app notification creation. Cover like trigger not calling push.

- [ ] **Step 2: Implement non-blocking push side effect**

After creating in-app notifications, call `pushService.sendToUser` or `sendToUsers`. Catch/log push failures without interrupting existing flows.

- [ ] **Step 3: Run focused tests**

Run: `npm test -- src/services/notification-trigger.service.test.ts`

Expected: tests pass.

## Task 7: Add Admin Global Notifications

**Files:**
- Create: `src/services/admin-notification.service.ts`
- Create: `src/services/admin-notification.service.test.ts`
- Create: `src/app/api/admin/notifications/route.ts`
- Create: `src/app/api/admin/notifications/route.test.ts`
- Create: `src/app/admin/notifications/page.tsx`
- Modify: `src/components/admin-shell.tsx`
- Modify: `src/repositories/notification.repository.ts`

- [ ] **Step 1: Write service tests**

Cover active-user targeting, audit record creation with unique idempotency key, in-app notification creation with `linkUrl`, push fan-out, invalid URL rejection and idempotency retry behavior that does not resend.

- [ ] **Step 2: Implement admin service**

Validate title/body/link. Require `idempotencyKey` from API input. Create broadcast audit record. If the key already exists for that admin, return existing counts without resending. Find active users. Create in-app notifications in batches with `linkUrl`. Send push in batches. Update audit counters/status.

- [ ] **Step 3: Implement admin API**

Set `runtime = "nodejs"`, require `ADMIN`, validate body with Zod, accept/generate client idempotency key, call service and return counts.

- [ ] **Step 4: Add admin route/security tests**

Cover unauthenticated access, non-admin access, invalid URL rejection, missing/duplicate idempotency key and successful admin send.

- [ ] **Step 5: Implement admin page**

Add form fields for title, message and optional link. Generate a per-submit idempotency key in the client, submit to API and show success/error counts. Keep UI consistent with existing admin pages.

- [ ] **Step 6: Add nav item**

Add `{ href: "/admin/notifications", label: "Notificações" }` to `src/components/admin-shell.tsx`.

- [ ] **Step 7: Run focused tests**

Run: `npm test -- src/services/admin-notification.service.test.ts`

Expected: tests pass.

## Task 8: Final Verification

**Files:**
- All changed files

- [ ] **Step 1: Confirm migration and generate Prisma client**

Run: `npx prisma generate`

Expected: migration exists under `prisma/migrations/*_add_web_push/` and Prisma Client generated successfully.

- [ ] **Step 2: Run tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: no lint errors.

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: production build succeeds.

- [ ] **Step 5: Manual PWA smoke test**

Run: `npm run dev`, open the app, verify manifest/service worker registration in DevTools, activate notifications, send a test admin broadcast, and click the displayed notification.

## Notes

- Do not commit unless the user explicitly asks for commits.
- Do not cache authenticated API responses in the service worker.
- Push delivery is best effort; in-app notifications remain authoritative.
- Production requires HTTPS and valid `VAPID_*` environment variables.
