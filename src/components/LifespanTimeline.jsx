import { useState, useEffect, useMemo } from 'react';
import { Play, Pause, Sparkles, Info, Calendar, ExternalLink } from 'lucide-react';
import {
  ALL_LIFESPANS,
  ALL_CHRONOLOGY,
  NODES_BY_ID,
} from '../utils/dataStore';
import {
  yearToSerial,
  serialToYear,
  formatYear,
  formatYearShort,
  ageInYear,
  isAliveInYear,
} from '../utils/yearUtils';

const MIN_SERIAL = yearToSerial(-4026); // 4026 B.C.E. (-4025)
const MAX_SERIAL = yearToSerial(33);    // 33 C.E. (+33)

const OVERLAP_SPOTLIGHTS = [
  {
    id: 'adam-methuselah',
    label: 'Adam & Methuselah (243 yrs)',
    year: -3150,
    caption: 'In 3150 B.C.E., Adam (age 876), Methuselah (age 189), and even Noah’s father Lamech (age 2) were alive simultaneously!',
  },
  {
    id: 'shem-abraham',
    label: 'Shem & Abraham (150 yrs)',
    year: -1943,
    caption: 'When Abraham crossed the Euphrates in 1943 B.C.E. at age 75, Flood-survivor Shem was still alive at age 525!',
  },
  {
    id: 'noah-abraham',
    label: 'Noah & Abraham (2 yrs apart)',
    year: -2020,
    caption: 'Noah died in 2020 B.C.E. at age 950 — just 2 short years before Abraham was born in 2018 B.C.E.!',
  },
  {
    id: 'eber-abraham',
    label: 'Eber Outlives Abraham (4 yrs)',
    year: -1843,
    caption: 'When Abraham died at age 175 in 1843 B.C.E., his ancestor Eber (age 460) and grandson Jacob (age 15) were both alive!',
  },
  {
    id: 'shem-isaac',
    label: 'Shem & Isaac (50 yrs)',
    year: -1890,
    caption: 'Shem overlapped with Isaac for 50 full years — passing firsthand pre-Flood accounts down into the patriarchal era.',
  },
  {
    id: 'daniel-69-weeks',
    label: 'Daniel’s 69 Weeks (29 C.E.)',
    year: 29,
    caption: '455 B.C.E. + 483 years (with no zero year!) arrives precisely in 29 C.E., when Jesus is baptized at about age 30.',
  },
];

