/**
 * Fills description + commands in public/website-highlights.json from public sources.
 *
 * uMod: https://umod.org/plugins/{slug}.json (description) + download_url .cs (regex commands).
 * HTML doc pages are often Cloudflare-blocked for scripts; prefer .json URLs or plugin pages
 * (script normalizes /plugins/foo → foo.json).
 *
 * Usage (from web/):
 *   node scripts/enrich-plugin-docs.mjs
 *   node scripts/enrich-plugin-docs.mjs --try-umod
 *   node scripts/enrich-plugin-docs.mjs --overwrite --only Kits
 *   node scripts/enrich-plugin-docs.mjs --dry-run
 *
 * Optional map: data/plugin-doc-urls.json → { "PluginName": "https://umod.org/plugins/slug" }
 */

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const HIGHLIGHTS_PATH = path.join(webRoot, "public", "website-highlights.json");
const URL_MAP_PATH = path.join(webRoot, "data", "plugin-doc-urls.json");

const UA = "WeekendWarriorsSiteEnrich/1.0 (+local dev; plugin docs cache)";

function parseArgs(argv) {
  const out = {
    tryUmod: false,
    overwrite: false,
    dryRun: false,
    only: null,
    delayMs: 2000,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--try-umod") out.tryUmod = true;
    else if (a === "--overwrite") out.overwrite = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--only") out.only = argv[++i] || null;
    else if (a.startsWith("--delay-ms="))
      out.delayMs = Math.max(0, parseInt(a.split("=")[1], 10) || 0);
  }
  return out;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchText(url, { json } = {}) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: json ? "application/json" : "*/*",
    },
    redirect: "follow",
  });
  if (res.status === 429) {
    const retry = res.headers.get("retry-after");
    const sec = retry ? parseInt(retry, 10) : 60;
    throw new Error(`HTTP 429 rate limited; retry after ~${sec}s`);
  }
  if (!res.ok) return { ok: false, status: res.status, text: "" };
  const text = await res.text();
  return { ok: true, status: res.status, text };
}

function umodJsonUrlFromAny(input) {
  if (!input || typeof input !== "string") return null;
  const t = input.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (!u.hostname.endsWith("umod.org")) return null;
    const m = u.pathname.match(/\/plugins\/([^/]+)/i);
    if (!m) return null;
    const slug = m[1].replace(/\.json$/i, "");
    return `https://umod.org/plugins/${slug}.json`;
  } catch {
    return null;
  }
}

function tryUmodJsonByPluginName(name) {
  const enc = encodeURIComponent(name);
  return `https://umod.org/plugins/${enc}.json`;
}

function githubToRawUrl(urlString) {
  try {
    const u = new URL(urlString);
    if (u.hostname !== "github.com") return urlString;
    const parts = u.pathname.split("/").filter(Boolean);
    const bi = parts.indexOf("blob");
    if (bi >= 3 && parts.length > bi + 1) {
      const user = parts[0];
      const repo = parts[1];
      const rest = parts.slice(bi + 1).join("/");
      return `https://raw.githubusercontent.com/${user}/${repo}/${rest}`;
    }
    return urlString;
  } catch {
    return urlString;
  }
}

function extractCommandsFromCs(source) {
  const set = new Set();
  const patterns = [
    /\[ChatCommand\(\s*"([^"]+)"/gi,
    /\[ChatCommand\(\s*'([^']+)'/gi,
    /\[ConsoleCommand\(\s*"([^"]+)"/gi,
    /\[ConsoleCommand\(\s*'([^']+)'/gi,
    /AddChatCommand\(\s*"([^"]+)"/gi,
    /AddConsoleCommand\(\s*"([^"]+)"/gi,
  ];
  for (const re of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(source)) !== null) {
      let cmd = m[1].trim();
      if (!cmd || cmd.length > 64) continue;
      if (/^Configuration\./i.test(cmd)) continue;
      const isChat =
        re.source.includes("ChatCommand") || re.source.includes("AddChatCommand");
      if (isChat && !cmd.startsWith("/")) cmd = `/${cmd}`;
      set.add(cmd);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b)).slice(0, 60);
}

