# Context: Project Management

## Overview

A "project" in CRE Analytics corresponds to one Unity application. The backoffice lets admins create, edit, and delete projects. Each project gets a `projectId` (its Firestore document ID) and a `projectKey` (a secret token for the Unity SDK to authenticate with the backend). Both are generated as `crypto.randomUUID()` by the backoffice at creation time and are immutable after creation.

---

## Firestore Document Shape

Path: `projects/{projectId}`

```ts
interface Project {
  projectName: string;
  projectDescription: string;
  projectKey: string;   // secret for Unity SDK auth
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}
```

The Firestore document ID (`projectId`) is the same value the Unity SDK sends in `metaData.projectId` when submitting sessions. It is not stored as a field inside the document — it is the document ID.

---

## Two IDs, Two Purposes

| ID | Source | Purpose |
|----|--------|---------|
| `projectId` | Firestore document ID | Identifies which project a session belongs to. The Unity SDK puts this in `metaData.projectId`. Used in the Firestore path `projects/{projectId}/sessions/{sessionId}`. |
| `projectKey` | Field inside the document | Secret token. The Unity SDK passes this to authenticate `submitSession` calls. Validated by the Firebase Function against Firestore before writing. |

Both are generated as `crypto.randomUUID()` by the backoffice when the project is created. Both are immutable — they cannot be changed after creation.

---

## What the User Does After Creating a Project

1. Open the backoffice → Projects page
2. Create a new project (name + optional description)
3. Copy the **Project ID** and **Project Key** from the table
4. Configure these values in the Unity SDK's `AnalyticsConfig` ScriptableObject in their Unity project

---

## Editable Fields

Only `projectName` and `projectDescription` can be edited after creation. The `projectId` and `projectKey` are immutable.

---

## Deletion

Deleting a project document at `projects/{projectId}` does **not** automatically delete the `sessions` subcollection. Firestore subcollections survive document deletion. For now, this is acceptable — sessions are the historical record. A cleanup step can be added later if needed.
