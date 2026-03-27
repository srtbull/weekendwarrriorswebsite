import { HighlightsList } from "@/components/HighlightsList";
import { getHighlightData } from "@/lib/website-highlights";
import styles from "./page.module.css";

const DISCORD_URL = "https://discord.gg/CAjPNVp7Rh";

export default async function Home() {
  const highlightData = await getHighlightData();

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
          <div className={styles.comingSoon}>COMING SOON</div>
        </div>

        <section className={styles.body}>
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

          <p className={styles.highlights}>
            <strong className={styles.highlightsLabel}>Highlights:</strong>{" "}
            {highlightData.mode === "fallback" ? (
              <HighlightsList mode="fallback" text={highlightData.text} />
            ) : (
              <HighlightsList mode="plugins" plugins={highlightData.plugins} />
            )}
          </p>
        </section>

        <div className={styles.bottom}>
          <a
            className={styles.discord}
            href={DISCORD_URL}
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
