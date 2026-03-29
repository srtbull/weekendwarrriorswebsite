"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ServerEventClip } from "@/lib/server-events";
import styles from "./ServerEvents.module.css";

type Props = {
  events: ServerEventClip[];
};

function thumbForEvent(ev: ServerEventClip): string | undefined {
  if (ev.posterUrl) return ev.posterUrl;
  if (ev.youtubeVideoId) {
    return `https://i.ytimg.com/vi/${ev.youtubeVideoId}/mqdefault.jpg`;
  }
  return undefined;
}

export function ServerEvents({ events }: Props) {
  const [open, setOpen] = useState<ServerEventClip | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const close = useCallback(() => {
    videoRef.current?.pause();
    setOpen(null);
  }, []);

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

  if (events.length === 0) return null;

  return (
    <>
      <section className={styles.section} aria-label="Server event clips">
        <h2 className={styles.heading}>Server events</h2>
        <p className={styles.sub}>
          Short clips from the battlefield—tap to watch.
        </p>
        <ul className={styles.grid}>
          {events.map((ev) => {
            const thumb = thumbForEvent(ev);
            return (
              <li key={ev.id} className={styles.cardWrap}>
                <button
                  type="button"
                  className={styles.card}
                  onClick={() => setOpen(ev)}
                  aria-haspopup="dialog"
                >
                  <span className={styles.thumb} aria-hidden>
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className={styles.poster} />
                    ) : (
                      <span className={styles.thumbFallback} />
                    )}
                    <span className={styles.play} />
                  </span>
                  <span className={styles.cardTitle}>{ev.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

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
            aria-labelledby="event-video-title"
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
            <h2 id="event-video-title" className={styles.modalTitle}>
              {open.title}
            </h2>
            {open.description ? (
              <p className={styles.modalDesc}>{open.description}</p>
            ) : null}
            <div className={styles.videoShell}>
              {open.youtubeVideoId ? (
                <iframe
                  key={open.id}
                  className={styles.embed}
                  src={`https://www.youtube-nocookie.com/embed/${open.youtubeVideoId}?rel=0`}
                  title={open.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : open.videoUrl ? (
                <video
                  key={open.id}
                  ref={videoRef}
                  className={styles.video}
                  controls
                  playsInline
                  preload="none"
                  poster={open.posterUrl}
                  src={open.videoUrl}
                >
                  Your browser does not support the video tag.
                </video>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
