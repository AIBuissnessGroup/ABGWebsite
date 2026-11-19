# Reimbursement page: senior developer handoff

## Current state

The page at `/member/reimbursements` submits multipart form data to `/api/reimbursements`. Its approver dropdown uses static Q1 placeholders and supports an optional `imageUrl` for each profile. The server requires a signed-in session, validates the submission, resolves an approver snapshot from `TeamMember` where available, stores request fields in MongoDB, and uploads the receipt to GridFS.

The placeholder data is in `src/app/member/reimbursements/page.tsx`, in the `APPROVERS` constant. Keep the form UI independent from database access; database reads and writes belong in server-side API routes.

## Q1 leadership roster and headshots

Replace these placeholders with the confirmed Q1 leadership data when the senior developer has access to the roster. Confirm the term/year and the current role holders before publishing names or photos.

| Dropdown role | Stable role key | Placeholder name | Headshot |
|---|---|---|---|
| Current President | `president` | `Q1 President Name` | `imageUrl: null` — add approved URL or public asset path |
| VP Operations | `operations` | `Q1 VP Operations Name` | `imageUrl: null` — add approved URL or public asset path |
| VP Finance | `finance` | `Q1 VP Finance Name` | `imageUrl: null` — add approved URL or public asset path |

The existing `TeamMember` collection uses `name`, `role`, `active`, and optional `imageUrl` fields. The public team endpoint is `/api/public/team`; it returns active team members through `src/lib/site-content/team.ts`. Once database-backed approvers are ready, resolve the three roles from that source (or a server-side helper), and map each member's `name` and `imageUrl` to the dropdown. Do not copy production roster data or headshots into this repository.

If a static roster is preferred, replace the placeholder names and `null` values in `APPROVERS`. Keep `imageUrl` optional; the UI falls back to initials when no image is configured.

## Persisted request flow

The API uses the existing MongoDB connection helper in `src/lib/mongodb.ts` from server-side code only. The client component does not connect to MongoDB directly.

### Collection and status

Requests are stored in the `ReimbursementRequest` collection with integer cents and an initial status of `REQUESTED`:

```ts
{
  _id: ObjectId;
  requesterUserId: string;
  requesterName: string;
  requesterEmail: string | null;
  approverRole: 'president' | 'operations' | 'finance';
  approverTeamMemberId?: string;
  approverName: string; // Snapshot of the selected leadership member at request time
  description: string;
  amountCents: number;
  currency: 'USD';
  receipt: {
    fileId: string;
    originalName: string;
    contentType: string;
    size: number;
  };
  status: 'REQUESTED' | 'PAID';
  statusHistory: Array<{
    status: string;
    changedByUserId: string;
    changedAt: Date;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

Store money as integer cents to avoid floating-point rounding. Keep the approver name as a snapshot so historical requests remain understandable after leadership changes.

### API boundaries

- `POST /api/reimbursements`: validates and stores the signed-in member's request and receipt.
- `GET /api/admin/reimbursements`: returns all requests to users with reimbursement permission.
- `PATCH /api/admin/reimbursements/[id]`: updates `Requested`/`Paid` and appends the actor and timestamp to status history.
- `GET /api/admin/reimbursements/[id]/receipt`: streams the receipt after checking reimbursement permission.

The repository defines `PRESIDENT`, `VP_OPERATIONS`, and `VP_FINANCE` in `src/types/next-auth.d.ts`. The admin API routes enforce the same reimbursement page permission as the dashboard.

### Receipt storage

Reuse `uploadToGridFS` from `src/lib/gridfs.ts` rather than storing receipt bytes in the request document. Save the returned file ID and safe display metadata on the request. Validate file type and size on the server, and protect downloads with request-level authorization; do not make reimbursement receipts publicly accessible.

### Current UI behavior

The form submits controlled fields and the receipt using `FormData`. It shows pending and error states and navigates to the completion page only after the server returns success. The admin dashboard loads requests from the authorized API, supports client-side search/status filtering, shows expanded details, and persists status changes.

Member request history and CSV export are not implemented. The approver roster remains placeholder data until the current leadership roles are confirmed.

## Handoff checklist

- [ ] Confirm Q1 term/year and the three role holders.
- [ ] Obtain approved headshots and populate each `imageUrl`.
- [ ] Verify the existing `TeamMember` role labels for those leaders.
- [ ] Confirm request visibility, finance/admin permissions, and status transitions.
- [ ] Implement and test server-side validation, MongoDB persistence, and receipt access.
- [ ] Verify members can only access their own requests and authorized staff can manage/export records.
