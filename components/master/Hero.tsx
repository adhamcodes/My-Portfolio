export default function Hero() {
  return (
    <section
      id="origin"
      data-chapter="origin"
      className="master-scene master-origin hero-v3"
      aria-labelledby="origin-title"
    >
      <div className="hero-v3-field" aria-hidden="true">
        <span className="hero-v3-field-line hero-v3-field-line-a" />
        <span className="hero-v3-field-line hero-v3-field-line-b" />
        <span className="hero-v3-field-mark" />
      </div>

      <div className="hero-v3-name-wrap">
        <h1 id="origin-title" className="hero-v3-name" aria-label="Adham Mahmood">
          <span className="hero-v3-first">ADHAM</span>
          <span className="hero-v3-last" aria-hidden="true">
            <span>MAH</span>
            <span className="hero-v3-name-breach" />
            <span>MOOD</span>
          </span>
        </h1>
      </div>

      <div className="hero-v3-caption">
        <span className="hero-v3-caption-rule" aria-hidden="true" />
        <p>
          Rebuilding from software foundations. Learning, work, and history change this place only when they become real.
        </p>
      </div>

      <div className="hero-v3-scroll" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
