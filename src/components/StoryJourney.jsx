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
  Star,
  Lock,
  Gamepad2,
  Award,
  BookOpen,
  Flame,
} from 'lucide-react';
import {
  ALL_STORIES,
  NODES_BY_ID,
  PROPHECIES_BY_ID,
  BRANCH_LABELS,
} from '../utils/dataStore';
import { formatDateRange } from '../utils/yearUtils';
import EraMiniGames from './EraMiniGames';

const ERA_RELICS = {
  'era-1': { name: 'Scroll of Eden', anchorNodeId: 'n619' },
  'era-2': { name: 'Ark of the Nations', anchorNodeId: 'n661' },
  'era-3': { name: 'Covenant Star', anchorNodeId: 'n671' },
  'era-4': { name: 'Scepter of Judah', anchorNodeId: 'n736' },
  'era-5': { name: 'Harp & Crown of David', anchorNodeId: 'n669' },
  'era-6': { name: 'Daniel’s 70-Weeks Dial', anchorNodeId: 'n738' },
  'era-7': { name: 'Crown of the Offspring', anchorNodeId: 'n684' },
};

function getExplorerRank(xp) {
  if (xp >= 700) return 'Keeper of the Offspring';
  if (xp >= 450) return 'Royal Chronicler';
  if (xp >= 250) return 'Tribal Guide';
  if (xp >= 100) return 'Covenant Seeker';
  return 'Apprentice Scribe';
}

