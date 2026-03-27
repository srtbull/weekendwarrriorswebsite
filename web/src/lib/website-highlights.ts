import { readFile } from "fs/promises";
import path from "path";

export type WebsiteHighlightsFile = {
  generatedAtUtc?: string;
  websiteHighlightLabels?: string[];
};

const FALLBACK_HIGHLIGHTS =
  "Kits · Clans · Backpacks · Better Loot · Skills · Warps & TP · Warrior Coins · Plane Crash & MLRS events · Trade · Skins & stacks — full plugin list in Discord.";

/** Reads plugin export copied to public/website-highlights.json (see server-plugins/WebsiteHighlightsExport.cs). */
export async function getHighlightsBody(): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "public", "website-highlights.json");
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as WebsiteHighlightsFile;
    if (
      Array.isArray(data.websiteHighlightLabels) &&
      data.websiteHighlightLabels.length > 0
    ) {
      return (
        data.websiteHighlightLabels.join(" · ") +
        " — full plugin list in Discord."
      );
    }
  } catch {
    // missing file or invalid JSON — use fallback
  }
  return FALLBACK_HIGHLIGHTS;
}
