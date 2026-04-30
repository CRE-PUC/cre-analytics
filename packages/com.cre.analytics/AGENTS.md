# AGENTS.md — com.cre.analytics (Unity UPM Package)

These rules apply whenever Windsurf works inside `packages/com.cre.analytics/`.

## Compilation Errors

If you see Unity compilation errors (CS-prefixed errors, missing type/namespace), they are almost always caused by Unity not having compiled yet after file changes — not a real code bug. **Do not attempt to fix compilation errors without first telling the user to open Unity and compile.** Only investigate if the user confirms the error persists after compilation.

## Manual Steps — Always Notify the User

Before completing any task that touches the following, tell the user exactly what manual action is required:

| Change | Manual step |
|--------|------------|
| New or modified `.cs` or `.asmdef` file | Open Unity — let it compile |
| New `.asmdef` added | Open Unity — it must import the assembly definition |
| New Unity package dependency added to `package.json` | Add it via Unity Package Manager in the editor |
| Any structural change to the package | Open Unity — verify no import errors |

## .meta Files

Do not create, delete, or modify `.meta` files. Unity generates them automatically when the project is opened. Commit them when they appear.

## Namespace

All Runtime code uses namespace `CRE.Analytics`. All Editor code uses `CRE.Analytics.Editor`.

## ScriptableObject Menus

All `CreateAssetMenu` entries use the prefix `"CRE Analytics/"`.
All `MenuItem` entries use the prefix `"CRE Analytics/"`.

## Assembly Definitions

- Runtime code → `CRE.Analytics.Runtime` asmdef
- Editor code → `CRE.Analytics.Editor` asmdef (references Runtime, `includePlatforms: ["Editor"]`)
- Do not put editor-only code in the Runtime assembly.
