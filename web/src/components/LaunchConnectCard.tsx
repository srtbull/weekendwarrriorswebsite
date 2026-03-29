"use client";

import { useCallback, useState } from "react";
import {
  SERVER_ADDRESS,
  SERVER_LAUNCH_DATE_COMPACT,
  SERVER_LAUNCH_DATE_LINE,
  SERVER_LAUNCH_TAGLINE,
  SERVER_STEAM_CONNECT_URL,
} from "@/lib/server-info";
import styles from "./LaunchConnectCard.module.css";

export function LaunchConnectCard() {
  const [copied, setCopied] = useState(false);

  const copyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SERVER_ADDRESS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <aside className={styles.card} aria-label="Server launch and connection">
      <div className={styles.rail} aria-hidden />
      <div className={styles.inner}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden />
          Launch window
        </p>
        <p className={styles.dateCompact}>{SERVER_LAUNCH_DATE_COMPACT}</p>
        <p className={styles.dateFull}>{SERVER_LAUNCH_DATE_LINE}</p>
        <p className={styles.tagline}>{SERVER_LAUNCH_TAGLINE}</p>

        <div className={styles.connectBlock}>
          <span className={styles.connectLabel}>Connect</span>
          <code className={styles.address} title="IP address and game port">
            {SERVER_ADDRESS}
          </code>
          <div className={styles.actions}>
            <a
              className={styles.connectBtn}
              href={SERVER_STEAM_CONNECT_URL}
              rel="nofollow"
            >
              Direct connect
            </a>
            <button
              type="button"
              className={styles.copyBtn}
              onClick={copyAddress}
              aria-label="Copy server address to clipboard"
            >
              {copied ? "Copied" : "Copy IP"}
            </button>
          </div>
          <p className={styles.hint}>
            Direct connect opens Steam → Rust on PC. Use F1 console{" "}
            <code className={styles.inlineCode}>client.connect {SERVER_ADDRESS}</code>{" "}
            if the link doesn’t fire.
          </p>
        </div>
      </div>
    </aside>
  );
}
