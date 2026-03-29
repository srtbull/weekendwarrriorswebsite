import rawManifest from "@/data/server-events-manifest.json";

export type ServerEventClip = {
  id: string;
  title: string;
  description?: string;
  /** Self-hosted under public/, e.g. /events/clip.mp4 */
  videoUrl?: string;
  /**
   * YouTube video id (the `v=` value). When set, the modal uses an embed instead of MP4.
   * Thumbnail auto-fills from YouTube unless posterUrl is set.
   */
  youtubeVideoId?: string;
  posterUrl?: string;
};

type EventsFile = {
  events?: unknown[];
};

const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/;

function normalizeClip(raw: unknown): ServerEventClip | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id.trim() : "";
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const videoUrl = typeof o.videoUrl === "string" ? o.videoUrl.trim() : "";
  const ytRaw =
    typeof o.youtubeVideoId === "string" ? o.youtubeVideoId.trim() : "";
  if (!id || !title) return null;

  let youtubeVideoId: string | undefined;
  if (ytRaw) {
    if (!YOUTUBE_ID.test(ytRaw)) return null;
    youtubeVideoId = ytRaw;
  }
  if (
    videoUrl &&
    !videoUrl.startsWith("/") &&
    !videoUrl.startsWith("https://")
  ) {
    return null;
  }
  if (!youtubeVideoId && !videoUrl) return null;

  const description =
    typeof o.description === "string" ? o.description.trim() : "";
  const posterUrl =
    typeof o.posterUrl === "string" ? o.posterUrl.trim() : undefined;

  const clip: ServerEventClip = { id, title };
  if (youtubeVideoId) clip.youtubeVideoId = youtubeVideoId;
  if (videoUrl) clip.videoUrl = videoUrl;
  if (description) clip.description = description;
  if (posterUrl && posterUrl.startsWith("/")) clip.posterUrl = posterUrl;
  return clip;
}

function clipsFromManifest(data: EventsFile): ServerEventClip[] {
  if (!Array.isArray(data.events)) return [];
  const out: ServerEventClip[] = [];
  for (const row of data.events) {
    const c = normalizeClip(row);
    if (c) out.push(c);
  }
  return out;
}

/**
 * Event clips for the home page. Bundled from src/data/server-events-manifest.json.
 * Use either videoUrl (MP4 in public/) or youtubeVideoId — YouTube is usually easier
 * on repo size and hosting; embed uses youtube-nocookie.
 */
export async function getServerEvents(): Promise<ServerEventClip[]> {
  return clipsFromManifest(rawManifest as EventsFile);
}
