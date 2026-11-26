import { useState, useMemo } from 'react';
import {
  GitBranch,
  Scroll,
  Clock,
  Award,
  Flame,
  RotateCcw,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  ALL_PROPHECIES,
  NODES_BY_ID,
  MESSIANIC_SPINE_IDS,
  MATTHEW1_CHAIN_IDS,
  LUKE3_CHAIN_IDS,
} from '../utils/dataStore';

const QUIZ_MODES = [
  {
    id: 'chain',
    title: 'Lineage Chain Builder',
    subtitle: 'Complete missing links across the Spine, Matthew 1 Legal Line, and Luke 3 Natural Line.',
    icon: GitBranch,
  },
  {
    id: 'prophecy',
    title: 'Prophecy & Covenant Match',
    subtitle: 'Match all 13 landmark scriptures from Genesis 3:15 through Luke 1:32 to their promise.',
    icon: Scroll,
  },
  {
    id: 'timeline',
    title: 'Timeline & Overlap Showdown',
    subtitle: 'Master surprising patriarchal overlaps, lifespans, and Daniel’s 69-week calculation.',
    icon: Clock,
  },
];

const BADGE_DEFS = [
  {
    id: 'first-correct',
    title: 'Scroll Seeker',
    desc: 'Answer your first Lineage Challenge question correctly',
  },
  {
    id: 'streak-5',
    title: 'Unbroken Lineage',
    desc: 'Reach a streak of 5 correct answers in a row',
  },
  {
    id: 'chain-master',
    title: 'Genealogy Scribe',
    desc: 'Complete a round of Lineage Chain Builder with 70%+ accuracy',
  },
  {
    id: 'prophecy-keeper',
    title: 'Keeper of the Covenant',
    desc: 'Complete a round of Prophecy & Covenant Match with 70%+ accuracy',
  },
  {
    id: 'timekeeper',
    title: 'Timekeeper of the Ages',
    desc: 'Complete a round of Timeline & Overlap Showdown with 70%+ accuracy',
  },
  {
    id: 'master-scholar',
    title: 'Promised Offspring Scholar',
    desc: 'Reach 15 total correct answers across all challenge modes',
  },
];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildChainQuestions() {
  const chains = [
    { name: 'Direct Messianic Spine', ids: MESSIANIC_SPINE_IDS },
    { name: 'Matthew 1 · Legal Line (Solomon → Joseph)', ids: MATTHEW1_CHAIN_IDS },
    { name: 'Luke 3 · Natural Line (Nathan → Mary)', ids: LUKE3_CHAIN_IDS },
  ];

  const curatedPicks = [
    { chainIdx: 0, pos: 1 },   // Adam -> [Seth] -> Enosh
    { chainIdx: 0, pos: 7 },   // Enoch -> [Methuselah] -> Lamech
    { chainIdx: 0, pos: 13 },  // Shelah -> [Eber] -> Peleg
    { chainIdx: 0, pos: 19 },  // Terah -> [Abraham] -> Isaac
    { chainIdx: 0, pos: 22 },  // Jacob/Israel -> [Judah] -> Perez
    { chainIdx: 0, pos: 29 },  // Salma -> [Boaz] -> Obed
    { chainIdx: 0, pos: 31 },  // Obed -> [Jesse] -> David
    { chainIdx: 1, pos: 1 },   // David -> [Solomon] -> Rehoboam
    { chainIdx: 1, pos: 13 },  // Ahaz -> [Hezekiah] -> Manasseh
    { chainIdx: 1, pos: 20 },  // Shealtiel -> [Zerubbabel] -> Abiud
    { chainIdx: 2, pos: 1 },   // David -> [Nathan] -> Mattatha
    { chainIdx: 2, pos: 41 },  // Heli -> [Mary] -> Jesus
  ];

  const selected = shuffle(curatedPicks).slice(0, 7);
  return selected.map((pick, i) => {
    const chain = chains[pick.chainIdx];
    const prevNode = NODES_BY_ID[chain.ids[pick.pos - 1]];
    const targetNode = NODES_BY_ID[chain.ids[pick.pos]];
    const nextNode = NODES_BY_ID[chain.ids[pick.pos + 1]];

    const pool = chain.ids
      .filter((id, idx) => Math.abs(idx - pick.pos) > 1 && NODES_BY_ID[id]?.name !== targetNode.name)
      .map((id) => NODES_BY_ID[id]);
    const distractors = [];
    const seenNames = new Set([targetNode.name, prevNode.name, nextNode.name]);
    for (const candidate of shuffle(pool)) {
      if (candidate && !seenNames.has(candidate.name)) {
        seenNames.add(candidate.name);
        distractors.push(candidate.name);
      }
      if (distractors.length === 3) break;
    }

    const options = shuffle([targetNode.name, ...distractors]);
    return {
      id: `chain-${i}`,
      kicker: chain.name,
      prompt: `Who is the missing link between ${prevNode.name} and ${nextNode.name}?`,
      chainPreview: [prevNode.name, '?', nextNode.name],
      options,
      correctAnswer: targetNode.name,
      explanation: `${targetNode.name} (${targetNode.role}) bridges ${prevNode.name} and ${nextNode.name} in the ${chain.name}.`,
      reviewNode: targetNode,
      jwUrl: targetNode.jwUrl,
    };
  });
}

