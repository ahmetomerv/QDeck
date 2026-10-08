## Architecture rules
- All app data is local: localStorage via `src/storage/*` only; components never touch localStorage directly. Why: keeps a future backend swap to one layer.
- Global state lives in `src/state/store.ts` (useSyncExternalStore); mutations only through `src/state/actions.ts`; selectors must return stable slices. Why: avoids render loops and keeps logic out of UI.
- Query generation, scheduling, ranking, normalization and session progression are pure functions in `src/lib/*`, covered by `src/test/logic.test.ts`. Why: deterministic and testable.
- The root route renders the app only after hydration. Why: all state comes from localStorage, so SSR output would mismatch.
- Routing uses TanStack Router file routes (React Router is not available in this stack).
