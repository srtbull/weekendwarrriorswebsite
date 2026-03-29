import { existsSync } from "fs";
import path from "path";

/**
 * Resolve a file under `public/`. Handles both common build cwd values:
 * - `web/` (typical `next build` from the app folder)
 * - repo root when the parent folder is cwd (some CI / misconfigured hosts)
 */
export function resolvePublicFile(relativeUnderPublic: string): string | null {
  const rel = relativeUnderPublic.replace(/^[/\\]+/, "");
  const candidates = [
    path.join(process.cwd(), "public", rel),
    path.join(process.cwd(), "web", "public", rel),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}
