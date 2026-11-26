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
  Lightbulb,
  MessageCircleHeart,
} from 'lucide-react';
import {
  ALL_STORIES,
  NODES_BY_ID,
  PROPHECIES_BY_ID,
  BRANCH_LABELS,
} from '../utils/dataStore';
import { formatDateRange } from '../utils/yearUtils';
import {
  playUnsealSound,
  playCorrectSound,
  playWrongSound,
  playFanfareSound,
} from '../utils/soundEffects';
import EraMiniGames from './EraMiniGames';
import FamilyWorshipBar from './FamilyWorshipBar';
import { GuideOwl, EraMedallion, ConfettiBurst } from './QuestIllustrations';

const ERA_EXTRAS = {
  'era-1': {
    relicName: 'Scroll of Eden',
    anchorNodeId: 'n619',
    pipIntro:
      'Hoo-hoo! Welcome to Eden (4026 B.C.E.)! Tap the crimson wax seal below to uncover the Bible’s very first promise, then try the Pre-Flood Time Order game!',
    funFactTitle: 'Whoa! 243-Year Overlap!',
    funFactBody:
      'Methuselah was born in 3339 B.C.E. and Adam died in 3096 B.C.E. That means Methuselah lived alongside Adam for 243 years — and lived right up to 2370 B.C.E., the exact year of the Global Flood!',
    familyReadRef: 'Genesis 3:15',
    familyReadUrl: 'https://www.jw.org/finder?srcid=jwlshare&wtlocale=E&prefer=lang&bible=01003015&pub=nwtsty',
    familyPrompt:
      'Why do you think Jehovah gave the Genesis 3:15 promise right away in Eden instead of waiting thousands of years? How does that show His love for us?',
  },
  'era-2': {
    relicName: 'Ark of the Nations',
    anchorNodeId: 'n661',
    pipIntro:
      'All aboard! After the 2370 B.C.E. Flood, every nation on earth branched out from Noah’s three sons: Shem, Ham, and Japheth (Genesis 10). Ready to sort them?',
    funFactTitle: 'Whoa! Noah & Abraham Were Only 2 Years Apart!',
    funFactBody:
      'Noah lived 350 years after the Flood until 2020 B.C.E. — just 2 short years before Abraham was born (2018 B.C.E.)! Even wilder: Flood-survivor Shem overlapped with Abraham for 150 years!',
    familyReadRef: 'Genesis 9:26',
    familyReadUrl: 'https://www.jw.org/finder?srcid=jwlshare&wtlocale=E&prefer=lang&bible=01009026&pub=nwtsty',
    familyPrompt:
      'Imagine sitting down with Shem as a kid and hearing him describe the Ark firsthand! What is one question you would ask Noah or Shem?',
  },
  'era-3': {
    relicName: 'Covenant Star',
    anchorNodeId: 'n671',
    pipIntro:
      'Look up at the stars! In 1943 B.C.E., Abraham crossed the Euphrates and received Jehovah’s oath that ALL nations would be blessed through his offspring. Unseal all 6 patriarchal clues!',
    funFactTitle: 'Whoa! Eber Outlived Abraham!',
    funFactBody:
      'Eber (from whom the name “Hebrew” comes!) lived 464 years (2303–1839 B.C.E.) — which means he actually outlived Abraham (died 1843 B.C.E.) by 4 years!',
    familyReadRef: 'Genesis 22:18',
    familyReadUrl: 'https://www.jw.org/finder?srcid=jwlshare&wtlocale=E&prefer=lang&bible=01022018&pub=nwtsty',
    familyPrompt:
      'Abraham trusted Jehovah even when he had to leave his home and wait years for Isaac. What helps our family trust Jehovah when we have to wait for something?',
  },
  'era-4': {
    relicName: 'Scepter of Judah',
    anchorNodeId: 'n736',
    pipIntro:
      'Twelve tribes, one royal promise! Jacob foretold at Genesis 49:10 that the scepter belonged to Judah. Discover the courageous women of faith who kept this line shining!',
    funFactTitle: 'Whoa! Faith Over Background!',
    funFactBody:
      'Matthew 1 proudly includes faithful women from outside Israel — like Rahab of Jericho and Ruth of Moab — right inside King David’s and Jesus’ family tree!',
    familyReadRef: 'Genesis 49:10',
    familyReadUrl: 'https://www.jw.org/finder?srcid=jwlshare&wtlocale=E&prefer=lang&bible=01049010&pub=nwtsty',
    familyPrompt:
      'Rahab and Ruth weren’t born Israelites, yet Jehovah honored their loyalty by placing them in Jesus’ family tree! What does that teach us about how Jehovah views people?',
  },
  'era-5': {
    relicName: 'Harp & Crown of David',
    anchorNodeId: 'n669',
    pipIntro:
      'Here’s the biggest plot twist on the whole chart! At King David, the family tree splits into TWO streams — Matthew 1 (Legal) and Luke 3 (Natural). Tap to see how!',
    funFactTitle: 'Whoa! One Mother, Two Royal Branches!',
    funFactBody:
      'According to 1 Chronicles 3:5, Bath-sheba was the mother of BOTH Solomon (who leads the Matthew 1 Legal Line to Joseph) AND Nathan (who leads the Luke 3 Natural Line to Mary)!',
    familyReadRef: '2 Samuel 7:12',
    familyReadUrl: 'https://www.jw.org/finder?srcid=jwlshare&wtlocale=E&prefer=lang&bible=10007012&pub=nwtsty',
    familyPrompt:
      'David wasn’t the oldest or tallest brother, yet Jehovah chose him because of his heart. What qualities in young David can each of us imitate this week?',
  },
  'era-6': {
    relicName: 'Daniel’s 70-Weeks Dial',
    anchorNodeId: 'n738',
    pipIntro:
      'Grab your Bible detective hat! Even after Babylon destroyed Jerusalem in 607 B.C.E., God gave Daniel a 483-year countdown that pinpointed the exact year Messiah would arrive!',
    funFactTitle: 'Whoa! Remember: There Is NO Year Zero!',
    funFactBody:
      'Counting 69 prophetic “weeks” (483 years) from 455 B.C.E. lands on 29 C.E. — NOT 28 C.E. — because history goes straight from 1 B.C.E. to 1 C.E. with no Year 0 in between!',
    familyReadRef: 'Daniel 9:24-25',
    familyReadUrl: 'https://www.jw.org/finder?srcid=jwlshare&wtlocale=E&prefer=lang&bible=27009024&pub=nwtsty',
    familyPrompt:
      'How does seeing Daniel’s 483-year prophecy come true right on schedule in 29 C.E. strengthen our family’s confidence in Jehovah’s promises for the future?',
  },
  'era-7': {
    relicName: 'Crown of the Offspring',
    anchorNodeId: 'n684',
    pipIntro:
      'The grand finale! After 4,000 years, Matthew 1’s legal title, Luke 3’s natural bloodline, and Daniel’s 29 C.E. timing all meet in Jesus of Nazareth!',
    funFactTitle: 'Whoa! Why Jesus Needed BOTH Family Trees!',
    funFactBody:
      'Through Joseph (Matthew 1 via Solomon), Jesus inherited the legal right to David’s throne. Through Mary (Luke 3 via Nathan), he was David’s direct biological descendant — fulfilling every single promise!',
    familyReadRef: 'Luke 1:32',
    familyReadUrl: 'https://www.jw.org/finder?srcid=jwlshare&wtlocale=E&prefer=lang&bible=42001032&pub=nwtsty',
    familyPrompt:
      'Looking back over all 4,000 years from Adam to Jesus, what was your favorite discovery tonight about how Jehovah kept His Genesis 3:15 promise?',
  },
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
  soundEnabled,
  familyProps,
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
  const [revealedFacts, setRevealedFacts] = useState({});
  const [celebrateNow, setCelebrateNow] = useState(false);

  const story = ALL_STORIES[activeIndex];
  const extra = ERA_EXTRAS[story.id];
  const anchorNode = NODES_BY_ID[extra.anchorNodeId];
  const prophecies = story.prophecyIds.map((id) => PROPHECIES_BY_ID[id]).filter(Boolean);
  const stones = story.steppingStoneNodeIds.map((id) => NODES_BY_ID[id]).filter(Boolean);

  const picked = selectedAnswers[story.id];
  const isAnswered = picked !== undefined;
  const isCorrect = picked === story.checkIn.correctIndex;
  const factOpen = Boolean(revealedFacts[story.id]);

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
    setCelebrateNow(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUnseal = (pid) => {
    playUnsealSound(soundEnabled);
    onUnsealProphecy(pid);
  };

  const handleAnswer = (optIdx) => {
    setSelectedAnswers((prev) => ({ ...prev, [story.id]: optIdx }));
    if (optIdx === story.checkIn.correctIndex) {
      playFanfareSound(soundEnabled);
      setCelebrateNow(true);
      onCompleteEra(story.id);
    } else {
      playWrongSound(soundEnabled);
    }
  };

  // Dynamic Pip companion mood & message per stage
  let pipMood = 'idle';
  let pipMessage = extra.pipIntro;
  if (stage === 1) {
    pipMood = miniGameSolved ? 'celebrate' : 'idle';
    pipMessage = miniGameSolved
      ? `Woohoo! You beat the Era ${story.chapter} mini-game! Head to Stage 3 to claim the ${extra.relicName}!`
      : `Time to play! Complete the Era ${story.chapter} challenge below—don’t worry, if you miss one I’ll give you a Bible hint!`;
  } else if (stage === 2) {
    if (isCorrect || checkInSolved) {
      pipMood = 'celebrate';
      pipMessage = `Amazing work!! You collected the ${extra.relicName}! Take a moment for the Family Worship discussion below before heading to the next stop!`;
    } else if (isAnswered && !isCorrect) {
      pipMood = 'encourage';
      pipMessage = 'Good try! Read the explanation below and tap the right answer to unlock your golden Relic!';
    } else {
      pipMood = 'idle';
      pipMessage = `Final step for Stop ${story.chapter}! Answer this Bible check-in to unlock the ${extra.relicName} (+50 XP)!`;
    }
  }

  return (
    <div className="quest-tour-wrap">
      {/* Family Worship Night Pass-and-Play Mode */}
      {familyProps && <FamilyWorshipBar {...familyProps} />}

      {/* Interactive Quest HUD + 7-Stop Visual Trail */}
      <section className="quest-hud-card" aria-label="Quest Learning Tour Progress">
        <div className="quest-hud-top">
          <div>
            <p className="quest-hud-kicker">Interactive Family Worship Adventure · 7 Eras</p>
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

        {/* Collectible Relic Showcase Strip */}
        <div className="relic-shelf">
          <span className="relic-shelf-label">Relic Chest ({completedEras.length}/7)</span>
          <div className="relic-shelf-icons">
            {ALL_STORIES.map((era, idx) => {
              const unlocked = completedEras.includes(era.id);
              const rName = ERA_EXTRAS[era.id].relicName;
              return (
                <button
                  key={era.id}
                  type="button"
                  className={`relic-mini-slot ${unlocked ? 'unlocked' : ''}`}
                  title={unlocked ? `Collected: ${rName}` : `Locked: ${rName} (Complete Era ${era.chapter})`}
                  onClick={() => switchEra(idx)}
                >
                  <EraMedallion eraId={era.id} size={34} unlocked={unlocked} />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pip the Scroll Owl Guide Companion */}
      <GuideOwl
        mood={pipMood}
        message={pipMessage}
        badgeText={`Stop ${story.chapter} · ${currentEraStars}/3 ★`}
      />

      {/* Active Era Quest Header + 3-Stage Stepper */}
      <section className="quest-stage-shell">
        <div className="quest-era-banner">
          <div className="quest-era-banner-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <EraMedallion eraId={story.id} size={58} unlocked={true} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <span className="story-chapter-tag">
                    Stop {story.chapter} of {ALL_STORIES.length}
                  </span>
                  <span className="story-year-tag">{story.years}</span>
                </div>
                <h2 className="story-title" style={{ marginTop: '0.2rem', marginBottom: '0.15rem' }}>
                  {story.title}
                </h2>
                <p className="story-subtitle" style={{ margin: 0 }}>
                  {story.subtitle}
                </p>
              </div>
            </div>

            {anchorNode && (
              <button
                type="button"
                className="btn"
                style={{ padding: '0.4rem 0.78rem', fontSize: '0.8rem' }}
                onClick={() => onLocateInExplorer(anchorNode)}
              >
                <Compass size={14} />
                <span>View on Chart</span>
              </button>
            )}
          </div>

          {/* 3-Stage Playable Quest Stepper */}
          <div className="quest-stepper" style={{ marginTop: '1rem' }} role="tablist" aria-label="Era Quest Stages">
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
              <span>3. Unlock &amp; Discuss</span>
              {checkInSolved && <CheckCircle2 size={14} className="stepper-check" />}
            </button>
          </div>
        </div>

        {/* STAGE 1: DISCOVER, UNSEAL & MIND-BLOWING FACT */}
        {stage === 0 && (
          <div className="quest-stage-body">
            <div className="story-subblock">
              <div className="story-narrative">
                {story.narrative.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {/* Interactive Mind-Blowing Bible Fact Flip Card */}
              <button
                type="button"
                className={`fun-fact-card ${factOpen ? 'open' : ''}`}
                onClick={() => {
                  if (!factOpen) playCorrectSound(soundEnabled);
                  setRevealedFacts((prev) => ({ ...prev, [story.id]: !prev[story.id] }));
                }}
              >
                <div className="fun-fact-header">
                  <span className="fun-fact-icon">
                    <Lightbulb size={17} />
                  </span>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <span className="fun-fact-kicker">Tap for a True Bible Mind-Blower!</span>
                    <strong className="fun-fact-title">{extra.funFactTitle}</strong>
                  </div>
                  <span className="badge badge-gold">{factOpen ? 'Hide' : 'Reveal'}</span>
                </div>
                {factOpen && <p className="fun-fact-body">{extra.funFactBody}</p>}
              </button>
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
                          onClick={() => handleUnseal(p.id)}
                        >
                          <span className="wax-seal-circle">
                            <Lock size={18} />
                          </span>
                          <span className="prophecy-ref">{p.reference}</span>
                          <strong style={{ color: 'var(--slate-teal)', fontSize: '0.95rem' }}>
                            Tap to Break Wax Seal #{p.order}
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
                <span>Meet Key Figures (Tap Any Card for Dates &amp; Insight)</span>
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
                <span>Play Stop {story.chapter} Mini-Game!</span>
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
              soundEnabled={soundEnabled}
              onSolved={onCompleteMiniGame}
            />

            <div className="stage-cta-row">
              <button type="button" className="btn" onClick={() => setStage(0)}>
                <ChevronLeft size={16} />
                <span>Back to Clues</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.7rem 1.3rem', fontSize: '0.92rem' }}
                onClick={() => setStage(2)}
              >
                <Sparkles size={16} />
                <span>Next: Unlock Relic &amp; Family Talk</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: BOSS CHECK-IN, RELIC CELEBRATION & FAMILY WORSHIP PAUSE */}
        {stage === 2 && (
          <div className="quest-stage-body">
            <section className="checkin-box" style={{ position: 'relative', overflow: 'hidden' }}>
              <ConfettiBurst active={celebrateNow} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                <Sparkles size={16} color="var(--gold-deep)" />
                <span className="section-kicker" style={{ margin: 0 }}>
                  Stop {story.chapter} Check-In · Unlock the {extra.relicName} (+50 XP)
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
                  <strong>{isCorrect ? 'Relic Unlocked! ' : 'Almost — here’s the Bible clue: '}</strong>
                  {story.checkIn.explanation}
                </div>
              )}

              {(checkInSolved || isCorrect) && (
                <div className="relic-celebration-banner">
                  <EraMedallion eraId={story.id} size={52} unlocked={true} />
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '1.02rem', color: 'var(--slate-teal)' }}>
                      Relic Collected: {extra.relicName}!
                    </strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
                      You’ve earned {currentEraStars} of 3 stars in {story.title}!
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* Family Worship Pause: Read Aloud & Discuss Together */}
            <section className="family-discuss-card">
              <div className="family-discuss-top">
                <span className="family-discuss-badge">
                  <MessageCircleHeart size={16} />
                  <span>Family Worship Pause · Read &amp; Talk Together</span>
                </span>
                <a
                  href={extra.familyReadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-crimson"
                  style={{ padding: '0.35rem 0.72rem', fontSize: '0.78rem' }}
                >
                  <ExternalLink size={13} />
                  <span>Read {extra.familyReadRef}</span>
                </a>
              </div>
              <p className="family-discuss-question">“{extra.familyPrompt}”</p>
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
                  <span>Next Stop ({story.chapter + 1}): {ALL_STORIES[activeIndex + 1].title}</span>
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
