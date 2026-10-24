import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Self-contained: this file is included in the built npm package.
export function publicationIssues(root) {
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const issues = [];
  if (manifest.private)
    issues.push("The private workspace must not be published.");
  if (
    typeof manifest.license !== "string" ||
    !manifest.license.trim() ||
    manifest.license === "UNLICENSED"
  )
    issues.push(
      "The owner must choose a public distribution license in package.json.",
    );
  if (
    !["LICENSE", "LICENSE.md", "LICENSE.txt"].some(
      (name) =>
        existsSync(join(root, name)) &&
        statSync(join(root, name)).isFile() &&
        readFileSync(join(root, name), "utf8").trim().length > 0,
    )
  )
    issues.push("The package must include the chosen LICENSE file.");
  for (const hook of ["preinstall", "install", "postinstall"])
    if (manifest.scripts?.[hook])
      issues.push(`Consumer install hook is not allowed: ${hook}`);
  if (!manifest.name || !manifest.version)
    issues.push("Package name and version are required.");
  if (!manifest.exports?.["."]?.types || !manifest.exports?.["."]?.default)
    issues.push(
      "Publish the compiled dist/bulud-ng package, not library source.",
    );
  const targets = (value) =>
    typeof value === "string"
      ? [value]
      : value && typeof value === "object"
        ? Object.values(value).flatMap(targets)
        : [];
  for (const [entry, value] of Object.entries(manifest.exports ?? {})) {
    for (const target of targets(value)) {
      if (
        !target.startsWith("./") ||
        target.split("/").includes("..") ||
        !existsSync(join(root, target))
      )
        issues.push(`Missing or invalid export target ${entry}: ${target}`);
    }
  }
  return issues;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const issues = publicationIssues(dirname(fileURLToPath(import.meta.url)));
  if (issues.length) {
    console.error(
      `Publication is not ready:\n${issues.map((issue) => `- ${issue}`).join("\n")}`,
    );
    process.exitCode = 1;
  } else
    console.log(
      "Local publication prerequisites passed. Verify npm name ownership and registry version before publishing.",
    );
}
