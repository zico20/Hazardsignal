import DesktopSatelliteOrbits from "./DesktopSatelliteOrbits";

// All methodology copy lives here so the page can flip languages without
// poking at the global i18n bundle. EN is canonical; TR is hand-localized.
const COPY = {
  en: {
    eyebrow: "METHODOLOGY",
    title: "How we score wildfire risk.",
    lede: "HazardSignal combines multi-source satellite imagery, near-realtime weather, and a trained classifier to surface elevated fire risk in Antalya — before ignition.",

    pipelineHead: "Pipeline",
    pipelineLead: "Each daily run ingests Sentinel-2 surface reflectance, ERA5 climate reanalysis, MCD64A1 burned-area labels, and live FIRMS hotspot detections, then derives a 7-day feature window per district.",
    pipeSteps: [
      { n: "01", title: "Ingest",   body: "Sentinel-2 · ERA5 · MCD64A1 · FIRMS" },
      { n: "02", title: "Features", body: "NDVI, NDMI, LST, wind, humidity, slope" },
      { n: "03", title: "Classify", body: "Random Forest · Gradient Tree Boost" },
      { n: "04", title: "Surface",  body: "Probability raster + district summary" }
    ],

    sourcesHead: "Data sources",
    sourcesLead: "The system blends four open-data feeds. Each one fills a specific gap in the picture; click any card for details.",
    sourcesItems: [
      { name: "Sentinel-2", owner: "ESA · Copernicus",   role: "Surface reflectance",     resolution: "10–60 m",       latency: "5 days",          body: "Multispectral satellite imagery — provides the visible/near-infrared bands we use to derive vegetation indices like NDVI and NDMI. Two satellites give a revisit time of ~5 days at the equator, often less in mid-latitudes." },
      { name: "ERA5",       owner: "ECMWF · Copernicus", role: "Climate reanalysis",      resolution: "31 km grid",    latency: "5 days",          body: "Hourly climate reanalysis covering the entire planet from 1940 onward. We pull air temperature, dewpoint, wind speed/direction, and surface humidity for the 7-day window before each run — these are the strongest weather predictors for ignition risk." },
      { name: "MCD64A1",    owner: "NASA · MODIS",       role: "Burned-area labels",      resolution: "500 m monthly", latency: "30–45 days",      body: "Monthly burned-area product derived from MODIS observations. Acts as the historical ground-truth for training the classifier — every grid cell is labeled burned/unburned, letting the model learn what the pre-fire feature signature looks like." },
      { name: "FIRMS",      owner: "NASA · LANCE",       role: "Active fire detections", resolution: "375 m / 1 km",  latency: "Near real-time", body: "Near-real-time fire detection from VIIRS and MODIS. Used purely for situational awareness — overlaid on the live map and counted per district to flag confirmed activity. Detections within the last 24h escalate a district to Critical." }
    ],

    modelHead: "Model",
    modelLead: (acc, hasScores) => (
      <>The active classifier is <strong className="dv3-accent-text">Random Forest</strong>, selected from a comparison against Gradient Tree Boost on a 5-fold cross-validation.{hasScores ? <>{" "}Current production scores: F1 {fmt(acc.f1)}, precision {fmt(acc.precision)}, recall {fmt(acc.recall)}, balanced accuracy {fmt(acc.bal_acc)}.</> : null}</>
    ),
    metricLabels: { f1: "F1 SCORE", precision: "PRECISION", recall: "RECALL", balAcc: "BAL. ACC." },

    glossaryHead: "Feature glossary",
    glossaryLead: "Every district is summarized as a vector of these features before it reaches the classifier. Each one captures a different facet of fire risk.",
    glossaryItems: [
      { term: "NDVI",     full: "Normalized Difference Vegetation Index",   why: "Green vs. dry vegetation. Values <0.3 typically mean stressed/dry fuel — high risk." },
      { term: "NDMI",     full: "Normalized Difference Moisture Index",     why: "Vegetation water content. Drops sharply during heatwaves, the strongest pre-fire indicator." },
      { term: "LST",      full: "Land Surface Temperature",                 why: "Daytime/nighttime surface heat. Sustained high LST + low NDMI is a danger signal." },
      { term: "Wind",     full: "Surface wind speed & direction",           why: "Fires spread along the wind axis. We use the 7-day max gust + dominant direction." },
      { term: "Humidity", full: "Relative humidity",                        why: "Air dryness. <30% relative humidity sharply elevates ignition probability." },
      { term: "Slope",    full: "Terrain slope angle",                      why: "Steeper slopes spread fire faster (uphill rates ~2x flat). Static feature from DEM." },
      { term: "Aspect",   full: "Terrain compass direction",                why: "South-facing slopes get more sun → drier fuel. Captured as a sin/cos pair." },
      { term: "DSI",      full: "Drought Severity Index (derived)",         why: "Composite of multi-day soil moisture deficits. Long-term drought signal." }
    ],

    thresholdsHead: "Thresholds",
    thresholdsLead: (watchMin, warningMin, areaMin) => (
      <>Districts move into{" "}<strong className="dv3-tier-watch">Watch</strong> when probability ≥ {watchMin}, into{" "}<strong className="dv3-tier-warning">Warning</strong> when probability ≥ {warningMin} or high-risk area ≥ {areaMin}%, and into{" "}<strong className="dv3-tier-critical">Critical</strong> with any active hotspot in the last 24h.</>
    ),

    limitationsHead: "Limitations",
    limitationsLead: "HazardSignal surfaces signals; it does not replace ground assessment. Coverage is limited to the Antalya region and inference cadence is daily at 08:00 local time. Cloud cover, sensor outages, or label drift can degrade quality — see the run status badge in the topbar.",

    faqHead: "FAQ",
    faqItems: (warningPct) => [
      {
        q: "Does HazardSignal predict where a fire will start?",
        a: "No. It predicts elevated risk per district — the conditions under which fires historically have started. A high-probability district means the surface is primed, not that ignition is imminent. Real-world ignition still depends on a triggering event (lightning, human activity)."
      },
      {
        q: "What does a probability of 0.5 actually mean?",
        a: `It's the model's calibrated confidence that the district matches its learned 'pre-fire' feature signature for the next 24h window. Above the active threshold (currently ${warningPct}% for Warning), the district is flagged operationally.`
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
    ],
    sourcesLine: "Sources: NASA FIRMS · Copernicus Sentinel-2 · ECMWF ERA5 · NASA MCD64A1 · OpenStreetMap."
  },

  tr: {
    eyebrow: "METODOLOJİ",
    title: "Yangın riskini nasıl puanlıyoruz.",
    lede: "HazardSignal; çok kaynaklı uydu görüntüleri, gerçek zamana yakın hava verileri ve eğitilmiş bir sınıflandırıcıyı birleştirerek Antalya'da yangın riskini ateşlenmeden önce yüzeye çıkarır.",

    pipelineHead: "Boru hattı",
    pipelineLead: "Her günlük çalışma; Sentinel-2 yüzey yansıması, ERA5 iklim yeniden analizi, MCD64A1 yanmış alan etiketleri ve canlı FIRMS sıcak nokta tespitlerini alır ve her ilçe için 7 günlük bir öznitelik penceresi türetir.",
    pipeSteps: [
      { n: "01", title: "Veri Alımı",     body: "Sentinel-2 · ERA5 · MCD64A1 · FIRMS" },
      { n: "02", title: "Öznitelikler",   body: "NDVI, NDMI, LST, rüzgâr, nem, eğim" },
      { n: "03", title: "Sınıflandırma",  body: "Random Forest · Gradient Tree Boost" },
      { n: "04", title: "Yüzey",          body: "Olasılık rasterı + ilçe özeti" }
    ],

    sourcesHead: "Veri kaynakları",
    sourcesLead: "Sistem dört açık veri akışını harmanlar. Her biri resmin belirli bir boşluğunu doldurur; ayrıntılar için herhangi bir kartı tıklayın.",
    sourcesItems: [
      { name: "Sentinel-2", owner: "ESA · Copernicus",   role: "Yüzey yansıması",         resolution: "10–60 m",         latency: "5 gün",                 body: "Çok bantlı uydu görüntüleri — NDVI ve NDMI gibi bitki örtüsü endekslerini türetmek için kullandığımız görünür/yakın kızılötesi bantları sağlar. İki uydu, ekvatorda yaklaşık 5 günlük bir tekrar süresi sunar; orta enlemlerde genellikle daha kısa." },
      { name: "ERA5",       owner: "ECMWF · Copernicus", role: "İklim yeniden analizi",   resolution: "31 km ağ",        latency: "5 gün",                 body: "1940'tan günümüze tüm gezegeni kapsayan saatlik iklim yeniden analizi. Her çalışmadan önceki 7 günlük pencere için hava sıcaklığı, çiy noktası, rüzgâr hızı/yönü ve yüzey nemini çekiyoruz — bunlar ateşlenme riskinin en güçlü hava tahmin edicileridir." },
      { name: "MCD64A1",    owner: "NASA · MODIS",       role: "Yanmış alan etiketleri",  resolution: "500 m / aylık",   latency: "30–45 gün",             body: "MODIS gözlemlerinden türetilen aylık yanmış alan ürünü. Sınıflandırıcıyı eğitmek için tarihsel referans olarak işlev görür — her ızgara hücresi yanmış/yanmamış olarak etiketlenir, modelin yangın öncesi öznitelik imzasının nasıl göründüğünü öğrenmesini sağlar." },
      { name: "FIRMS",      owner: "NASA · LANCE",       role: "Aktif yangın tespitleri", resolution: "375 m / 1 km",    latency: "Gerçek zamana yakın",   body: "VIIRS ve MODIS'ten gerçek zamana yakın yangın tespiti. Yalnızca durumsal farkındalık için kullanılır — canlı haritada gösterilir ve doğrulanmış aktiviteyi işaretlemek için ilçe başına sayılır. Son 24 saatteki tespitler bir ilçeyi Kritik seviyeye yükseltir." }
    ],

    modelHead: "Model",
    modelLead: (acc, hasScores) => (
      <>Aktif sınıflandırıcı <strong className="dv3-accent-text">Random Forest</strong>, 5 katlı çapraz doğrulamada Gradient Tree Boost ile karşılaştırma sonucunda seçilmiştir.{hasScores ? <>{" "}Mevcut üretim skorları: F1 {fmt(acc.f1)}, hassasiyet {fmt(acc.precision)}, duyarlılık {fmt(acc.recall)}, dengeli doğruluk {fmt(acc.bal_acc)}.</> : null}</>
    ),
    metricLabels: { f1: "F1 SKORU", precision: "HASSASİYET", recall: "DUYARLILIK", balAcc: "DENGE. DOĞ." },

    glossaryHead: "Öznitelik sözlüğü",
    glossaryLead: "Her ilçe, sınıflandırıcıya ulaşmadan önce bu özniteliklerin bir vektörü olarak özetlenir. Her biri yangın riskinin farklı bir yönünü yakalar.",
    glossaryItems: [
      { term: "NDVI",     full: "Normalleştirilmiş Bitki Örtüsü Endeksi",  why: "Yeşil ve kuru bitki örtüsü. <0.3 değerleri genellikle stresli/kuru yakıt anlamına gelir — yüksek risk." },
      { term: "NDMI",     full: "Normalleştirilmiş Nem Endeksi",          why: "Bitki örtüsü su içeriği. Sıcak hava dalgalarında keskin biçimde düşer, yangın öncesi en güçlü göstergedir." },
      { term: "LST",      full: "Kara Yüzeyi Sıcaklığı",                  why: "Gündüz/gece yüzey ısısı. Sürekli yüksek LST + düşük NDMI bir tehlike sinyalidir." },
      { term: "Rüzgâr",   full: "Yüzey rüzgâr hızı ve yönü",              why: "Yangınlar rüzgâr ekseni boyunca yayılır. 7 günlük maksimum rüzgâr + baskın yönü kullanırız." },
      { term: "Nem",      full: "Bağıl nem",                              why: "Hava kuruluğu. <%30 bağıl nem ateşlenme olasılığını ciddi ölçüde artırır." },
      { term: "Eğim",     full: "Arazi eğim açısı",                       why: "Daha dik eğimler yangını daha hızlı yayar (yokuş yukarı oran ~2x düz arazi). DEM'den statik öznitelik." },
      { term: "Yön",      full: "Arazi pusula yönü",                      why: "Güneye bakan yamaçlar daha fazla güneş alır → daha kuru yakıt. sin/cos çifti olarak yakalanır." },
      { term: "DSI",      full: "Kuraklık Şiddet Endeksi (türetilmiş)",   why: "Çok günlü toprak nemi açıklarının bileşimi. Uzun vadeli kuraklık sinyali." }
    ],

    thresholdsHead: "Eşikler",
    thresholdsLead: (watchMin, warningMin, areaMin) => (
      <>İlçeler, olasılık ≥ {watchMin} olduğunda{" "}<strong className="dv3-tier-watch">Gözlem</strong>, olasılık ≥ {warningMin} veya yüksek riskli alan ≥ {areaMin}% olduğunda{" "}<strong className="dv3-tier-warning">Uyarı</strong>, son 24 saatte aktif sıcak nokta varsa{" "}<strong className="dv3-tier-critical">Kritik</strong> seviyesine geçer.</>
    ),

    limitationsHead: "Sınırlamalar",
    limitationsLead: "HazardSignal sinyalleri yüzeye çıkarır; saha değerlendirmesinin yerine geçmez. Kapsam Antalya bölgesi ile sınırlıdır ve çıkarım sıklığı yerel saatle her gün 08:00'dir. Bulut örtüsü, sensör arızaları veya etiket sapması kaliteyi düşürebilir — üst çubuktaki çalışma durumu rozetini kontrol edin.",

    faqHead: "SSS",
    faqItems: (warningPct) => [
      {
        q: "HazardSignal yangının nerede başlayacağını tahmin eder mi?",
        a: "Hayır. İlçe bazında yükselmiş riski tahmin eder — yangınların tarihsel olarak başladığı koşulları. Yüksek olasılıklı bir ilçe, yüzeyin hazır olduğu anlamına gelir, ateşlenmenin yakın olduğu anlamına gelmez. Gerçek dünya ateşlenmesi yine de bir tetikleyici olaya (yıldırım, insan faaliyeti) bağlıdır."
      },
      {
        q: "0.5 olasılığı gerçekte ne anlama geliyor?",
        a: `İlçenin sonraki 24 saatlik pencerede öğrenilmiş 'yangın öncesi' öznitelik imzasıyla eşleştiğine dair modelin kalibre edilmiş güvenidir. Aktif eşiğin üzerinde (şu anda Uyarı için %${warningPct}), ilçe operasyonel olarak işaretlenir.`
      },
      {
        q: "Veriler ne kadar güncel?",
        a: "Boru hattı her gün 08:00 Avrupa/İstanbul saatinde çalışır. Sentinel-2 ve ERA5 ~5 günlük gecikmeye sahiptir, bu nedenle puanladığımız pencere tam gözlemlerin bulunduğu en son haftadır. FIRMS sıcak nokta verileri gerçek zamana yakındır (tespitten sonra ~3 saat içinde)."
      },
      {
        q: "Bir uydu çalışmazsa ne olur?",
        a: "Çalışma, durum rozetinde işaretlenen eksik kaynakla tamamlanır. NDVI/NDMI boşlukları 14 günlük pencerede en son bulutsuz pikselden doldurulur. Kalıcı boşluklar güveni düşürür — etkilenen ilçeler düşük kalite işaretiyle gösterilir."
      },
      {
        q: "Tek bir ilçe için uyarılara abone olabilir miyim?",
        a: "Evet — yöneticiler Telegram abonelerini ilçe kapsamlarıyla yapılandırır (tek kimlik veya 'tümü'). Bir ilçe yapılandırılmış Gözlem/Uyarı/Kritik eşiklerini geçtiğinde uyarılar tetiklenir; aboneler tetikleme nedeni ile birlikte biçimlendirilmiş bir mesaj alır."
      },
      {
        q: "F1 yüksek olduğunda bile hassasiyet neden bazen düşük?",
        a: "F1, hassasiyet ve duyarlılığın harmonik ortalamasıdır. Veri kümesi dengesiz olduğunda (her çalışmada çok az yanmış hücre), model duyarlılığı (her yangını yakalama) hassasiyetin (yanlış alarmlardan kaçınma) önüne koyar. Eşik ayarlama bunları takas eder — yönetimde eşik panelini görün."
      }
    ],
    sourcesLine: "Kaynaklar: NASA FIRMS · Copernicus Sentinel-2 · ECMWF ERA5 · NASA MCD64A1 · OpenStreetMap."
  }
};

function fmt(v) {
  return v != null ? Number(v).toFixed(2) : "—";
}

export default function DesktopMethodV3({ locale = "en", latestRun, rules }) {
  const c = COPY[locale] || COPY.en;

  const accuracy = latestRun ? {
    f1: latestRun.fire_f1,
    precision: latestRun.fire_precision,
    recall: latestRun.fire_recall,
    bal_acc: latestRun.balanced_accuracy
  } : null;
  const hasScores = accuracy && (accuracy.f1 != null || accuracy.precision != null);

  const watchMin = rules?.probability_watch_min ?? 0.4;
  const warningMin = rules?.probability_warning_min ?? 0.7;
  const areaMin = rules?.high_or_very_high_area_pct_min ?? 5;
  const warningPct = Math.round(warningMin * 100);

  return (
    <div className="dv3-method-layout dv3-page-pad">
      <div className="dv3-method-content">
        <div className="dv3-method-eyebrow">{c.eyebrow}</div>
        <h1 className="dv3-method-h1">{c.title}</h1>
        <p className="dv3-method-lede">{c.lede}</p>

        <section className="dv3-method-section">
          <h2 className="dv3-method-h2">{c.pipelineHead}</h2>
          <p>{c.pipelineLead}</p>
          <div className="dv3-pipeline">
            {c.pipeSteps.map((s) => (
              <article key={s.n} className="dv3-pipe-step">
                <div className="dv3-step-num">{s.n}</div>
                <h4>{s.title}</h4>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="dv3-method-section">
          <h2 className="dv3-method-h2">{c.sourcesHead}</h2>
          <p>{c.sourcesLead}</p>
          <div className="dv3-sources-list">
            {c.sourcesItems.map((s) => (
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
          <h2 className="dv3-method-h2">{c.modelHead}</h2>
          <p>{c.modelLead(accuracy || {}, hasScores)}</p>
          {accuracy && (
            <div className="dv3-method-metrics">
              {[
                { l: c.metricLabels.f1,        v: accuracy.f1 },
                { l: c.metricLabels.precision, v: accuracy.precision },
                { l: c.metricLabels.recall,    v: accuracy.recall },
                { l: c.metricLabels.balAcc,    v: accuracy.bal_acc }
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
          <h2 className="dv3-method-h2">{c.glossaryHead}</h2>
          <p>{c.glossaryLead}</p>
          <div className="dv3-glossary">
            {c.glossaryItems.map((f) => (
              <div key={f.term} className="dv3-gloss-card">
                <div className="dv3-gloss-term">{f.term}</div>
                <div className="dv3-gloss-full">{f.full}</div>
                <p className="dv3-gloss-why">{f.why}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="dv3-method-section">
          <h2 className="dv3-method-h2">{c.thresholdsHead}</h2>
          <p>{c.thresholdsLead(watchMin, warningMin, areaMin)}</p>
        </section>

        <section className="dv3-method-section">
          <h2 className="dv3-method-h2">{c.limitationsHead}</h2>
          <p>{c.limitationsLead}</p>
        </section>

        <section className="dv3-method-section">
          <h2 className="dv3-method-h2">{c.faqHead}</h2>
          <div className="dv3-faq">
            {c.faqItems(warningPct).map((item, i) => (
              <details key={i} className="dv3-faq-item">
                <summary>
                  <span>{item.q}</span>
                  <span className="dv3-source-chev" aria-hidden="true">+</span>
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <p className="dv3-method-sources">{c.sourcesLine}</p>
        </section>
      </div>

      <aside className="dv3-method-aside">
        <DesktopSatelliteOrbits />
      </aside>
    </div>
  );
}
