import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.stage}>
      <div className={styles.heroBackdrop} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <h1>
              WEEKEND WARRIORS
              <span>BATTLEFIELD</span>
            </h1>
          </div>
          <div className={styles.soon}>COMING SOON</div>
        </div>

        <div className={styles.mid}>
          <div className={styles.tags}>
            <span className={`${styles.tag} ${styles.accent}`}>US HOSTED</span>
            <span className={styles.tag}>10x</span>
            <span className={styles.tag}>24/7 PVP</span>
            <span className={`${styles.tag} ${styles.accent}`}>CUSTOM + PREMIUM PLUGINS</span>
          </div>

          <p className={styles.pitch}>
            High-octane Rust with stacked loot, clans, kits, warps, skills,
            events, and QoL—built for players who want the fight, not the
            grind.
          </p>
        </div>

        <div className={styles.bottom}>
          <div className={styles.features}>
            <strong>Highlights:</strong> Kits · Clans · Backpacks · Better Loot ·
            Skills · Warps &amp; TP · Warrior Coins · Plane Crash &amp; MLRS
            events · Trade · Skins &amp; stacks — full plugin list in Discord.
          </div>

          <a
            className={styles.discord}
            href="https://discord.gg/CAjPNVp7Rh"
            target="_blank"
            rel="noopener noreferrer"
          >
            JOIN DISCORD
            <small>discord.gg/CAjPNVp7Rh</small>
          </a>
        </div>

        <p className={styles.footnote}>
          Unofficial community server · Not affiliated with Facepunch Studios
        </p>
      </div>
    </div>
  );
}
