import { readFile } from "fs/promises";
import {
  HIGHLIGHTS_LIST_SUFFIX,
  HIGHLIGHTS_SUFFIX_AFTER_DISCORD,
  HIGHLIGHTS_SUFFIX_BEFORE_DISCORD,
} from "./highlight-suffix";
import { resolvePublicFile } from "./resolve-public-path";

export type InstalledPluginRow = {
  name: string;
  title?: string;
  version?: string;
  /** If true, omitted from Highlights line */
  hidden?: boolean;
  /** Short modal blurb; usually edited in JSON, merged on server export */
  description?: string;
  /** Chat/console lines for the modal */
  commands?: string[] | string;
  /** Docs page (umod, GitHub, etc.); optional, merged on server export */
  documentationUrl?: string;
  /** If true, highlight title in premium accent on the home page */
  premium?: boolean;
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
  description?: string;
  commands?: string[];
  documentationUrl?: string;
  premium?: boolean;
};

const FALLBACK_HIGHLIGHTS_LEAD =
  "Kits · Clans · Backpacks · Better Loot · Skills · Warps & TP · Warrior Coins · Plane Crash & MLRS events · Trade · Skins & stacks";

const FALLBACK_HIGHLIGHTS =
  FALLBACK_HIGHLIGHTS_LEAD +
  HIGHLIGHTS_SUFFIX_BEFORE_DISCORD +
  "Discord" +
  HIGHLIGHTS_SUFFIX_AFTER_DISCORD;

function normalizeCommands(raw: InstalledPluginRow["commands"]): string[] | undefined {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) {
    const lines = raw.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean);
    return lines.length ? lines : undefined;
  }
  if (typeof raw === "string") {
    const lines = raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    return lines.length ? lines : undefined;
  }
  return undefined;
}

/** JSON / merge quirks sometimes ship non-boolean hidden; treat those as hidden too. */
function rowIsHidden(p: InstalledPluginRow): boolean {
  const h = p.hidden as unknown;
  if (h === true || h === 1) return true;
  if (typeof h === "string" && /^true$/i.test(h.trim())) return true;
  return false;
}

function rowIsPremium(p: InstalledPluginRow): boolean {
  const v = p.premium as unknown;
  if (v === true || v === 1) return true;
  if (typeof v === "string" && /^true$/i.test(v.trim())) return true;
  return false;
}

function pluginsFromInstalled(data: WebsiteHighlightsFile): HighlightPlugin[] {
  if (!Array.isArray(data.installedPlugins) || data.installedPlugins.length === 0) {
    return [];
  }
  return data.installedPlugins
    .filter((p) => p && !rowIsHidden(p))
    .map((p) => {
      const desc = p.description?.trim();
      const cmds = normalizeCommands(p.commands);
      const docUrl = p.documentationUrl?.trim();
      const row: HighlightPlugin = {
        name: p.name,
        title: (p.title && p.title.trim()) || p.name || "",
        version: p.version,
      };
      if (desc) row.description = desc;
      if (cmds?.length) row.commands = cmds;
      if (docUrl) row.documentationUrl = docUrl;
      if (rowIsPremium(p)) row.premium = true;
      return row;
    })
    .filter((p) => p.title);
}

/** For the home page: structured plugins for click targets, or fallback lead text (Discord suffix added in UI). */
export async function getHighlightData(): Promise<
  | { mode: "plugins"; plugins: HighlightPlugin[] }
  | { mode: "fallback"; lead: string }
> {
  try {
    const filePath = resolvePublicFile("website-highlights.json");
    if (!filePath) throw new Error("website-highlights.json not found");
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as WebsiteHighlightsFile;

    const installed = data.installedPlugins;
    const hasInstalledList = Array.isArray(installed) && installed.length > 0;

    const fromInstalled = pluginsFromInstalled(data);
    if (hasInstalledList) {
      // Never fall back to websiteHighlightLabels here: that array is not keyed by
      // hidden and would show every title (e.g. after filtering to zero visible).
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
  return { mode: "fallback", lead: FALLBACK_HIGHLIGHTS_LEAD };
}

export async function getHighlightsBody(): Promise<string> {
  const data = await getHighlightData();
  if (data.mode === "fallback") return FALLBACK_HIGHLIGHTS;
  return data.plugins.map((p) => p.title).join(" · ") + HIGHLIGHTS_LIST_SUFFIX;
}
