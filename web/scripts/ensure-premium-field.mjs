/**
 * Ensures each installedPlugins[] row has "premium": false after "hidden" when missing.
 * Run from web/: node scripts/ensure-premium-field.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const FILES = [
  path.join(root, "public", "website-highlights.json"),
  path.join(root, "..", "server-plugins", "WebsiteHighlights.json"),
];

function injectPremium(plugins) {
  return plugins.map((p) => {
    if (!p || typeof p !== "object") return p;
    if (Object.prototype.hasOwnProperty.call(p, "premium")) return p;
    const keys = Object.keys(p);
    const out = {};
    let inserted = false;
    for (const k of keys) {
      out[k] = p[k];
      if (k === "hidden") {
        out.premium = false;
        inserted = true;
      }
    }
    if (!inserted) out.premium = false;
    return out;
  });
}

for (const file of FILES) {
  const j = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(j.installedPlugins)) continue;
  j.installedPlugins = injectPremium(j.installedPlugins);
  writeFileSync(file, JSON.stringify(j, null, 2) + "\n", "utf8");
  console.log("OK", file);
}
