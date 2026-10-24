import assert from "node:assert/strict";
import test from "node:test";
import { documentedIdentifiers } from "./public-api-docs.mjs";

test("recognizes lowercase helpers and unprefixed exports as exact identifiers", () => {
  const exports = new Set(["buludPeriodRange", "convertToRequestParams"]);
  const documented = documentedIdentifiers(
    "Exports `buludPeriodRange`, `convertToRequestParams`. Inputs `value`, `required`.",
    exports,
  );
  assert.deepEqual([...documented], [...exports]);
  assert.equal(
    documentedIdentifiers("buludPeriodRangeExtra", exports).has(
      "buludPeriodRange",
    ),
    false,
  );
  assert.equal(
    documentedIdentifiers("convertToRequestParamsExtra", exports).has(
      "convertToRequestParams",
    ),
    false,
  );
});

test("retains unknown namespaced symbols so stale documentation still fails validation", () => {
  assert.deepEqual(
    [
      ...documentedIdentifiers(
        "`BuludRemoved`, `BULUD_REMOVED`, `provideBuludRemoved`",
      ),
    ],
    ["BuludRemoved", "BULUD_REMOVED", "provideBuludRemoved"],
  );
  assert.deepEqual(
    [...documentedIdentifiers("Ordinary prose and `value` or `input`")],
    [],
  );
});
