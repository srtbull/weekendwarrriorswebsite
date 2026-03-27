import { readFile } from "fs/promises";
import path from "path";
import { HIGHLIGHTS_LIST_SUFFIX } from "./highlight-suffix";

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
  websiteHighlightLabels?: string[];
};

export type HighlightPlugin = {
  name: string;
  title: string;
  version?: string;
};

const FALLBACK_HIGHLIGHTS =
  "Kits · Clans · Backpacks · Better Loot · Skills · Warps & TP · Warrior Coins · Plane Crash & MLRS events · Trade · Skins & stacks — full plugin list in Discord.";

function pluginsFromInstalled(data: WebsiteHighlightsFile): HighlightPlugin[] {
  if (!Array.isArray(data.installedPlugins) || data.installedPlugins.length === 0) {
    return [];
  }
  return data.installedPlugins
    .filter((p) => p && p.hidden !== true)
    .map((p) => ({
      name: p.name,
      title: (p.title && p.title.trim()) || p.name || "",
      version: p.version,
    }))
    .filter((p) => p.title);
}

/** For the home page: structured plugins for click targets, or a single fallback string. */
export async function getHighlightData(): Promise<
  | { mode: "plugins"; plugins: HighlightPlugin[] }
  | { mode: "fallback"; text: string }
> {
  try {
    const filePath = path.join(process.cwd(), "public", "website-highlights.json");
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as WebsiteHighlightsFile;

    const fromInstalled = pluginsFromInstalled(data);
    if (fromInstalled.length > 0) {
      return { mode: "plugins", plugins: fromInstalled };
    }

    if (
      Array.isArray(data.websiteHighlightLabels) &&
      data.websiteHighlightLabels.length > 0
    ) {
      const plugins = data.websiteHighlightLabels
        .filter(Boolean)
        .map((label) => ({ name: label, title: label }));
      return { mode: "plugins", plugins };
    }
  } catch {
    /* missing or invalid */
  }
  return { mode: "fallback", text: FALLBACK_HIGHLIGHTS };
}

export async function getHighlightsBody(): Promise<string> {
  const data = await getHighlightData();
  if (data.mode === "fallback") return data.text;
  return data.plugins.map((p) => p.title).join(" · ") + HIGHLIGHTS_LIST_SUFFIX;
}
