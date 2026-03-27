import { readFile } from "fs/promises";
import path from "path";

export type InstalledPluginRow = {
  name: string;
  title?: string;
  version?: string;
  /** If true, omitted from Highlights line */
  hidden?: boolean;
};

export type WebsiteHighlightsFile = {
  generatedAtUtc?: string;
  installedPlugins?: InstalledPluginRow[];
  /** Optional; site prefers computing from installedPlugins + hidden */
  websiteHighlightLabels?: string[];
};

const FALLBACK_HIGHLIGHTS =
  "Kits · Clans · Backpacks · Better Loot · Skills · Warps & TP · Warrior Coins · Plane Crash & MLRS events · Trade · Skins & stacks — full plugin list in Discord.";

function labelsFromInstalled(data: WebsiteHighlightsFile): string[] {
  if (!Array.isArray(data.installedPlugins) || data.installedPlugins.length === 0) {
    return [];
  }
  return data.installedPlugins
    .filter((p) => p && p.hidden !== true)
    .map((p) => (p.title && p.title.trim()) || p.name || "")
    .filter(Boolean);
}

/** Reads export copied to public/website-highlights.json (WebsiteHighlightsExport.cs). */
export async function getHighlightsBody(): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "public", "website-highlights.json");
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as WebsiteHighlightsFile;

    const fromInstalled = labelsFromInstalled(data);
    if (fromInstalled.length > 0) {
      return fromInstalled.join(" · ") + " — full plugin list in Discord.";
    }

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
    /* missing or invalid */
  }
  return FALLBACK_HIGHLIGHTS;
}