function extractFromMarkdown(md) {
  const descMatch = md.match(
    /^##\s*Description\s*\n+([\s\S]*?)(?=^##\s|\Z)/im
  );
  let description = descMatch ? descMatch[1].trim() : "";
  if (!description) {
    const first = md.replace(/^#[^\n]*\n+/, "").split(/^##\s/m)[0];
    description = first?.trim().slice(0, 1200) || "";
  }
  description = description.replace(/\n{3,}/g, "\n\n").slice(0, 2000);

  const cmdMatch = md.match(
    /^##\s*(Commands|Chat commands|Player commands|Console commands)\s*\n+([\s\S]*?)(?=^##\s|\Z)/im
  );
  const block = cmdMatch ? cmdMatch[2] : "";
  const commands = [];
  const lines = block.split(/\n/);
  for (const line of lines) {
    const t = line.trim();
    if (/^[-*]\s*`?(\/[^\s`]+|`[^`]+`)`?/.test(t)) {
      const inner = t.replace(/^[-*]\s*`?/, "").replace(/`$/, "");
      commands.push(inner.replace(/^`|`$/g, ""));
    } else if (/^`\/[^`]+`$/.test(t)) {
      commands.push(t.slice(1, -1));
    }
  }
  return {
    description: description || "",
    commands: [...new Set(commands)].slice(0, 60),
  };
}

async function enrichFromUmod(jsonUrl) {
  const j = await fetchText(jsonUrl, { json: true });
  if (!j.ok) return null;
  let meta;
  try {
    meta = JSON.parse(j.text);
  } catch {
    return null;
  }
  const description = (meta.description || "").trim();
  const csUrl = meta.download_url;
  if (!csUrl || typeof csUrl !== "string") {
    return { description, commands: [], pageUrl: meta.url || null };
  }
  await sleep(800);
  const cs = await fetchText(csUrl);
  const commands = cs.ok ? extractCommandsFromCs(cs.text) : [];
  return {
    description,
    commands,
    pageUrl: meta.url || null,
  };
}

async function enrichFromReadme(rawUrl) {
  const r = await fetchText(rawUrl);
  if (!r.ok) return null;
  const { description, commands } = extractFromMarkdown(r.text);
  return { description, commands, pageUrl: rawUrl };
}

async function resolveForRow(row, urlMap, opts) {
  const name = row.name;
  const explicit = (row.documentationUrl || "").trim() || urlMap[name] || "";
  if (explicit) {
    const umod = umodJsonUrlFromAny(explicit);
    if (umod) return { type: "umod", url: umod };
    const raw =
      explicit.includes("raw.githubusercontent.com") ||
      explicit.endsWith(".md")
        ? explicit
        : githubToRawUrl(explicit);
    if (/\.md(\?|$)/i.test(raw) || raw.includes("raw.githubusercontent"))
      return { type: "readme", url: raw };
    return { type: "unknown", url: explicit };
  }
  if (opts.tryUmod) return { type: "umod", url: tryUmodJsonByPluginName(name) };
  return null;
}

async function main() {
  const opts = parseArgs(process.argv);
  const rawJson = await readFile(HIGHLIGHTS_PATH, "utf-8");
  const data = JSON.parse(rawJson);
  const rows = data.installedPlugins;
  if (!Array.isArray(rows)) {
    console.error("No installedPlugins[] in website-highlights.json");
    process.exit(1);
  }

  let urlMap = {};
  try {
    const u = await readFile(URL_MAP_PATH, "utf-8");
    urlMap = JSON.parse(u);
  } catch {
    /* optional */
  }

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row?.name) continue;
    if (opts.only && row.name !== opts.only) continue;

    const plan = await resolveForRow(row, urlMap, opts);
    if (plan?.type === "unknown") {
      console.warn(
        `[${row.name}] documentationUrl not supported (use umod.org plugin URL, GitHub README.md, or raw .md):`,
        plan.url
      );
      skipped++;
      continue;
    }
    if (!plan) {
      skipped++;
      continue;
    }

    const needDesc = opts.overwrite || !(row.description || "").trim();
    const needCmd =
      opts.overwrite ||
      !Array.isArray(row.commands) ||
      row.commands.length === 0;

    if (!needDesc && !needCmd) {
      skipped++;
      continue;
    }

    let result = null;
    try {
      if (plan.type === "umod") {
        result = await enrichFromUmod(plan.url);
        if (!result) {
          const fallback = tryUmodJsonByPluginName(row.name);
          if (fallback !== plan.url) result = await enrichFromUmod(fallback);
        }
      } else if (plan.type === "readme") {
        result = await enrichFromReadme(plan.url);
      }
    } catch (e) {
      console.warn(`[${row.name}]`, e.message || e);
    }

    if (!result) {
      console.warn(`[${row.name}] no data (404 or unsupported URL)`);
      skipped++;
      await sleep(opts.delayMs);
      continue;
    }

    const changes = [];
    if (needDesc && result.description) {
      changes.push("description");
      row.description = result.description;
    }
    if (needCmd && result.commands?.length) {
      changes.push(`commands(${result.commands.length})`);
      row.commands = result.commands;
    }
    if (result.pageUrl && !(row.documentationUrl || "").trim()) {
      row.documentationUrl = result.pageUrl;
      changes.push("documentationUrl");
    }

    if (changes.length) {
      console.log(`[${row.name}]`, changes.join(", "));
      updated++;
    } else skipped++;

    await sleep(opts.delayMs);
  }

  const out = `${JSON.stringify(data, null, 2)}\n`;
  if (opts.dryRun) {
    console.log("Dry run — not writing file.");
  } else {
    await writeFile(HIGHLIGHTS_PATH, out, "utf-8");
    console.log(`Wrote ${HIGHLIGHTS_PATH} (updated ~${updated} rows, skipped ${skipped}).`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
