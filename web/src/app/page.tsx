import { HighlightsList } from "@/components/HighlightsList";
import { LaunchConnectCard } from "@/components/LaunchConnectCard";
import { ServerEvents } from "@/components/ServerEvents";
import { getHighlightData } from "@/lib/website-highlights";
import { getServerEvents } from "@/lib/server-events";
import { DISCORD_INVITE_URL } from "@/lib/site-urls";
import styles from "./page.module.css";

export default async function Home() {
  const [highlightData, serverEvents] = await Promise.all([
    getHighlightData(),
    getServerEvents(),
  ]);

  return (
    <div className={styles.shell}>
      <div className={styles.heroBackdrop} aria-hidden="true" />

      <main className={styles.main}>
        <div className={styles.topBar}>
          <div className={styles.brand}>
            <h1 className={styles.title}>
              <span className={styles.titleMain}>WEEKEND WARRIORS</span>
              <span className={styles.titleSub}>BATTLEFIELD</span>
            </h1>
          </div>
          <LaunchConnectCard />
        </div>

        <section className={styles.body}>
          <div className={styles.bodyNarrow}>
            <ul className={styles.tags} aria-label="Server features">
              <li className={`${styles.tag} ${styles.tagAccent}`}>US HOSTED</li>
              <li className={styles.tag}>10X</li>
              <li className={styles.tag}>24/7 PVP</li>
              <li className={`${styles.tag} ${styles.tagAccent}`}>
                CUSTOM AND PREMIUM PLUGINS
              </li>
            </ul>

            <p className={styles.pitch}>
              High-octane Rust with stacked loot, clans, kits, warps, skills,
              events, and QoL—built for players who want the fight, not the
              grind.
            </p>

            <ServerEvents events={serverEvents} />
          </div>

          <p className={styles.highlights}>
            <strong className={styles.highlightsLabel}>Highlights:</strong>{" "}
            {highlightData.mode === "fallback" ? (
              <HighlightsList mode="fallback" lead={highlightData.lead} />
            ) : (
              <HighlightsList mode="plugins" plugins={highlightData.plugins} />
            )}
          </p>
        </section>

        <div className={styles.bottom}>
          <a
            className={styles.discord}
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            JOIN DISCORD
            <span className={styles.discordHint}>discord.gg/CAjPNVp7Rh</span>
          </a>

          <p className={styles.footnote}>
            Unofficial community server · Not affiliated with Facepunch Studios
          </p>
        </div>
      </main>
    </div>
  );
}
