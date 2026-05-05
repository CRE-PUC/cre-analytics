# Storybook Sync Log

**Purpose:** Records every change made to `@cre/web-ui` in this repo that hasn't yet landed in the Storybook documentation repo.

**Who reads it:** The Claude AI in the Storybook repo. Feed this file as context when you want to bring the Storybook up to date with the current state of the package.

**Who writes it:** Windsurf, as part of every task that adds, changes, or removes a component or token. This is non-optional — every task affecting the package must include a STORYBOOK_SYNC.md update in its acceptance criteria.

---

## Entry Format

Each entry must follow this structure exactly:

```
### [YYYY-MM-DD] <type>: <ComponentName>

- **Type:** new-component | modified-component | new-primitive | modified-primitive | token-change | removed
- **Status:** undocumented | documented
- **Location:** src/components/undocumented/ComponentName.tsx
- **Summary:** One sentence — what it does and why it was added.
- **Props / Changes:**
  - `propName: type` — description
  - (for modifications: describe what changed, not the full props list)
- **Usage example:**
  ```tsx
  <ComponentName prop="value">children</ComponentName>
  ```
- **Storybook notes:**
  Anything the Storybook AI should know when writing the story — variant names,
  data-attribute values used, edge cases, interaction states, accessibility notes.
```

Newest entries go at the **top** of the Log section.

---

## Migration Instructions

When ready to sync a batch of changes to the Storybook repo:

1. Provide this file to the Storybook Claude as context
2. For each `undocumented` entry: ask Claude to create a Storybook story, args table, and docs page
3. For each `token-change` entry: ask Claude to update the `DesignTokens.stories.tsx` story
4. After a successful sync, change `Status` of migrated entries from `undocumented` to `documented` (or delete the entry) and commit

---

## Log

<!-- Newest entries first -->

### [2026-05-05] modified-component: Input

- **Type:** modified-component
- **Status:** undocumented
- **Location:** src/components/Input.tsx
- **Summary:** Changed focus ring from box-shadow to a ::before pseudo-element so it renders correctly when the Input is inside a clipping ancestor (e.g. Drawer, Surface with border-radius) while maintaining proper border-radius.
- **Props / Changes:**
  - No prop changes. CSS-only fix: `box-shadow` on `:focus-within` replaced with `::before` pseudo-element using absolute positioning and `border-radius: inherit`. Added `position: relative` to `[data-cre="inputRoot"]` to anchor the pseudo-element.
- **Usage example:**
  ```tsx
  <Input value={val} onChange={setVal} />
  ```
- **Storybook notes:**
  The existing focused state story should look identical to before. Add a variant showing the Input focused inside a Surface card to verify the ring is not clipped and follows the border-radius correctly.
