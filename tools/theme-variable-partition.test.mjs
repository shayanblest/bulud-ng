import { test } from "node:test";
import assert from "node:assert/strict";
import { partitionThemeVariables } from "./theme-variable-partition.mjs";
test("removes duplicate geometry while preserving base, dark and nested light scopes", () => {
  const light = {
    "--size": "40px",
    "--foreground": "#000",
    "--background": "#fff",
  };
  const dark = {
    "--size": "40px",
    "--foreground": "#fff",
    "--background": "#000",
  };
  const split = partitionThemeVariables(light, dark);
  assert.deepEqual(split.common, { "--size": "40px" });
  assert.deepEqual({ ...split.common, ...split.light }, light);
  assert.deepEqual({ ...split.common, ...split.light, ...split.dark }, dark);
  assert.deepEqual({ ...split.common, ...split.dark, ...split.light }, light);
  assert.equal(Object.keys(split.dark).length, 2);
});
test("rejects a one-sided variable that could leak from an ancestor dark scope", () => {
  assert.throws(() => partitionThemeVariables({ "--a": "1" }, { "--b": "1" }));
});
