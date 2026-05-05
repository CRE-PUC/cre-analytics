---
id: TASK-015
title: Postman collection for CRE Analytics API
status: done
model: cheap
model-name: SWE-1.6
context:
  - docs/context/firebase.md
  - docs/context/session-data-format.md
doc-impact: []
---

## Description

Create a Postman collection file at `postman/CRE Analytics.postman_collection.json` covering both Firebase Functions endpoints: `bakeSchema` and `submitSession`.

Firebase HTTPS callable functions are called via `POST` to a URL with the format:
```
https://{region}-{projectId}.cloudfunctions.net/{functionName}
```
For the local emulator:
```
http://127.0.0.1:5001/{firebase-project-id}/{region}/{functionName}
```

Callable functions expect the request body in the Firebase SDK's envelope format:
```json
{ "data": { ...your payload... } }
```
And `Content-Type: application/json`.

Responses come back as:
```json
{ "result": { ...your response... } }
```

The collection should use Postman variables so team members can easily switch between local emulator and production.

## Acceptance Criteria

- [ ] File created at `postman/CRE Analytics.postman_collection.json`
- [ ] Collection has two folders: `Schemas` and `Sessions`
- [ ] `Schemas` folder contains one request: `Bake Schema`
- [ ] `Sessions` folder contains one request: `Submit Session`
- [ ] Collection uses variables: `{{baseUrl}}`, `{{projectId}}`, `{{projectKey}}`
- [ ] Each request has a pre-filled example body (see below)
- [ ] A `README` or description in the collection explains how to set variables for local vs. production

## Relevant Data

**Variables to define in the collection:**

| Variable | Example (local emulator) | Example (production) |
|----------|--------------------------|----------------------|
| `baseUrl` | `http://127.0.0.1:5001/demo-cre-analytics/us-central1` | `https://us-central1-YOUR_PROJECT.cloudfunctions.net` |
| `projectId` | _(paste from backoffice)_ | _(paste from backoffice)_ |
| `projectKey` | _(paste from backoffice)_ | _(paste from backoffice)_ |

**Bake Schema request:**
- Method: `POST`
- URL: `{{baseUrl}}/bakeSchema`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "data": {
    "projectId": "{{projectId}}",
    "projectKey": "{{projectKey}}",
    "schemaVersion": "1.0.0",
    "columns": [
      { "columnName": "Tutorial Diegetico/Começou em" },
      { "columnName": "Tutorial Diegetico/Cliques/Botão A" },
      { "columnName": "Experiência Principal/Começou em" },
      { "columnName": "Experiência Principal/Cliques/Botão A" }
    ]
  }
}
```

**Submit Session request:**
- Method: `POST`
- URL: `{{baseUrl}}/submitSession`
- Headers: `Content-Type: application/json`
- Body (based on `json samples/session-sample.json`):
```json
{
  "data": {
    "projectKey": "{{projectKey}}",
    "sessionData": {
      "metaData": {
        "projectId": "{{projectId}}",
        "schemaVersion": "1.0.0",
        "sessionId": "test-session-001",
        "platform": "quest_3",
        "startedAt": "2026-05-05T10:00:00.000Z",
        "endedAt": "2026-05-05T10:05:00.000Z"
      },
      "data": [
        { "columnName": "Tutorial Diegetico/Começou em", "value": "2026-05-05T10:00:00Z" },
        { "columnName": "Tutorial Diegetico/Cliques/Botão A", "value": 40 },
        { "columnName": "Experiência Principal/Começou em", "value": "2026-05-05T10:05:00Z" },
        { "columnName": "Experiência Principal/Cliques/Botão A", "value": 30 }
      ]
    }
  }
}
```

Use Postman Collection v2.1 format. The `postman/` folder does not exist yet — create it.