export default function StoryJourney({
  completedEras,
  completedMiniGames,
  unsealedProphecies,
  xp,
  onCompleteEra,
  onCompleteMiniGame,
  onUnsealProphecy,
  onSelectNode,
  onLocateInExplorer,
  onOpenExplorerFocus,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [stage, setStage] = useState(0); // 0 = Discover & Unseal, 1 = Play Mini-Game, 2 = Boss Check-In
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const story = ALL_STORIES[activeIndex];
  const relic = ERA_RELICS[story.id];
  const anchorNode = NODES_BY_ID[relic.anchorNodeId];
  const prophecies = story.prophecyIds.map((id) => PROPHECIES_BY_ID[id]).filter(Boolean);
  const stones = story.steppingStoneNodeIds.map((id) => NODES_BY_ID[id]).filter(Boolean);

  const picked = selectedAnswers[story.id];
  const isAnswered = picked !== undefined;
  const isCorrect = picked === story.checkIn.correctIndex;

  // Calculate stars per era (1 star for unsealing prophecies, 1 star for mini-game, 1 star for check-in)
  const getEraStars = (eraObj) => {
    let stars = 0;
    const eraHasUnsealed = eraObj.prophecyIds.some((pid) => unsealedProphecies.includes(pid));
    if (eraHasUnsealed) stars += 1;
    if (completedMiniGames.includes(eraObj.id)) stars += 1;
    if (completedEras.includes(eraObj.id)) stars += 1;
    return stars;
  };

  const totalStars = ALL_STORIES.reduce((sum, e) => sum + getEraStars(e), 0);
  const currentEraStars = getEraStars(story);
  const miniGameSolved = completedMiniGames.includes(story.id);
  const checkInSolved = completedEras.includes(story.id);

  const switchEra = (idx) => {
    setActiveIndex(idx);
    setStage(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnswer = (optIdx) => {
    setSelectedAnswers((prev) => ({ ...prev, [story.id]: optIdx }));
    if (optIdx === story.checkIn.correctIndex) {
      onCompleteEra(story.id);
    }
  };

  return (
    <div className="quest-tour-wrap">
      {/* Interactive Quest HUD + 7-Stop Visual Trail */}
      <section className="quest-hud-card" aria-label="Quest Learning Tour Progress">
        <div className="quest-hud-top">
          <div>
            <p className="quest-hud-kicker">Interactive Game Learning Tour · 4,000-Year Quest</p>
            <h1 className="quest-hud-title">The Quest for the Promised Offspring</h1>
          </div>

          <div className="quest-hud-stats">
            <div className="hud-pill">
              <Award size={15} />
              <span>{getExplorerRank(xp)}</span>
            </div>
            <div className="hud-pill hud-pill-gold">
              <Flame size={15} />
              <span>{xp} XP</span>
            </div>
            <div className="hud-pill hud-pill-gold">
              <Star size={15} fill="currentColor" />
              <span>{totalStars} / 21 ★</span>
            </div>
          </div>
        </div>

        {/* Interactive 7-Stop Visual Trail Map */}
        <div className="quest-trail-scroll" role="tablist" aria-label="Seven Quest Eras">
          {ALL_STORIES.map((era, idx) => {
            const stars = getEraStars(era);
            const isActive = idx === activeIndex;
            return (
              <button
                key={era.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`trail-stop-btn ${isActive ? 'active' : ''} ${stars === 3 ? 'mastered' : ''}`}
                onClick={() => switchEra(idx)}
              >
                <span className="trail-stop-badge">
                  {stars === 3 ? <CheckCircle2 size={15} /> : era.chapter}
                </span>
                <span className="trail-stop-info">
                  <span className="trail-stop-name">{era.title}</span>
                  <span className="trail-stop-stars" aria-label={`${stars} of 3 stars`}>
                    {[0, 1, 2].map((s) => (
                      <Star
                        key={s}
                        size={11}
                        fill={s < stars ? '#E2BE74' : 'none'}
                        color={s < stars ? '#E2BE74' : 'currentColor'}
                        style={{ opacity: s < stars ? 1 : 0.4 }}
                      />
                    ))}
                    <span className="trail-stop-years">{era.years}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Era Quest Header + 3-Stage Stepper */}
      <section className="quest-stage-shell">
        <div className="quest-era-banner">
          <div className="quest-era-banner-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="story-chapter-tag">
                Stop {story.chapter} of {ALL_STORIES.length}
              </span>
              <span className="story-year-tag">{story.years}</span>
              <span className="badge badge-gold">
                <Star size={11} fill="currentColor" /> {currentEraStars}/3 Stars
              </span>
            </div>

            {anchorNode && (
              <button
                type="button"
                className="btn"
                style={{ padding: '0.36rem 0.75rem', fontSize: '0.79rem' }}
                onClick={() => onLocateInExplorer(anchorNode)}
              >
                <Compass size={14} />
                <span>View on Live Chart</span>
              </button>
            )}
          </div>

          <h2 className="story-title" style={{ marginTop: '0.45rem' }}>
            {story.title}
          </h2>
          <p className="story-subtitle" style={{ marginBottom: '0.9rem' }}>
            {story.subtitle}
          </p>

          {/* 3-Stage Playable Quest Stepper */}
          <div className="quest-stepper" role="tablist" aria-label="Era Quest Stages">
            <button
              type="button"
              role="tab"
              aria-selected={stage === 0}
              className={`stepper-btn ${stage === 0 ? 'active' : ''}`}
              onClick={() => setStage(0)}
            >
              <BookOpen size={15} />
              <span>1. Discover &amp; Unseal</span>
              {story.prophecyIds.some((pid) => unsealedProphecies.includes(pid)) && (
                <CheckCircle2 size={14} className="stepper-check" />
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={stage === 1}
              className={`stepper-btn ${stage === 1 ? 'active' : ''}`}
              onClick={() => setStage(1)}
            >
              <Gamepad2 size={15} />
              <span>2. Play Mini-Game</span>
              {miniGameSolved && <CheckCircle2 size={14} className="stepper-check" />}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={stage === 2}
              className={`stepper-btn ${stage === 2 ? 'active' : ''}`}
              onClick={() => setStage(2)}
            >
              <Sparkles size={15} />
              <span>3. Era Check-In</span>
              {checkInSolved && <CheckCircle2 size={14} className="stepper-check" />}
            </button>
          </div>
        </div>

        {/* STAGE 1: DISCOVER & UNSEAL PROPHECY SEALS */}
        {stage === 0 && (
          <div className="quest-stage-body">
            <div className="story-subblock">
              <div className="story-narrative">
                {story.narrative.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            {/* Tap-to-Unseal Prophecy Milestones */}
            {prophecies.length > 0 && (
              <section className="story-subblock">
                <h3 className="subblock-heading">
                  <Scroll size={18} color="var(--gold-deep)" />
                  <span>Tap to Unseal Prophecy Clues (+25 XP Each)</span>
                </h3>
                <div className="prophecy-grid">
                  {prophecies.map((p) => {
                    const isUnsealed = unsealedProphecies.includes(p.id);
                    const pNode = NODES_BY_ID[p.nodeId];
                    if (!isUnsealed) {
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className="prophecy-seal-locked"
                          onClick={() => onUnsealProphecy(p.id)}
                        >
                          <span className="wax-seal-circle">
                            <Lock size={18} />
                          </span>
                          <span className="prophecy-ref">{p.reference}</span>
                          <strong style={{ color: 'var(--slate-teal)', fontSize: '0.95rem' }}>
                            Tap to Unseal Milestone #{p.order}
                          </strong>
                          <span style={{ fontSize: '0.77rem', color: 'var(--gold-deep)', fontWeight: 600 }}>
                            Earn +25 XP &amp; Unlock Scripture
                          </span>
                        </button>
                      );
                    }
                    return (
                      <div key={p.id} className="prophecy-card prophecy-unsealed">
                        <div className="prophecy-card-top">
                          <span className="prophecy-ref">✓ {p.reference}</span>
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
                            style={{ padding: '0.36rem 0.7rem', fontSize: '0.78rem' }}
                          >
                            <ExternalLink size={13} />
                            <span>JW Library</span>
                          </a>
                          {pNode && (
                            <button
                              type="button"
                              className="btn"
                              style={{ padding: '0.36rem 0.7rem', fontSize: '0.78rem' }}
                              onClick={() => onSelectNode(pNode)}
                            >
                              <span>Inspect</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Meet the Characters Stepping Stones */}
            <section className="story-subblock">
              <h3 className="subblock-heading">
                <Users size={18} color="var(--crimson)" />
                <span>Meet Key Figures in This Era (Tap Any Card for Insight Profile)</span>
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
                            style={{ fontSize: '0.65rem', padding: '0.12rem 0.42rem' }}
                          >
                            {node.branch === 'matthew1'
                              ? 'Matt 1'
                              : node.branch === 'luke3'
                              ? 'Luke 3'
                              : node.branch === 'both'
                              ? 'Both'
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

            <div className="stage-cta-row">
              <button
                type="button"
                className="btn btn-crimson"
                style={{ padding: '0.72rem 1.35rem', fontSize: '0.94rem' }}
                onClick={() => setStage(1)}
              >
                <Gamepad2 size={17} />
                <span>Next: Play Era {story.chapter} Mini-Game</span>
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: PLAYABLE ERA MINI-GAME */}
        {stage === 1 && (
          <div className="quest-stage-body">
            <EraMiniGames
              key={story.id}
              eraId={story.id}
              alreadySolved={miniGameSolved}
              onSolved={onCompleteMiniGame}
            />

            <div className="stage-cta-row">
              <button type="button" className="btn" onClick={() => setStage(0)}>
                <ChevronLeft size={16} />
                <span>Back to Story &amp; Clues</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.7rem 1.3rem', fontSize: '0.92rem' }}
                onClick={() => setStage(2)}
              >
                <Sparkles size={16} />
                <span>Next: Era {story.chapter} Check-In</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: BOSS CHECK-IN & ERA RELIC CELEBRATION */}
        {stage === 2 && (
          <div className="quest-stage-body">
            <section className="checkin-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                <Sparkles size={16} color="var(--gold-deep)" />
                <span className="section-kicker" style={{ margin: 0 }}>
                  Era {story.chapter} Boss Check-In · Unlock the {relic.name} (+50 XP)
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
                  <strong>{isCorrect ? 'Relic Unlocked! ' : 'Try again or review: '}</strong>
                  {story.checkIn.explanation}
                </div>
              )}

              {(checkInSolved || isCorrect) && (
                <div className="relic-celebration-banner">
                  <span className="relic-seal-icon">
                    <Award size={22} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '1.02rem', color: 'var(--slate-teal)' }}>
                      Relic Collected: {relic.name}
                    </strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
                      You’ve earned {currentEraStars} of 3 stars in {story.title}!
                    </span>
                  </div>
                </div>
              )}
            </section>

            <div className="story-nav-footer">
              <button type="button" className="btn" onClick={() => setStage(1)}>
                <ChevronLeft size={16} />
                <span>Replay Mini-Game</span>
              </button>

              {activeIndex < ALL_STORIES.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-crimson"
                  onClick={() => switchEra(activeIndex + 1)}
                >
                  <span>Continue to Stop {story.chapter + 1}: {ALL_STORIES[activeIndex + 1].title}</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button type="button" className="btn btn-crimson" onClick={onOpenExplorerFocus}>
                  <Compass size={16} />
                  <span>Explore Complete Messianic Line</span>
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
