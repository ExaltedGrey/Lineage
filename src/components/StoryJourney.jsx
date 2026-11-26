import { useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Scroll,
  Sparkles,
  Users,
  Compass,
} from 'lucide-react';
import {
  ALL_STORIES,
  NODES_BY_ID,
  PROPHECIES_BY_ID,
  BRANCH_LABELS,
} from '../utils/dataStore';
import { formatDateRange } from '../utils/yearUtils';

export default function StoryJourney({
  completedEras,
  onCompleteEra,
  onSelectNode,
  onOpenExplorerFocus,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const story = ALL_STORIES[activeIndex];
  const prophecies = story.prophecyIds.map((id) => PROPHECIES_BY_ID[id]).filter(Boolean);
  const stones = story.steppingStoneNodeIds.map((id) => NODES_BY_ID[id]).filter(Boolean);
  const picked = selectedAnswers[story.id];
  const isAnswered = picked !== undefined;
  const isCorrect = picked === story.checkIn.correctIndex;

  const handleAnswer = (optIdx) => {
    setSelectedAnswers((prev) => ({ ...prev, [story.id]: optIdx }));
    if (optIdx === story.checkIn.correctIndex) {
      onCompleteEra(story.id);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-kicker">Guided Biblical Narrative · Seven Eras</p>
          <h1 className="section-title">Story Journey: From Eden to the Promised Offspring</h1>
          <p className="section-lead">
            Trace how Jehovah narrowed the Genesis 3:15 promise across four millennia—from Adam to
            Noah, Abraham, Judah, King David, Zerubbabel, and finally Jesus of Nazareth.
          </p>
        </div>
        <button type="button" className="btn btn-crimson" onClick={onOpenExplorerFocus}>
          <Compass size={16} />
          <span>Explore Full Messianic Line</span>
        </button>
      </div>

      <div className="story-layout">
        {/* Chapter Rail */}
        <aside className="era-rail" aria-label="Story chapters">
          <div className="era-rail-header">
            <h2 className="era-rail-title">Seven Guided Eras</h2>
            <span className="era-progress-count">{completedEras.length}/7 Cleared</span>
          </div>
          <div className="era-list">
            {ALL_STORIES.map((era, idx) => {
              const done = completedEras.includes(era.id);
              const isActive = idx === activeIndex;
              return (
                <button
                  key={era.id}
                  type="button"
                  className={`era-step-btn ${isActive ? 'active' : ''} ${done ? 'completed' : ''}`}
                  onClick={() => setActiveIndex(idx)}
                >
                  <span className="era-step-num">
                    {done ? <CheckCircle2 size={15} /> : era.chapter}
                  </span>
                  <span>
                    <span className="era-step-name">{era.title}</span>
                    <span className="era-step-years">{era.years}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Active Chapter Stage */}
        <article className="story-stage">
          <div className="story-hero-card">
            <div className="story-meta-row">
              <span className="story-chapter-tag">
                Chapter {story.chapter} of {ALL_STORIES.length}
              </span>
              <span className="story-year-tag">{story.years}</span>
            </div>
            <h2 className="story-title">{story.title}</h2>
            <p className="story-subtitle">{story.subtitle}</p>
            <div className="story-narrative">
              {story.narrative.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* Prophecies & Covenants in this Era */}
          {prophecies.length > 0 && (
            <section className="story-subblock">
              <h3 className="subblock-heading">
                <Scroll size={18} color="var(--gold-deep)" />
                <span>Prophecy &amp; Covenant Milestones ({prophecies.length})</span>
              </h3>
              <div className="prophecy-grid">
                {prophecies.map((p) => {
                  const pNode = NODES_BY_ID[p.nodeId];
                  return (
                    <div key={p.id} className="prophecy-card">
                      <div className="prophecy-card-top">
                        <span className="prophecy-ref">{p.reference}</span>
                        <span className="prophecy-date">{p.date}</span>
                      </div>
                      <h4 className="prophecy-title">{p.title}</h4>
                      <p className="prophecy-desc">{p.summary}</p>
                      <div className="prophecy-actions">
                        <a
                          href={p.jwUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-crimson"
                          style={{ padding: '0.38rem 0.72rem', fontSize: '0.79rem' }}
                        >
                          <ExternalLink size={13} />
                          <span>Read in JW Library</span>
                        </a>
                        {pNode && (
                          <button
                            type="button"
                            className="btn"
                            style={{ padding: '0.38rem 0.72rem', fontSize: '0.79rem' }}
                            onClick={() => onSelectNode(pNode)}
                          >
                            <span>Inspect Details</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Interactive Lineage Stepping Stones */}
          <section className="story-subblock">
            <h3 className="subblock-heading">
              <Users size={18} color="var(--crimson)" />
              <span>Lineage Stepping-Stones — Click Any Figure to Open Insight Profile</span>
            </h3>
            <div className="stepping-stones-grid">
              {stones.map((node) => {
                const dateText = formatDateRange(node.birthYear, node.deathYear, node.lifespan);
                const branch = BRANCH_LABELS[node.branch];
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={`stone-card branch-${node.branch}`}
                    onClick={() => onSelectNode(node)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <span className="stone-name">{node.name}</span>
                      {branch && (
                        <span
                          className={`badge ${
                            node.branch === 'matthew1'
                              ? 'badge-matthew1'
                              : node.branch === 'luke3'
                              ? 'badge-luke3'
                              : 'badge-spine'
                          }`}
                          style={{ fontSize: '0.66rem', padding: '0.14rem 0.45rem' }}
                        >
                          {node.branch === 'matthew1'
                            ? 'Matt 1'
                            : node.branch === 'luke3'
                            ? 'Luke 3'
                            : node.branch === 'both'
                            ? 'Matt 1 & Luke 3'
                            : 'Line'}
                        </span>
                      )}
                    </div>
                    {dateText && <span className="stone-dates">{dateText}</span>}
                    <span className="stone-role">{node.role}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Milestone Check-In Question */}
          <section className="checkin-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
              <Sparkles size={16} color="var(--gold-deep)" />
              <span className="section-kicker" style={{ margin: 0 }}>
                Chapter {story.chapter} Milestone Check-In
              </span>
            </div>
            <h3 className="checkin-question">{story.checkIn.question}</h3>
            <div className="checkin-options">
              {story.checkIn.options.map((opt, idx) => {
                let cls = 'option-btn';
                if (isAnswered) {
                  if (idx === story.checkIn.correctIndex) cls += ' correct';
                  else if (idx === picked) cls += ' wrong';
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    className={cls}
                    onClick={() => handleAnswer(idx)}
                  >
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: '1px solid currentColor',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className={`checkin-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
                <strong>{isCorrect ? 'Milestone Cleared! ' : 'Not quite — try reviewing: '}</strong>
                {story.checkIn.explanation}
              </div>
            )}
          </section>

          {/* Previous / Next Navigation */}
          <div className="story-nav-footer">
            <button
              type="button"
              className="btn"
              disabled={activeIndex === 0}
              onClick={() => {
                setActiveIndex((i) => Math.max(0, i - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <ChevronLeft size={16} />
              <span>Previous Era</span>
            </button>

            <span style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', fontWeight: 600 }}>
              Era {story.chapter} of {ALL_STORIES.length}
            </span>

            {activeIndex < ALL_STORIES.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setActiveIndex((i) => Math.min(ALL_STORIES.length - 1, i + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <span>Next: {ALL_STORIES[activeIndex + 1].title}</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" className="btn btn-crimson" onClick={onOpenExplorerFocus}>
                <Compass size={16} />
                <span>Explore Full Chart</span>
              </button>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
