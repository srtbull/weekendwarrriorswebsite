import styles from "./page.module.css";

const DISCORD_URL = "https://discord.gg/CAjPNVp7Rh";

export default function Home() {
  return (
    <div className={styles.shell}>
      <div className={styles.heroBackdrop} aria-hidden="true" />

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            WEEKEND WARRIORS
            <span className={styles.titleAccent}>BATTLEFIELD</span>
          </h1>
          <p className={styles.tagline}>
            Rust community server — site under construction.
          </p>
        </header>

        <div className={styles.cta}>
          <a
            className={styles.discord}
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Join Discord
            <span className={styles.discordHint}>discord.gg/CAjPNVp7Rh</span>
          </a>
        </div>

        <p className={styles.footnote}>
          Unofficial community server · Not affiliated with Facepunch Studios
        </p>
      </main>
    </div>
  );
}
