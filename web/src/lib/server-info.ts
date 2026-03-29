/** Official launch and connection details for the home page. */
export const SERVER_LAUNCH_DATE_LINE = "April 2, 2026";
/** Short display for the hero (Bebas-friendly). */
export const SERVER_LAUNCH_DATE_COMPACT = "APR 2 · 2026";
export const SERVER_LAUNCH_TAGLINE = "First wipe · Community goes live";
export const SERVER_ADDRESS = "91.229.114.87:28023";

/** Rust Steam app id */
const RUST_STEAM_APP_ID = 252490;

/**
 * Launches Rust and runs +connect (same pattern as Ominous / working Steam links).
 * steam://connect/... is unreliable for Rust; use run/{appId}//+connect%20ip:port
 */
export const SERVER_STEAM_CONNECT_URL = `steam://run/${RUST_STEAM_APP_ID}//+connect%20${SERVER_ADDRESS}`;
