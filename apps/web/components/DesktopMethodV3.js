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
    <div className="dv3-method-page dv3-page-pad">
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
        <p className="dv3-method-sources">
          Sources: NASA FIRMS · Copernicus Sentinel-2 · ECMWF ERA5 · NASA MCD64A1 · OpenStreetMap.
        </p>
      </section>
    </div>
  );
}

function fmt(v) {
  return v != null ? Number(v).toFixed(2) : "—";
}
