# Angour skeleton/alert audit

Existing full component audits remain applicable.
| Source | Existing target / gap | Decision and checks |
| --- | --- | --- |
| _skeleton.scss | No skeleton entry | Add bounded line/circle/thumbnail/card shapes, SSR-safe CSS animation, reduced-motion/forced-colors and typed shared-theme precedence; decorate shapes and announce one localized loading label only when requested. |
| alert.component + _alerts.scss | BuludAlert and notice store already exist | Reuse feedback entry, extend semantic/brand types, optional title/icon, Angour subtle background and thin full border, safe projected content, native dismiss output and correct status/alert roles. |
| SweetAlert confirmation | Existing generic Dialog and Button | Compose a separate tree-shakable confirm entry with controlled open, creation/confirmation/rejection presentation, safe default cancel focus, async processing guards, confirm/cancel outputs and no business actions. |

Expose only intentional secondary APIs, use shared typed theme configuration rather than introducing CSS injection or dependencies. Add three localized lazy catalog pages with live examples/source/API. Unit/Playwright tests must cover bounded rendering, reactive states, semantic announcements, dismissal/confirmation/cancel/processing, both directions/themes and theme overrides. Build/pack the actual target, validate every declaration entry and unrelated code exclusion. No public npm publication or review-gate bypass.
