/**
 * Copy server export source into the file Next.js serves at build time.
 * Run from web/: npm run sync:highlights
 */
import { copyFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const src = path.join(webRoot, "..", "server-plugins", "WebsiteHighlights.json");
const dest = path.join(webRoot, "public", "website-highlights.json");
copyFileSync(src, dest);
console.log("OK:", dest);