function buildProphecyQuestions() {
  const chosen = shuffle(ALL_PROPHECIES).slice(0, 7);
  return chosen.map((p, i) => {
    const others = shuffle(ALL_PROPHECIES.filter((x) => x.id !== p.id)).slice(0, 3);
    const askRef = i % 2 === 0;
    if (askRef) {
      const options = shuffle([p.reference, ...others.map((o) => o.reference)]);
      return {
        id: `prop-${p.id}`,
        kicker: `Prophecy Milestone #${p.order} · ${p.date}`,
        prompt: `Which scripture records the milestone "${p.title}"?`,
        options,
        correctAnswer: p.reference,
        explanation: `${p.reference} ("${p.title}"): ${p.summary}`,
        reviewNode: NODES_BY_ID[p.nodeId],
        jwUrl: p.jwUrl,
      };
    }
    const options = shuffle([p.title, ...others.map((o) => o.title)]);
    return {
      id: `prop-${p.id}`,
      kicker: `Prophecy Milestone #${p.order} · ${p.date}`,
      prompt: `What Messianic promise is established at ${p.reference}?`,
      options,
      correctAnswer: p.title,
      explanation: `${p.reference} — ${p.title}. ${p.fulfillment}`,
      reviewNode: NODES_BY_ID[p.nodeId],
      jwUrl: p.jwUrl,
    };
  });
}

function buildTimelineQuestions() {
  const bank = [
    {
      prompt: 'How many years did Methuselah overlap with Adam before Adam died in 3096 B.C.E.?',
      options: ['56 years', '150 years', '243 years', '365 years'],
      correctAnswer: '243 years',
      explanation: 'Methuselah was born in 3339 B.C.E. and Adam died in 3096 B.C.E. — a remarkable 243-year overlap!',
      nodeId: 'n675',
    },
    {
      prompt: 'How many years separated Noah’s death (2020 B.C.E.) and Abraham’s birth (2018 B.C.E.)?',
      options: ['2 years', '50 years', '127 years', '427 years'],
      correctAnswer: '2 years',
      explanation: 'Noah lived 350 years after the Flood and died in 2020 B.C.E. — just 2 years before Abraham was born!',
      nodeId: 'n661',
    },
    {
      prompt: 'For how many years did Flood-survivor Shem overlap with Abraham?',
      options: ['15 years', '50 years', '150 years', '243 years'],
      correctAnswer: '150 years',
      explanation: 'Abraham was born in 2018 B.C.E. and Shem lived until 1868 B.C.E., giving them 150 years as contemporaries!',
      nodeId: 'n662',
    },
    {
      prompt: 'Which pre-Flood patriarch died in 2370 B.C.E. — the exact year the Global Flood began?',
      options: ['Lamech', 'Methuselah', 'Jared', 'Enoch'],
      correctAnswer: 'Methuselah',
      explanation: 'Methuselah lived 969 years (3339–2370 B.C.E.), dying in the exact year the Global Flood arrived.',
      nodeId: 'n675',
    },
    {
      prompt: 'Starting from 455 B.C.E. and counting 69 prophetic "weeks" (483 years) — remembering there is NO zero year — arrives at:',
      options: ['2 B.C.E.', '28 C.E.', '29 C.E.', '33 C.E.'],
      correctAnswer: '29 C.E.',
      explanation: '455 B.C.E. to 1 B.C.E. is 454 years; crossing directly to 1 C.E. adds 1 year (455); + 28 years = 29 C.E., the year Jesus was baptized!',
      nodeId: 'n684',
    },
    {
      prompt: 'Surprisingly, which post-Flood ancestor of the Hebrews outlived Abraham by 4 years?',
      options: ['Eber', 'Peleg', 'Terah', 'Nahor'],
      correctAnswer: 'Eber',
      explanation: 'Eber lived 464 years (2303–1839 B.C.E.), outliving Abraham (who died in 1843 B.C.E.) by 4 years!',
      nodeId: 'n664',
    },
    {
      prompt: 'How many years elapsed from Abraham crossing the Euphrates (1943 B.C.E.) to Moses leading the Exodus (1513 B.C.E.)?',
      options: ['400 years', '427 years', '430 years', '483 years'],
      correctAnswer: '430 years',
      explanation: '1943 B.C.E. minus 1513 B.C.E. = 430 years, fulfilling Galatians 3:17 precisely!',
      nodeId: 'n147',
    },
    {
      prompt: 'In what year did Babylon destroy Jerusalem and end the 510-year era of Israelite kings?',
      options: ['740 B.C.E.', '607 B.C.E.', '539 B.C.E.', '455 B.C.E.'],
      correctAnswer: '607 B.C.E.',
      explanation: 'In 607 B.C.E., Babylon destroyed Judah and Jerusalem; 70 years later (537 B.C.E.), Governor Zerubbabel led the return.',
      nodeId: 'n738',
    },
  ];

  return shuffle(bank)
    .slice(0, 7)
    .map((q, i) => {
      const node = NODES_BY_ID[q.nodeId];
      return {
        id: `time-${i}`,
        kicker: 'Timeline & Overlap Showdown',
        prompt: q.prompt,
        options: shuffle(q.options),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        reviewNode: node,
        jwUrl: node?.jwUrl,
      };
    });
}

