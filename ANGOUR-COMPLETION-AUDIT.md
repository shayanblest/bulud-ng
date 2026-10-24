# Angour design completion audit — 2026-10-21

User screenshots and local Angour shared UI are the visual reference. Existing modern Angular/OnPush/signals baseline is retained.

| Feature | Existing gap | Implementation / verification |
| --- | --- | --- |
| Dropdown | Search has explicit focus box; panel has a 10px gap | Remove all input borders/outlines; visible focus through the search row, panel touches field; keyboard/search/RTL regression |
| Table details | Labeled rectangular button and disconnected shaded row | Icon-only chevron with localized accessible expand/collapse names; outlined expanded row + detail surface; focus and aria-controls preserved |
| Table filtering | Only app-owned hardcoded status filter | Reusable schema-based text/select/number/date filter toolbar; controlled values; local and server modes; reset page and emit state; safe query grammar bridge in demo |
| Textarea | Only native app styling/autosize directive | Native textarea styling directive in its own entry, preserves Angular built-in CVA/validators; body background, rounded thin border, resize/autosize compatibility |
| Loading line | No top progress service/host | Determinate or indeterminate fixed primary line, 7px like Angour app; task handles handle concurrent loads; Router integration stays in base app; cleanup tests |
| Pagination | Every page/control boxed | Angour preset transparent inactive pages, no borders, primary active tile, centered SVG; leave default non-Angour theme/API intact |
| Charts | Earlier deferred due to ApexCharts dependency | Both requested line and candlestick models via dependency-free responsive SVG. Primary line and blue/orange candles like source. Typed data validation, empty/loading/error, data table for keyboard/screen-reader access, lazy demo route |

New public entries are intentional and documented. Theme instance/component/global/CSS precedence uses the existing shared theme contract. No dependency upgrades or financial/account models are copied. Charts have no animation loops, global listeners or new charting package; source ApexCharts-specific plugin APIs are not copied. Performance budget must remain below 300 kB initial assets.
