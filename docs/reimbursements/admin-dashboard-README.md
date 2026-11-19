# Reimbursement admin dashboard handoff

## Current state

The admin page at `/admin/reimbursements` is protected by the `reimbursements` page permission and is connected to MongoDB. It supports name/purchase search and status filtering, expands each request for contact/approver/receipt details, and lets an admin change a status between `Requested` and `Paid`.

Requests are stored in the `ReimbursementRequest` collection. Receipts are stored in a dedicated GridFS bucket and served only through the authorized receipt route.

The member-facing form at `src/app/member/reimbursements/page.tsx` submits multipart form data to `/api/reimbursements` and navigates to `/member/reimbursements/complete` only after a successful API response.

## Fields to connect

Map the member form into a server-validated request record:

| Member form field | Suggested stored field | Admin display |
|---|---|---|
| Name | `requesterName` | Collapsed table |
| Phone Number/email | `requesterContact` | Expanded details only |
| Selected Q1 leadership placeholder | `approverRole`, `approverName`, optional `approverTeamMemberId` | Expanded details only |
| Purchase description | `description` | Collapsed table |
| Reimbursement amount | `amountCents` | Collapsed table |
| Receipt file | `receipt.fileId` and safe metadata | Expanded details only |
| Submission timestamp | `createdAt` | Collapsed table |
| Admin-managed state | `status` | Collapsed table and filter |

The form submits a stable approver role key; the server resolves an active `TeamMember` by role and stores a name/ID snapshot where available. Contact and receipt metadata are returned only by the admin API to users with reimbursement permission; the dashboard shows them when a row is expanded.

## MongoDB document

The server uses the existing `getDb` helper from `src/lib/mongodb.ts` and the `ReimbursementRequest` collection:

```ts
{
  _id: ObjectId;
  requesterUserId: string;
  requesterName: string;
  requesterContact: string;
  approverRole: 'president' | 'operations' | 'finance';
  approverTeamMemberId?: string;
  approverName: string;
  description: string;
  amountCents: number;
  receipt: {
    fileId: string;
    originalName: string;
    contentType: string;
    size: number;
  };
  status: 'REQUESTED' | 'PAID';
  createdAt: Date;
  updatedAt: Date;
  statusHistory: Array<{
    status: 'REQUESTED' | 'PAID';
    changedByUserId: string;
    changedAt: Date;
  }>;
}
```

Money is stored as integer cents. The persisted status values are `REQUESTED` and `PAID`, displayed as `Requested` and `Paid`. The admin route currently allows either status to be selected and records each change in `statusHistory`.

Receipts use the `reimbursement_receipts` GridFS bucket. The POST route accepts image MIME types up to 10 MB, stores the file ID and metadata on the request, and the admin receipt route serves files only to users with reimbursement permission.

## Implemented API

- `POST /api/reimbursements` requires a signed-in session, validates the request and receipt, uploads the receipt, then inserts a `REQUESTED` document and initial status history.
- `GET /api/admin/reimbursements` returns all requests, newest first, to users with reimbursement permission. The dashboard applies search and status filtering client-side; pagination is not implemented.
- `PATCH /api/admin/reimbursements/[id]` accepts `Requested` or `Paid`, updates the status, and appends the actor and timestamp to `statusHistory`.
- `GET /api/admin/reimbursements/[id]/receipt` streams the request's GridFS receipt after checking the user's reimbursement permission.

The admin page permission is defined in `src/lib/permissions.ts` for `ADMIN`, `PRESIDENT`, `VP_OPERATIONS`, and `VP_FINANCE`. API routes enforce that permission independently of the page wrapper.

Never trust client-provided requester identity, approver name, status, amount, file metadata, or record ID authorization. Derive the requester from the session, derive approver details from trusted leadership data, validate every update server-side, and audit who marks a request paid.

## Remaining follow-up

- [ ] Confirm Q1 roster and approver role mapping with the existing `TeamMember` data.
- [ ] Confirm whether a request can be marked Paid directly from Requested.
- [ ] Consider pagination and a separate details request if the collection grows.
- [ ] Verify role restrictions and GridFS receipt access against a configured MongoDB instance.
