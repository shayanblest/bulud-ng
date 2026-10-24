# Angour interaction polish audit — 2026-10-21

Before changing the existing controls: root APIs and feature boundaries stay intact; no new dependency is needed.

| Area | Source / gap | Work and verification |
|---|---|---|
| Pagination | User reverted last visual request | Restore pre-completion boxed Angour preset and table placement, retaining centered SVG and RTL direction fixes |
| Stepper | Angour verification/sign-up stepper: 40px circles, primary/check completed state, dotted connectors | Keep standalone projected content, model and native buttons; semantic current step, disabled/focus/empty and theme precedence tests |
| Notification button | User confirmed screenshot targets button border | Remove browser default border; retain explicit keyboard focus indicator |
| Dropdown | Search row lacks Angour treatment; top panel corners squared | Body-colored borderless search with search icon and rounded panel top; avoid clipping menu/scroll and preserve keyboard focus |
| File/image upload | Existing CVA validates type/size/count but has basic layout and no transport | Source-like borderless body-colored picker, icon, previews and per-file remove; reusable validation, controlled transport with real progress/cancel/retry/errors, no hardcoded service endpoint; preview URL cleanup |
| Public API/config | Existing shared theme precedence must remain | Extend file-upload entry intentionally; document typed constraints/upload events/options; instance/component/global/CSS precedence stays unchanged |
| Demo/tests | Need realistic success/error/cancel/retry and invalid states | Local demo receiver discards uploads; browser tests intercept endpoint for deterministic states; no automatic uploads or external destinations |

Do not copy Angour's manual change detection, application alerts, auth headers, resize side effects or business endpoint. Preserve invalid selections so errors are inspectable and the user can remove files. Consumers and servers own authorization/content validation.