export default function LineageQuiz({ quizStats, onRecordAnswer, onRoundComplete, onSelectNode }) {
  const [activeMode, setActiveMode] = useState('chain');
  const [roundSeed, setRoundSeed] = useState(1);
  const [qIndex, setQIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [roundFinished, setRoundFinished] = useState(false);

  const questions = useMemo(() => {
    void roundSeed;
    if (activeMode === 'chain') return buildChainQuestions();
    if (activeMode === 'prophecy') return buildProphecyQuestions();
    return buildTimelineQuestions();
  }, [activeMode, roundSeed]);

  const currentQ = questions[qIndex];
  const accuracy =
    quizStats.totalAnswered > 0
      ? Math.round((quizStats.totalCorrect / quizStats.totalAnswered) * 100)
      : 0;

  const startMode = (modeId) => {
    setActiveMode(modeId);
    setQIndex(0);
    setSelectedOpt(null);
    setRoundCorrect(0);
    setRoundFinished(false);
    setRoundSeed((s) => s + 1);
  };

  const handleChoose = (opt) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(opt);
    const isCorrect = opt === currentQ.correctAnswer;
    const nextRoundCorrect = roundCorrect + (isCorrect ? 1 : 0);
    setRoundCorrect(nextRoundCorrect);
    onRecordAnswer(isCorrect);
  };

  const handleNext = () => {
    if (qIndex + 1 >= questions.length) {
      setRoundFinished(true);
      onRoundComplete(activeMode, roundCorrect, questions.length);
    } else {
      setQIndex((i) => i + 1);
      setSelectedOpt(null);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-kicker">Interactive Knowledge Game · Three Playable Modes</p>
          <h1 className="section-title">Lineage Challenge Quiz</h1>
          <p className="section-lead">
            Test your mastery of the Messianic genealogy, the 13 prophetic covenants, and the
            remarkable B.C.E. overlaps—earning archival badges saved right in your browser.
          </p>
        </div>
      </div>

      {/* Mode Selector Cards */}
      <div className="quiz-mode-grid">
        {QUIZ_MODES.map(({ id, title, subtitle, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`quiz-mode-card ${activeMode === id ? 'active' : ''}`}
            onClick={() => startMode(id)}
          >
            <div className="quiz-mode-icon">
              <Icon size={21} />
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.08rem',
                margin: 0,
                color: 'var(--slate-teal)',
              }}
            >
              {title}
            </h2>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
              {subtitle}
            </p>
          </button>
        ))}
      </div>

      <div className="quiz-arena">
        {/* Main Question Stage */}
        <section className="quiz-question-card">
          {roundFinished ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'var(--gold-soft)',
                  border: '2px solid var(--gold)',
                  color: 'var(--gold-deep)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.8rem',
                }}
              >
                <Award size={30} />
              </div>
              <h2 className="story-title" style={{ fontSize: '1.65rem' }}>
                Round Complete: {roundCorrect} / {questions.length}
              </h2>
              <p className="story-subtitle" style={{ marginBottom: '1.4rem' }}>
                {Math.round((roundCorrect / questions.length) * 100)}% accuracy in{' '}
                {QUIZ_MODES.find((m) => m.id === activeMode)?.title}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-crimson"
                  onClick={() => startMode(activeMode)}
                >
                  <RotateCcw size={15} />
                  <span>Play New Shuffled Round</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const nextIdx =
                      (QUIZ_MODES.findIndex((m) => m.id === activeMode) + 1) % QUIZ_MODES.length;
                    startMode(QUIZ_MODES[nextIdx].id);
                  }}
                >
                  <span>Try Next Challenge Mode</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <span className="section-kicker" style={{ margin: 0 }}>
                  {currentQ.kicker}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-teal)' }}>
                  Question {qIndex + 1} of {questions.length}
                </span>
              </div>

              <div className="quiz-progress-bar">
                <div
                  className="quiz-progress-fill"
                  style={{ width: `${((qIndex + (selectedOpt ? 1 : 0)) / questions.length) * 100}%` }}
                />
              </div>

              {currentQ.chainPreview && (
                <div className="chain-preview">
                  {currentQ.chainPreview.map((item, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span className={`chain-node-pill ${item === '?' ? 'mystery' : ''}`}>
                        {item === '?' && selectedOpt ? currentQ.correctAnswer : item}
                      </span>
                      {i < currentQ.chainPreview.length - 1 && (
                        <ArrowRight size={15} color="var(--gold-deep)" />
                      )}
                    </span>
                  ))}
                </div>
              )}

              <h3 className="checkin-question">{currentQ.prompt}</h3>

              <div className="checkin-options">
                {currentQ.options.map((opt, idx) => {
                  let cls = 'option-btn';
                  if (selectedOpt !== null) {
                    if (opt === currentQ.correctAnswer) cls += ' correct';
                    else if (opt === selectedOpt) cls += ' wrong';
                  }
                  return (
                    <button
                      key={opt}
                      type="button"
                      className={cls}
                      disabled={selectedOpt !== null}
                      onClick={() => handleChoose(opt)}
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

              {selectedOpt !== null && (
                <div
                  className={`checkin-feedback ${
                    selectedOpt === currentQ.correctAnswer ? 'correct' : 'wrong'
                  }`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontWeight: 700 }}>
                    {selectedOpt === currentQ.correctAnswer ? (
                      <>
                        <CheckCircle2 size={17} />
                        <span>Correct!</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={17} />
                        <span>Answer: {currentQ.correctAnswer}</span>
                      </>
                    )}
                  </div>
                  <p style={{ margin: '0 0 0.8rem' }}>{currentQ.explanation}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {currentQ.reviewNode && (
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: '0.4rem 0.78rem', fontSize: '0.8rem' }}
                          onClick={() => onSelectNode(currentQ.reviewNode)}
                        >
                          Inspect {currentQ.reviewNode.name}
                        </button>
                      )}
                      {currentQ.jwUrl && (
                        <a
                          href={currentQ.jwUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{ padding: '0.4rem 0.78rem', fontSize: '0.8rem' }}
                        >
                          <ExternalLink size={13} />
                          <span>JW Library</span>
                        </a>
                      )}
                    </div>
                    <button type="button" className="btn btn-primary" onClick={handleNext}>
                      <span>{qIndex + 1 >= questions.length ? 'Finish Round' : 'Next Question'}</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Right: Stats & Collectible Archival Badges */}
        <aside className="quiz-stats-panel">
          <h2 className="subblock-heading">
            <Flame size={17} color="var(--crimson)" />
            <span>Your Record</span>
          </h2>
          <div className="quiz-kpi-row">
            <div className="quiz-kpi">
              <span className="quiz-kpi-val">{quizStats.currentStreak}</span>
              <span className="quiz-kpi-label">Streak</span>
            </div>
            <div className="quiz-kpi">
              <span className="quiz-kpi-val">{quizStats.bestStreak}</span>
              <span className="quiz-kpi-label">Best</span>
            </div>
            <div className="quiz-kpi">
              <span className="quiz-kpi-val">{accuracy}%</span>
              <span className="quiz-kpi-label">Accuracy</span>
            </div>
          </div>

          <h3 className="drawer-section-label" style={{ marginTop: '0.4rem' }}>
            Collectible Archival Badges ({quizStats.badges.length}/{BADGE_DEFS.length})
          </h3>
          <div className="badges-grid">
            {BADGE_DEFS.map((b) => {
              const earned = quizStats.badges.includes(b.id);
              return (
                <div key={b.id} className={`archival-badge ${earned ? 'earned' : ''}`}>
                  <span className="archival-badge-seal">
                    <Award size={17} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--slate-teal)' }}>
                      {b.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', lineHeight: 1.32 }}>
                      {b.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
