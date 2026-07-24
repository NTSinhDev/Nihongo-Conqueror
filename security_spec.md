# Security Specification - Lesson Plan Workflow Engine

## Data Invariants
1. **User Progress Isolation**: A user's progress (`/user_progress/{userId}`) must only be readable and writable by the user whose UID matches `{userId}`.
2. **Draft Ownership**: A lesson draft (`/lesson_drafts/{draftId}`) is owned by the user who created it (`createdById`). Only the owner can read, update, or delete their own drafts.
3. **Draft Schema Integrity**: Outgoing draft writes must adhere strictly to the schema structure, ensuring required fields like `schemaVersion`, `pipelineState`, and `context` are populated.
4. **Immutable Fields**: For drafts, the `createdById` and `createdAt` fields must be immutable after creation.
5. **Published Lessons Read-Only for Public**: Anyone can read published lessons (`/japanese_lessons/{lessonId}`), but only authenticated creators/admins can write.
6. **Casual Vocab Accessibility**: Casual vocabulary can be read by any authenticated student.

## The "Dirty Dozen" Payloads
These payloads attempt to breach the laws of identity, integrity, or state transition and must be strictly blocked:

1. **Self-Assigned Draft Theft**: Attempt to read another user's draft.
2. **Draft Spoofing (Create as Another User)**: Create a draft where `createdById` does not match `request.auth.uid`.
3. **Draft Corruption (Missing Schema Fields)**: Write a draft without the `pipelineState` or `context` field.
4. **Draft Hijack (Modify ownerId)**: Update a draft and change the `createdById` value to another user.
5. **Draft Regression (CreatedAt Mutation)**: Try to update the `createdAt` timestamp of an existing draft.
6. **Malicious ID Injection**: Inject a very long, corrupt document ID string (e.g., 2000 chars) as a draft ID.
7. **Junk Field Pollution**: Update a draft and inject an unvalidated "Ghost Field" (e.g., `isSuperAdmin: true`).
8. **Malicious Progress Overwrite**: Write to `/user_progress/{anotherUserId}` of another user.
9. **Malicious Lesson Tampering**: Update a published Japanese lesson without admin access.
10. **Malicious Course Account Creation**: Hijack an existing admin account in `course_accounts`.
11. **Malicious Casual Vocab Pollution**: Write toxic data to `casual_vocab` without authentication.
12. **PII Blanket Leak**: Retrieve all course accounts (containing sensitive credentials) with an insecure query.

## Test Cases Plan
We will implement and deploy the robust ruleset `firestore.rules` to reject all insecure access paths.
