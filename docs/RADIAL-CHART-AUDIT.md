# Radial chart audit — 2026-11-14

The existing foundation and line-chart audits remain applicable. Angour's `donut-chart` is a scalar radial percentage (win rate), not a distribution of segments.

| Check | Existing surface | Required work |
|---|---|---|
| Public API | BuludDonutChart normalizes segment proportions; BuludProgress ring has fixed geometry and a different name/value layout. Both import shared root configuration. | Add isolated radial percentage entry without altering either API. |
| Configuration/theme | Existing shared tokens support themes. | Feature token with tested instance/default/global/CSS precedence; reactive CSS palette and unrestricted locale/text inputs. |
| Accessibility | Named static SVG/progress roles exist. | Name and exact formatted percentage remain available without pointer-only content; loading/empty/error are named status states. Inspect existing pointer behavior before introducing interactions. |
| Forms | Display-only chart. | No CVA. |
| Demo/test | No matching radial percentage layout in current demos. | Reach all exposed states; browser theme, value, language, resize and interaction checks. |
| Packaging | Native SVG is already the library convention. | Static Tailwind utilities, independent secondary entry, no new dependencies or Apex. |

Keep Angour win-rate calculation, loading condition and layout unchanged. Compare original ring paths, labels, dimensions and interactions in fa/en/ar/tr, light/dark and mobile/desktop before deleting the old renderer.
