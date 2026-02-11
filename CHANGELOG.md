# Changelog

All notable changes to this project are documented in this file.

## [0.2.0] - 2026-02-11

### Added
- `persistMode: 'dirty'` support to persist only changed fields.
- Partitioned persistence for large payloads with manifest + chunk restore.
- Integrated sync manager flow in `useFormPersist` (broadcast updates, clear propagation, sync request handling).
- CI workflow to run lint, type-check, tests, build, and size checks.
- New tests for async storage adapters, key-change restore, dirty mode, partition restore, history-disabled behavior, and sync conflict resolution.

### Changed
- Build config migrated to `rollup.config.mjs` and TypeScript build now enforces `noEmitOnError`.
- Package quality gates consolidated under `npm run check` and `prepublishOnly`.
- Peer dependency floor raised to `react >= 17.0.0`.
- Coverage thresholds adjusted to a strict realistic baseline after feature expansion.
- Size limit adjusted to `8 KB` for the main ESM bundle.

### Fixed
- Async storage handling for `getItem`, `setItem`, and `removeItem` paths in `useFormPersist`.
- Restore logic on key changes (prevents stale "already loaded" behavior).
- SyncManager listener lifecycle and callback behavior for request/clear/update events.
- Typing issues in middleware and hook internals that caused type-check instability.
