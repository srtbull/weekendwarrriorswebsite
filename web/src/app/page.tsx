export default function Home() {
  return (
    <div className="stage">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #0a0604; }
        .stage {
          width: 1920px;
          height: 1080px;
          position: relative;
          overflow: hidden;
          font-family: "Barlow Condensed", system-ui, sans-serif;
          color: #f4f1ec;
        }
        .bg {
          position: absolute;
          inset: 0;
          background: url("/oil-rig.png") center center / cover no-repeat;
          background-color: #0a0604; /* fallback if oil-rig.png isn't provided yet */
        }
        .vignette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 120% 100% at 50% 40%, transparent 20%, rgba(10, 6, 4, 0.75) 100%),
            linear-gradient(180deg, rgba(8, 5, 3, 0.55) 0%, transparent 35%, transparent 62%, rgba(8, 5, 3, 0.88) 100%),
            linear-gradient(90deg, rgba(8, 5, 3, 0.5) 0%, transparent 28%, transparent 72%, rgba(8, 5, 3, 0.45) 100%);
          pointer-events: none;
        }
        .content {
          position: absolute;
          inset: 0;
          padding: 56px 72px 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 32px;
        }
        .brand {
          text-shadow: 0 4px 24px rgba(0, 0, 0, 0.85);
        }
        .brand h1 {
          font-family: "Bebas Neue", sans-serif;
          font-size: 118px;
          line-height: 0.92;
          letter-spacing: 0.04em;
          color: #fff;
        }
        .brand h1 span {
          display: block;
          font-size: 0.62em;
          letter-spacing: 0.28em;
          color: #ffb24a;
          margin-top: 4px;
        }
        .soon {
          flex-shrink: 0;
          background: linear-gradient(135deg, #ff6b2c 0%, #c73e1d 100%);
          color: #fff;
          font-family: "Bebas Neue", sans-serif;
          font-size: 42px;
          letter-spacing: 0.35em;
          padding: 18px 28px 14px;
          border: 3px solid rgba(255, 255, 255, 0.35);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          text-align: center;
        }
        .mid {
          max-width: 920px;
          text-shadow: 0 2px 16px rgba(0, 0, 0, 0.9);
        }
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 22px;
        }
        .tag {
          background: rgba(0, 0, 0, 0.55);
          border: 1px solid rgba(255, 178, 74, 0.45);
          padding: 10px 20px;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .tag.accent {
          background: rgba(255, 107, 44, 0.25);
          border-color: #ff8c4a;
        }
        .pitch {
          font-size: 32px;
          font-weight: 600;
          line-height: 1.35;
          max-width: 780px;
          opacity: 0.95;
        }
        .bottom {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 40px;
          flex-wrap: wrap;
        }
        .features {
          font-size: 26px;
          font-weight: 600;
          line-height: 1.5;
          max-width: 1050px;
          color: #e8e4de;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.95);
        }
        .features strong {
          color: #ffb24a;
          font-weight: 700;
        }
        .discord {
          background: rgba(88, 101, 242, 0.92);
          color: #fff;
          padding: 22px 32px;
          border-radius: 6px;
          font-size: 30px;
          font-weight: 700;
          letter-spacing: 0.04em;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.45);
          text-decoration: none;
          display: inline-block;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }
        .discord:hover {
          filter: brightness(1.08);
        }
        .discord small {
          display: block;
          font-size: 22px;
          font-weight: 500;
          opacity: 0.92;
          margin-top: 6px;
          letter-spacing: 0.02em;
        }
        .footnote {
          font-size: 20px;
          opacity: 0.75;
          margin-top: 12px;
          width: 100%;
          text-align: center;
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.9);
        }
      `}</style>

      <div className="bg" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <div className="content">
        <div className="top">
          <div className="brand">
            <h1>
              WEEKEND WARRIORS
              <span>BATTLEFIELD</span>
            </h1>
          </div>
          <div className="soon">COMING SOON</div>
        </div>

        <div className="mid">
          <div className="tags">
            <span className="tag accent">US HOSTED</span>
            <span className="tag">10x</span>
            <span className="tag">24/7 PVP</span>
            <span className="tag accent">CUSTOM + PREMIUM PLUGINS</span>
          </div>

          <p className="pitch">
            High-octane Rust with stacked loot, clans, kits, warps, skills,
            events, and QoL—built for players who want the fight, not the
            grind.
          </p>
        </div>

        <div className="bottom">
          <div className="features">
            <strong>Highlights:</strong> Kits · Clans · Backpacks · Better Loot ·
            Skills · Warps &amp; TP · Warrior Coins · Plane Crash &amp; MLRS
            events · Trade · Skins &amp; stacks — full plugin list in Discord.
          </div>

          <a
            className="discord"
            href="https://discord.gg/CAjPNVp7Rh"
            target="_blank"
            rel="noopener noreferrer"
          >
            JOIN DISCORD
            <small>discord.gg/CAjPNVp7Rh</small>
          </a>
        </div>

        <p className="footnote">Unofficial community server · Not affiliated with Facepunch Studios</p>
      </div>
    </div>
  );
}