export default function LifespanTimeline({ onSelectNode }) {
  const [serial, setSerial] = useState(yearToSerial(-3150));
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSpotlight, setActiveSpotlight] = useState(OVERLAP_SPOTLIGHTS[0]);

  const currentYear = serialToYear(serial);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setSerial((prev) => {
        const next = prev + 18;
        if (next >= MAX_SERIAL) {
          setIsPlaying(false);
          return MAX_SERIAL;
        }
        return next;
      });
    }, 90);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const alivePeople = useMemo(() => {
    return ALL_LIFESPANS.filter((p) => isAliveInYear(p.birthYear, p.deathYear, currentYear)).map(
      (p) => {
        const rawAge = ageInYear(p.birthYear, currentYear);
        const displayAge = p.name === 'Jesus' && currentYear === 33 ? '33½' : rawAge;
        return {
          ...p,
          age: displayAge,
          node: NODES_BY_ID[p.nodeId],
        };
      }
    );
  }, [currentYear]);

  const closestEvent = useMemo(() => {
    let best = ALL_CHRONOLOGY[0];
    let bestDist = Infinity;
    for (const ev of ALL_CHRONOLOGY) {
      const dist = Math.abs(yearToSerial(ev.year) - serial);
      if (dist < bestDist) {
        bestDist = dist;
        best = ev;
      }
    }
    return best;
  }, [serial]);

  const totalSpan = MAX_SERIAL - MIN_SERIAL;
  const scrubberPct = ((serial - MIN_SERIAL) / totalSpan) * 100;

  const jumpToYear = (year, spotlight = null) => {
    setIsPlaying(false);
    setSerial(yearToSerial(year));
    setActiveSpotlight(spotlight);
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-kicker">Chronology of the Ages · 4026 B.C.E. to 33 C.E.</p>
          <h1 className="section-title">B.C.E. Lifespan Timeline &amp; Contemporary Overlaps</h1>
          <p className="section-lead">
            Scrub across four millennia to see who lived simultaneously, compute their exact ages in
            any year, and explore the 19 chronological anchors leading to the Messiah.
          </p>
        </div>
      </div>

      {/* Interactive Scrubber Command Panel */}
      <section className="scrubber-panel" aria-label="Interactive Year Scrubber">
        <div className="scrubber-top">
          <div className="scrubber-year-display">
            <span className="scrubber-big-year">{formatYear(currentYear)}</span>
            <span className="scrubber-alive-badge">
              {alivePeople.length} Dated {alivePeople.length === 1 ? 'Figure' : 'Figures'} Alive
            </span>
          </div>

          <div className="scrubber-controls">
            <span className="no-zero-note">
              <Info size={14} />
              <span>Note: There is NO zero year between 1 B.C.E. and 1 C.E.</span>
            </span>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => setIsPlaying((p) => !p)}
              aria-label={isPlaying ? 'Pause timeline animation' : 'Play timeline animation'}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              <span>{isPlaying ? 'Pause' : 'Play Ages'}</span>
            </button>
          </div>
        </div>

        <input
          type="range"
          id="year-scrubber"
          className="scrubber-range"
          min={MIN_SERIAL}
          max={MAX_SERIAL}
          step={1}
          value={serial}
          onChange={(e) => {
            setIsPlaying(false);
            setActiveSpotlight(null);
            setSerial(Number(e.target.value));
          }}
          aria-label="Scrub historical year from 4026 B.C.E. to 33 C.E."
        />
        <div className="scrubber-ticks">
          <span>4026 B.C.E. (Creation)</span>
          <span>2370 B.C.E. (Flood)</span>
          <span>1943 B.C.E. (Abraham)</span>
          <span>1513 B.C.E. (Exodus)</span>
          <span>607 B.C.E. (Exile)</span>
          <span>29 C.E. (Baptism)</span>
        </div>

        {/* Quick-Jump Overlap Spotlights */}
        <div className="spotlights-strip">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#DFC58B',
              marginRight: 4,
            }}
          >
            <Sparkles size={13} />
            Overlap Spotlights:
          </span>
          {OVERLAP_SPOTLIGHTS.map((sp) => (
            <button
              key={sp.id}
              type="button"
              className="spotlight-btn"
              onClick={() => jumpToYear(sp.year, sp)}
            >
              {sp.label}
            </button>
          ))}
        </div>

        {activeSpotlight && (
          <div
            style={{
              marginTop: '0.85rem',
              padding: '0.72rem 0.95rem',
              borderRadius: '8px',
              background: 'rgba(248, 244, 235, 0.1)',
              border: '1px solid rgba(244, 219, 159, 0.35)',
              fontFamily: 'var(--font-editorial)',
              fontSize: '1.08rem',
              color: '#FFF9EC',
            }}
          >
            {activeSpotlight.caption}
          </div>
        )}
      </section>

      <div className="timeline-grid">
        {/* Left: Live Alive Panel + Gantt Lifespan Bars */}
        <div>
          <section className="alive-cards-box">
            <h2 className="subblock-heading" style={{ marginBottom: '0.35rem' }}>
              <Calendar size={17} color="var(--crimson)" />
              <span>Alive in {formatYear(currentYear)}</span>
            </h2>
            {alivePeople.length === 0 ? (
              <p style={{ margin: '0.5rem 0 0', color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>
                No dated Genesis patriarchs or Moses/Jesus overlap this specific year (between
                Moses’ death in 1473 B.C.E. and Jesus’ birth in 2 B.C.E., explore the Kingdom &amp;
                Exile chronology cards on the right!).
              </p>
            ) : (
              <div className="alive-chips-grid">
                {alivePeople.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="alive-person-chip"
                    onClick={() => p.node && onSelectNode(p.node)}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--slate-teal)', fontSize: '0.9rem' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.79rem', fontWeight: 700, color: 'var(--crimson)' }}>
                      Age {p.age} <span style={{ fontWeight: 400, color: 'var(--ink-muted)' }}>/ {p.lifespan} yrs</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                      {formatYearShort(p.birthYear)} – {formatYearShort(p.deathYear)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="lifespan-chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h2 className="subblock-heading" style={{ margin: 0 }}>
                <span>27 Dated Lifespans (Click Any Row for Insight Profile)</span>
              </h2>
              <span style={{ fontSize: '0.77rem', color: 'var(--ink-muted)', fontWeight: 600 }}>
                Gold Line = {formatYear(currentYear)}
              </span>
            </div>

            <div className="lifespan-bars-list">
              {ALL_LIFESPANS.map((p) => {
                const startPct = ((yearToSerial(p.birthYear) - MIN_SERIAL) / totalSpan) * 100;
                const endPct = ((yearToSerial(p.deathYear) - MIN_SERIAL) / totalSpan) * 100;
                const widthPct = Math.max(0.9, endPct - startPct);
                const alive = isAliveInYear(p.birthYear, p.deathYear, currentYear);
                const rawAge = alive ? ageInYear(p.birthYear, currentYear) : null;
                const age = alive && p.name === 'Jesus' && currentYear === 33 ? '33½' : rawAge;
                const node = NODES_BY_ID[p.nodeId];

                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`lifespan-row ${alive ? 'alive' : ''}`}
                    onClick={() => node && onSelectNode(node)}
                    title={`${p.name}: ${formatYear(p.birthYear)} – ${formatYear(p.deathYear)} (${p.lifespan} yrs)`}
                  >
                    <span className="lifespan-name">{p.name}</span>
                    <span className="lifespan-track">
                      <span
                        className="lifespan-bar"
                        style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                      />
                      <span
                        className="scrubber-marker-line"
                        style={{ left: `${scrubberPct}%` }}
                      />
                    </span>
                    <span className="lifespan-age-col">
                      {alive ? `Age ${age}` : `${p.lifespan} yrs`}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right: 19 Key Historical Chronology Events */}
        <aside className="lifespan-chart-card">
          <h2 className="subblock-heading">
            <Calendar size={17} color="var(--gold-deep)" />
            <span>19 Key Chronology Events</span>
          </h2>
          <p style={{ margin: '-0.5rem 0 0.9rem', fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
            Click any milestone to scrub the timeline directly to that year.
          </p>
          <div className="chronology-list">
            {ALL_CHRONOLOGY.map((ev) => {
              const isClosest = closestEvent?.id === ev.id;
              const primaryNode = ev.linkedNodeIds?.[0] ? NODES_BY_ID[ev.linkedNodeIds[0]] : null;
              return (
                <div
                  key={ev.id}
                  className={`chrono-card ${isClosest ? 'active' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => jumpToYear(ev.year, null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      jumpToYear(ev.year, null);
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span className="chrono-year">{ev.yearLabel}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {primaryNode && (
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: '0.18rem 0.5rem', fontSize: '0.72rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectNode(primaryNode);
                          }}
                        >
                          Profile
                        </button>
                      )}
                      <a
                        href={ev.jwUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{ padding: '0.18rem 0.5rem', fontSize: '0.72rem' }}
                        onClick={(e) => e.stopPropagation()}
                        title="Open in JW Library / jw.org"
                      >
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                  <span className="chrono-title">{ev.title}</span>
                  <span className="chrono-desc">{ev.description}</span>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
