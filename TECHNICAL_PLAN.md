# Technical Plan

## Objective
Consolidate the recent feature expansion (`dirty` mode, partitioning, advanced sync) into a maintainable and release-ready baseline with predictable quality gates.

## Current state (2026-02-11)
- Test suite: 419 passing tests.
- `npm run check`: passing.
- Coverage baseline: statements 100%, branches 100%, functions 100%, lines 100%.
- Main bundle size-limit: 7.22 kB (brotli).

## Priority roadmap

### P0 - Release readiness (1 sprint)
1. Documentation parity
- Keep README/API examples aligned with actual options and peer requirements.
- Maintain `CHANGELOG.md` with each release batch.

2. CI consistency
- Enforce the same commands locally and in CI (`check` + coverage run).
- Keep versioned quality thresholds explicit in config.

3. Regression safety for core hook
- Add targeted tests for remaining uncovered `useFormPersist` branches around sync-clear and partition edge paths.
- Goal: branch coverage >= 95% for `src/hooks/useFormPersist.ts`.

### P1 - Architecture hardening (1-2 sprints)
1. `useFormPersist` decomposition
- Extract persistence IO, partition codec, and sync bridge into internal modules.
- Keep hook focused on state orchestration and actions API.

2. Internal invariants
- Introduce small internal contracts (e.g., storage read/write result types) to reduce `unknown`/casting pressure.
- Add static tests for edge-case adapters (async + partial failures).

### P2 - Product maturity (2+ sprints)
1. E2E browser matrix
- Add Playwright smoke tests for multi-tab sync and storage fallback behavior.

2. Performance profiling
- Benchmark save frequency and serialization costs under large forms.
- Set target budgets for debounce/throttle scenarios and partition overhead.

3. Release ergonomics
- Add automated release notes generation from changelog sections.
- Introduce semantic version automation in CI (tag -> publish pipeline).

## Definition of done for next release
- `npm run check` and coverage command pass in CI.
- README and changelog updated.
- No untracked API behavior changes.
- Size-limit remains <= 8 kB unless explicitly approved.
