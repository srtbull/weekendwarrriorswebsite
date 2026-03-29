"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HighlightPlugin } from "@/lib/website-highlights";
import {
  HIGHLIGHTS_SUFFIX_AFTER_DISCORD,
  HIGHLIGHTS_SUFFIX_BEFORE_DISCORD,
} from "@/lib/highlight-suffix";
import { DISCORD_INVITE_URL } from "@/lib/site-urls";
import styles from "./HighlightsList.module.css";

type Props =
  | { mode: "fallback"; lead: string }
  | { mode: "plugins"; plugins: HighlightPlugin[] };

function HighlightsDiscordSuffix() {
  return (
    <>
      {HIGHLIGHTS_SUFFIX_BEFORE_DISCORD}
      <a
        className={styles.discordSuffixLink}
        href={DISCORD_INVITE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        Discord
      </a>
      {HIGHLIGHTS_SUFFIX_AFTER_DISCORD}
    </>
  );
}

export function HighlightsList(props: Props) {
  if (props.mode === "fallback") {
    return (
      <span>
        {props.lead}
        <HighlightsDiscordSuffix />
      </span>
    );
  }

  const { plugins } = props;
  if (plugins.length === 0) {
    return (
      <span>
        <HighlightsDiscordSuffix />
      </span>
    );
  }

  return <HighlightsInteractive plugins={plugins} />;
}

function HighlightsInteractive({ plugins }: { plugins: HighlightPlugin[] }) {
  const [open, setOpen] = useState<HighlightPlugin | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <span className={styles.inline}>
        {plugins.map((p, i) => (
          <span key={p.name + i}>
            {i > 0 ? " · " : null}
            <button
              type="button"
              className={
                p.premium
                  ? `${styles.pluginTrigger} ${styles.pluginTriggerPremium}`
                  : styles.pluginTrigger
              }
              onClick={() => setOpen(p)}
              aria-haspopup="dialog"
            >
              {p.title}
            </button>
          </span>
        ))}
        <span className={styles.suffix}>
          <HighlightsDiscordSuffix />
        </span>
      </span>

      {open ? (
        <div
          className={styles.backdrop}
          role="presentation"
          onClick={close}
          aria-hidden
        >
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="plugin-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeBtnRef}
              type="button"
              className={styles.closeBtn}
              onClick={close}
              aria-label="Close"
            >
              ×
            </button>
            <h2
              id="plugin-modal-title"
              className={
                open.premium
                  ? `${styles.modalTitle} ${styles.modalTitlePremium}`
                  : styles.modalTitle
              }
            >
              {open.title}
            </h2>
            <p className={styles.modalMeta}>
              <span className={styles.modalLabel}>Internal name</span>{" "}
              <code className={styles.code}>{open.name}</code>
            </p>
            {open.version ? (
              <p className={styles.modalMeta}>
                <span className={styles.modalLabel}>Version</span>{" "}
                <span>{open.version}</span>
              </p>
            ) : null}

            {open.documentationUrl ? (
              <p className={styles.modalMeta}>
                <a
                  className={styles.docLink}
                  href={open.documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Full documentation →
                </a>
              </p>
            ) : null}

            {open.description ? (
              <p className={styles.modalDescription}>{open.description}</p>
            ) : null}

            {open.commands?.length ? (
              <div className={styles.commandsBlock}>
                <h3 className={styles.commandsHeading}>Commands</h3>
                <ul className={styles.commandsList}>
                  {open.commands.map((line, idx) => (
                    <li key={idx}>
                      <code className={styles.commandLine}>{line}</code>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {!open.description &&
            (!open.commands || open.commands.length === 0) ? (
              <p className={styles.modalHint}>
                No description or commands listed for this plugin yet.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
