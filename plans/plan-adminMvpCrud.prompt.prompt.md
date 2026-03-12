## Plan: Admin MVP — CRUD Pages + APIs

**TL;DR**: Build 6 admin pages (points-rules, channels, rituals, events, courses, missions) with API routes, extending existing repositories. Requires 1 Prisma migration (`isActive` on Channel), repository extensions, ~12 new API route files, 6 new page files, and admin layout navigation. All following existing patterns (RBAC, Zod v4, Card component, design tokens).

---

### Phase 1: Schema & Data Layer

**Step 1** — Prisma migration: add `isActive Boolean @default(true)` to `Channel` model
- File: `prisma/schema.prisma`
- Run `prisma migrate dev --name add_channel_is_active`

**Step 2** — Extend repositories (*all parallel*)
Add `update(id, data)` and `delete(id)` methods to:
- `src/repositories/channel.repository.ts` — also modify `findAll()` to support `includeInactive` flag
- `src/repositories/ritual.repository.ts`
- `src/repositories/event.repository.ts`
- `src/repositories/mission.repository.ts`
- `src/repositories/course.repository.ts` — also add `updateLesson`, `deleteLesson`

Also update `src/app/api/channels/route.ts` to filter `isActive: true` for member-facing GET.

---

### Phase 2: API Routes (*depends on Phase 1*)

**Steps 3–7** — Create admin CRUD API routes (*all parallel*):

| Entity | Route Files | Methods |
|--------|------------|---------|
| Channels | `src/app/api/admin/channels/route.ts` + `[id]/route.ts` | GET, POST, PATCH, DELETE |
| Rituals | `src/app/api/admin/rituals/route.ts` + `[id]/route.ts` | GET, POST, PATCH, DELETE |
| Events | `src/app/api/admin/events/route.ts` + `[id]/route.ts` | GET, POST, PATCH, DELETE |
| Missions | `src/app/api/admin/missions/route.ts` + `[id]/route.ts` | GET, POST, PATCH, DELETE |
| Courses | `src/app/api/admin/courses/route.ts` + `[id]/route.ts` + `[id]/lessons/route.ts` + `[id]/lessons/[lessonId]/route.ts` | GET, POST, PATCH, DELETE |

Auth: `requireRole("ADMIN")` for writes; `requireRole("ADMIN", "MODERATOR")` for reads. Validation via Zod v4 inline schemas (matching existing pattern in `src/app/api/admin/approvals/checkins/[id]/route.ts`).

---

### Phase 3: Admin UI (*depends on Phase 2*)

**Step 8** — Update `src/app/admin/layout.tsx` — Add horizontal scrollable nav with links: Aprovações, Regras de Pontuação, Canais, Rituais, Eventos, Cursos, Missões

**Steps 9–14** — Create admin pages (*all parallel*):

| Page | Key UI Elements |
|------|----------------|
| `/admin/points-rules/page.tsx` | Card list with inline number input (points) + toggle (active) + save button per row |
| `/admin/channels/page.tsx` | List with post count, create form (name/slug/icon), inline edit, isActive toggle, delete |
| `/admin/rituals/page.tsx` | List + form: name, description, imageUrl (text), pointsValue, startAt/endAt (datetime-local), autoApprove toggle |
| `/admin/events/page.tsx` | List + form: title, description, datetime (datetime-local), link, location |
| `/admin/courses/page.tsx` | List + form: name, description, imageUrl. Expandable lessons section (title, link, order), add/edit/remove inline |
| `/admin/missions/page.tsx` | List + form: name, description, type (MANUAL/AUTOMATIC), autoApprove, tributos, startAt/endAt (optional). AUTOMATIC shows `criteriaJson` scaffold with TODO |

---

### Relevant Files

**Modify (8):** `prisma/schema.prisma`, `src/app/admin/layout.tsx`, 5× repositories, `src/app/api/channels/route.ts`

**Create (19):** 1× migration, 12× API route files, 6× admin page files

---

### Verification

1. `npx tsc --noEmit` — zero errors
2. `npx prisma validate` — schema valid
3. `npx prisma migrate dev` — runs cleanly
4. `npm run dev` — starts without errors
5. Smoke test each `/admin/*` page: CRUD operations work, forms validate, saves persist
6. RBAC: `/admin/*` as MEMBER → redirected; as ADMIN → full access
7. `GET /api/channels` (member-facing) → only `isActive: true` channels

---

### Decisions

- **Channel `isActive`**: New field via migration. Admin sees all; member API filters `isActive: true`
- **MODERATOR access**: Read-only on CRUD (GET). Writes require ADMIN only. Approvals remain ADMIN+MODERATOR
- **Image fields**: URL text input for now (no upload)
- **Datetime**: `datetime-local` input → ISO/UTC on submit → display in Brasília
- **AUTOMATIC missions**: Scaffold only — `criteriaJson` textarea with TODO comment, no runtime logic
- **Scope boundary**: No changes to existing approval flow, approval.service, or member-facing pages

---

### Further Considerations

1. **Delete vs. soft-delete for non-Channel entities**: Rituals/events/missions use hard delete. If a ritual has existing check-ins, Prisma `onDelete: Cascade` will remove them. **Recommendation**: Allow delete but show confirmation with count of related records. Alternatively, add `isActive` to all entities — but this adds scope. **Proceed with hard delete + cascade for MVP?**
2. **Event notifications**: `notificationTriggerService.onEventCreated()` already exists. Should creating an event via admin API trigger notifications to all active users? **Recommendation**: Yes, trigger on POST. This matches SYSTEM.md spec.
