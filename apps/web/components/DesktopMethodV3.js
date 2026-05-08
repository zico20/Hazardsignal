import DesktopSatelliteOrbits from "./DesktopSatelliteOrbits";

// Server component for the methodology page in V3 desktop shell.
// Renders the design's pipeline + model + thresholds + limitations
// sections with section headings flagged by an orange left-bar accent.
// Threshold copy is built from the live rules object so the page stays
// in sync with what the backend is actually applying.
export default function DesktopMethodV3({ latestRun, rules }) {
  const accuracy = latestRun ? {
    f1: latestRun.fire_f1,
    precision: latestRun.fire_precision,
    recall: latestRun.fire_recall,
    bal_acc: latestRun.balanced_accuracy
  } : null;

  const watchMin = rules?.probability_watch_min ?? 0.4;
  const warningMin = rules?.probability_warning_min ?? 0.7;
  const areaMin = rules?.high_or_very_high_area_pct_min ?? 5;

  return (
    <div className="dv3-method-layout dv3-page-pad">
      <div className="dv3-method-content">
      <div className="dv3-method-eyebrow">METHODOLOGY</div>
      <h1 className="dv3-method-h1">How we score wildfire risk.</h1>
      <p className="dv3-method-lede">
        HazardSignal combines multi-source satellite imagery, near-realtime weather, and a trained classifier to surface elevated fire risk in Antalya — before ignition.
      </p>

      <section className="dv3-method-section">
        <h2 className="dv3-method-h2">Pipeline</h2>
        <p>
          Each daily run ingests Sentinel-2 surface reflectance, ERA5 climate reanalysis, MCD64A1 burned-area labels, and live FIRMS hotspot detections, then derives a 7-day feature window per district.
        </p>
        <div className="dv3-pipeline">
          {[
            { n: "01", title: "Ingest",   body: "Sentinel-2 · ERA5 · MCD64A1 · FIRMS" },
            { n: "02", title: "Features", body: "NDVI, NDMI, LST, wind, humidity, slope" },
            { n: "03", title: "Classify", body: "Random Forest · Gradient Tree Boost" },
            { n: "04", title: "Surface",  body: "Probability raster + district summary" }
          ].map((s) => (
            <article key={s.n} className="dv3-pipe-step">
              <div className="dv3-step-num">{s.n}</div>
              <h4>{s.title}</h4>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dv3-method-section">
        <h2 className="dv3-method-h2">Data sources</h2>
        <p>The system blends four open-data feeds. Each one fills a specific gap in the picture; click any card for details.</p>
        <div className="dv3-sources-list">
          {[
            {
              name: "Sentinel-2",
              owner: "ESA · Copernicus",
              role: "Surface reflectance",
              resolution: "10–60 m",
              latency: "5 days",
              body: "Multispectral satellite imagery — provides the visible/near-infrared bands we use to derive vegetation indices like NDVI and NDMI. Two satellites give a revisit time of ~5 days at the equator, often less in mid-latitudes."
            },
            {
              name: "ERA5",
              owner: "ECMWF · Copernicus",
              role: "Climate reanalysis",
              resolution: "31 km grid",
              latency: "5 days",
              body: "Hourly climate reanalysis covering the entire planet from 1940 onward. We pull air temperature, dewpoint, wind speed/direction, and surface humidity for the 7-day window before each run — these are the strongest weather predictors for ignition risk."
            },
            {
              name: "MCD64A1",
              owner: "NASA · MODIS",
              role: "Burned-area labels",
              resolution: "500 m monthly",
              latency: "30–45 days",
              body: "Monthly burned-area product derived from MODIS observations. Acts as the historical ground-truth for training the classifier — every grid cell is labeled burned/unburned, letting the model learn what the pre-fire feature signature looks like."
            },
            {
              name: "FIRMS",
              owner: "NASA · LANCE",
              role: "Active fire detections",
              resolution: "375 m / 1 km",
              latency: "Near real-time",
              body: "Near-real-time fire detection from VIIRS and MODIS. Used purely for situational awareness — overlaid on the live map and counted per district to flag confirmed activity. Detections within the last 24h escalate a district to Critical."
            }
          ].map((s) => (
            <details key={s.name} className="dv3-source-card">
              <summary>
                <div className="dv3-source-head">
                  <strong>{s.name}</strong>
                  <span className="dv3-source-role">{s.role}</span>
                </div>
                <div className="dv3-source-meta">
                  <span>{s.owner}</span>
                  <span>·</span>
                  <span>{s.resolution}</span>
                  <span>·</span>
                  <span>{s.latency}</span>
                </div>
                <span className="dv3-source-chev" aria-hidden="true">+</span>
              </summary>
              <p className="dv3-source-body">{s.body}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="dv3-method-section">
        <h2 className="dv3-method-h2">Model</h2>
        <p>
          The active classifier is <strong className="dv3-accent-text">Random Forest</strong>, selected from a comparison against Gradient Tree Boost on a 5-fold cross-validation.
          {accuracy && (accuracy.f1 != null || accuracy.precision != null) ? (
            <>
              {" "}Current production scores: F1 {fmt(accuracy.f1)}, precision {fmt(accuracy.precision)}, recall {fmt(accuracy.recall)}, balanced accuracy {fmt(accuracy.bal_acc)}.
            </>
          ) : null}
        </p>
        {accuracy && (
          <div className="dv3-method-metrics">
            {[
              { l: "F1 SCORE", v: accuracy.f1 },
              { l: "PRECISION", v: accuracy.precision },
              { l: "RECALL", v: accuracy.recall },
              { l: "BAL. ACC.", v: accuracy.bal_acc }
            ].map((m) => (
              <div key={m.l} className="dv3-method-metric">
                <div className="dv3-method-metric-label">{m.l}</div>
                <div className="dv3-method-metric-value">{m.v != null ? Number(m.v).toFixed(2) : "—"}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dv3-method-section">
        <h2 className="dv3-method-h2">Feature glossary</h2>
        <p>Every district is summarized as a vector of these features before it reaches the classifier. Each one captures a different facet of fire risk.</p>
        <div className="dv3-glossary">
          {[
            { term: "NDVI",     full: "Normalized Difference Vegetation Index",   why: "Green vs. dry vegetation. Values <0.3 typically mean stressed/dry fuel — high risk." },
            { term: "NDMI",     full: "Normalized Difference Moisture Index",     why: "Vegetation water content. Drops sharply during heatwaves, the strongest pre-fire indicator." },
            { term: "LST",      full: "Land Surface Temperature",                 why: "Daytime/nighttime surface heat. Sustained high LST + low NDMI is a danger signal." },
            { term: "Wind",     full: "Surface wind speed & direction",           why: "Fires spread along the wind axis. We use the 7-day max gust + dominant direction." },
            { term: "Humidity", full: "Relative humidity",                        why: "Air dryness. <30% relative humidity sharply elevates ignition probability." },
            { term: "Slope",    full: "Terrain slope angle",                      why: "Steeper slopes spread fire faster (uphill rates ~2x flat). Static feature from DEM." },
            { term: "Aspect",   full: "Terrain compass direction",                why: "South-facing slopes get more sun → drier fuel. Captured as a sin/cos pair." },
            { term: "DSI",      full: "Drought Severity Index (derived)",         why: "Composite of multi-day soil moisture deficits. Long-term drought signal." }
          ].map((f) => (
            <div key={f.term} className="dv3-gloss-card">
              <div className="dv3-gloss-term">{f.term}</div>
              <div className="dv3-gloss-full">{f.full}</div>
              <p className="dv3-gloss-why">{f.why}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="dv3-method-section">
        <h2 className="dv3-method-h2">Thresholds</h2>
        <p>
          Districts move into{" "}
          <strong className="dv3-tier-watch">Watch</strong> when probability ≥ {watchMin}, into{" "}
          <strong className="dv3-tier-warning">Warning</strong> when probability ≥ {warningMin} or high-risk area ≥ {areaMin}%, and into{" "}
          <strong className="dv3-tier-critical">Critical</strong> with any active hotspot in the last 24h.
        </p>
      </section>

      <section className="dv3-method-section">
        <h2 className="dv3-method-h2">Limitations</h2>
        <p>
          HazardSignal surfaces signals; it does not replace ground assessment. Coverage is limited to the Antalya region and inference cadence is daily at 08:00 local time. Cloud cover, sensor outages, or label drift can degrade quality — see the run status badge in the topbar.
        </p>
      </section>

      <section className="dv3-method-section">
        <h2 className="dv3-method-h2">FAQ</h2>
        <div className="dv3-faq">
          {[
            {
              q: "Does HazardSignal predict where a fire will start?",
              a: "No. It predicts elevated risk per district — the conditions under which fires historically have started. A high-probability district means the surface is primed, not that ignition is imminent. Real-world ignition still depends on a triggering event (lightning, human activity)."
            },
            {
              q: "What does a probability of 0.5 actually mean?",
              a: "It's the model's calibrated confidence that the district matches its learned 'pre-fire' feature signature for the next 24h window. Above the active threshold (currently " + Math.round(((rules?.probability_warning_min ?? 0.7)) * 100) + "% for Warning), the district is flagged operationally."
            },
            {
              q: "How fresh is the data?",
              a: "The pipeline runs daily at 08:00 Europe/Istanbul. Sentinel-2 and ERA5 have ~5-day latency, so the window we score is the most recent week with complete observations. FIRMS hotspot data is near-real-time (within ~3 hours of detection)."
            },
            {
              q: "What happens if a satellite is down?",
              a: "The run completes with the missing source flagged in the status badge. NDVI/NDMI gaps are filled from the latest cloud-free pixel within a 14-day window. Persistent gaps reduce confidence — the affected districts are surfaced with a degraded-quality marker."
            },
            {
              q: "Can I subscribe to alerts for one district?",
              a: "Yes — admins configure Telegram subscribers with district scopes (single ID or 'all'). Alerts fire when a district crosses the configured Watch/Warning/Critical thresholds; subscribers receive a formatted message with the trigger reason."
            },
            {
              q: "Why is precision sometimes low even when F1 is high?",
              a: "F1 is the harmonic mean of precision and recall. When the dataset is imbalanced (very few burned cells per run), the model favors recall (catch every fire) over precision (avoid false alarms). Threshold tuning trades these — see the threshold rail in admin."
            }
          ].map((item, i) => (
            <details key={i} className="dv3-faq-item">
              <summary>
                <span>{item.q}</span>
                <span className="dv3-source-chev" aria-hidden="true">+</span>
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
        <p className="dv3-method-sources">
          Sources: NASA FIRMS · Copernicus Sentinel-2 · ECMWF ERA5 · NASA MCD64A1 · OpenStreetMap.
        </p>
      </section>
      </div>

      <aside className="dv3-method-aside">
        <DesktopSatelliteOrbits />
      </aside>
    </div>
  );
}

function fmt(v) {
  return v != null ? Number(v).toFixed(2) : "—";
}
