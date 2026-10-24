# Final npm distribution audit — 2026-10-21

Existing per-component/full foundation audits remain applicable; no unrelated UI expansion.

| Area | Finding / action |
|---|---|
| Consumer install | Actual npm tarball installation passed with all 40 public JS entries; preserve separate exports and four explicit CSS assets. |
| Compatibility | Package advertises Angular ^20.0 although only 20.3 tested; verify minimum and current version using real consumer, correct unsupported ranges if reproducible. |
| SSR | Imports tested in Node, but rendered component/service server behavior not yet validated; add real isolated SSR consumer fixture and CI check. |
| License | Owner deferred name/account/license. No license asset copying configured; add optional LICENSE glob and document final owner requirements, do not choose a license. |
| Publication guard | Validate manifest basics, safe export paths, license content/type, public compiled artifact and absence of install hooks; preserve local npm pack. |
| Docs | Public README entry inventory predates new features; complete install/compatibility guide and npm release checklist. |
| API/dependency review | Historical dependency check fails sideEffects false -> CSS retention. Do not revert required CSS handling or self-approve historical changes; report exact pending review. Run API check. |
| Verification | Run full units, current catalog+legacy E2E on isolated ports, tooling tests, production builds, package inventory/install, optimized selected-import AOT and SSR. No unverified claim of every framework or Angular major. |
