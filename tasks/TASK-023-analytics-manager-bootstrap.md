---
id: TASK-023
title: AnalyticsManager bootstrap + CREAnalytics static API
status: pending
model: medium
model-name: GPT-5.2
context:
  - docs/architecture.md
  - docs/context/unity-sdk.md
doc-impact: []
---

## Description

Create the two core runtime files that make the SDK callable from anywhere in a Unity project without scene setup or component references.

`AnalyticsManager` is an internal `MonoBehaviour` that auto-instantiates before any scene loads via `RuntimeInitializeOnLoadMethod`. `CREAnalytics` is the public static class developers call from their code. This task covers infrastructure only — session logic is implemented in TASK-024.

## Files to Create

- `packages/com.cre.analytics/Runtime/AnalyticsManager.cs`
- `packages/com.cre.analytics/Runtime/CREAnalytics.cs`

## Acceptance Criteria

### AnalyticsManager

- [ ] Class is `internal` (not part of the public API), in namespace `CRE.Analytics`, extends `MonoBehaviour`
- [ ] Has a `[RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]` static method `Bootstrap()` that:
  - Guards against duplicate initialization: `if (Instance != null) return;`
  - Creates a new `GameObject("[CRE Analytics]")`
  - Adds `AnalyticsManager` component to it
  - Calls `DontDestroyOnLoad` on the GameObject
- [ ] `Awake()` assigns `Instance = this` and calls `LoadConfig()`
- [ ] `OnDestroy()` clears `Instance = null`
- [ ] `LoadConfig()` loads `AnalyticsConfig` from `Resources.Load<AnalyticsConfig>("CREAnalyticsConfig")` and `AnalyticsSecrets` from `Resources.Load<AnalyticsSecrets>("CREAnalyticsSecrets")`; also loads `AnalyticsSchema` from `Resources.Load<AnalyticsSchema>("CREAnalyticsSchema")`
- [ ] If `AnalyticsConfig` is null: `Debug.LogError("[CRE Analytics] AnalyticsConfig not found in Resources — analytics disabled")` and sets `IsInitialized = false`; returns early
- [ ] If `AnalyticsSecrets` is null: `Debug.LogWarning("[CRE Analytics] AnalyticsSecrets not found in Resources — session submission will fail")` but continues (does not disable)
- [ ] If `AnalyticsSchema` is null: `Debug.LogWarning("[CRE Analytics] AnalyticsSchema not found in Resources — Set() calls will be discarded")` but continues
- [ ] Exposes `internal static AnalyticsManager Instance { get; private set; }`
- [ ] Exposes `public bool IsInitialized { get; private set; }` (true when config loaded successfully)
- [ ] Exposes `internal AnalyticsConfig Config { get; private set; }`
- [ ] Exposes `internal AnalyticsSecrets Secrets { get; private set; }`
- [ ] Exposes `internal AnalyticsSchema Schema { get; private set; }`
- [ ] Stub methods `internal void StartSession()`, `internal void SetValue(string columnName, object value)`, `internal void EndSession()` — each logs `Debug.LogWarning("[CRE Analytics] Session logic not yet implemented")` (replaced in TASK-024)

### CREAnalytics

- [ ] Class is `public static` in namespace `CRE.Analytics`
- [ ] `public static void StartSession()` — checks `AnalyticsManager.Instance != null && AnalyticsManager.Instance.IsInitialized`; if not, logs warning and returns; otherwise delegates to `AnalyticsManager.Instance.StartSession()`
- [ ] `public static void Set(string columnName, object value)` — same guard, delegates to `AnalyticsManager.Instance.SetValue(columnName, value)`
- [ ] `public static void EndSession()` — same guard, delegates to `AnalyticsManager.Instance.EndSession()`
- [ ] Warning message for uninitialized calls: `Debug.LogWarning("[CRE Analytics] SDK is not initialized. Call ignored.")`

## Relevant Data

`AnalyticsConfig.cs` and `AnalyticsSecrets.cs` are created in TASK-020.
`AnalyticsSchema.cs` already exists at `packages/com.cre.analytics/Runtime/AnalyticsSchema.cs`.

The schema asset must be placed at `Assets/Resources/CREAnalyticsSchema.asset` in the consumer project for runtime loading to work. This is a manual step — the developer places their schema asset there (or a copy of it). Add this note in a `// NOTE:` comment above the `Resources.Load` call.

`RuntimeInitializeOnLoadMethod` ensures `Bootstrap()` runs before any `Awake()` in the first scene. The guard on `Instance != null` makes it safe if Unity ever calls it twice.

**Manual step required:** After Windsurf completes, open Unity to compile. Then place the `AnalyticsSchema` asset at `Assets/Resources/CREAnalyticsSchema.asset` in the test Unity project and verify no console errors on play.
