import { useState } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  GitBranch,
  Crown,
  KeyRound,
} from 'lucide-react';

/**
 * 7 Bespoke Mobile-Friendly Interactive Mini-Games — one tailored to each Era of the Quest Tour!
 */

/* ---------------- ERA 1: Tap in Order (Pre-Flood Lineage Chain) ---------------- */
const ERA1_TARGET = ['Adam', 'Seth', 'Enoch', 'Methuselah', 'Lamech'];
const ERA1_POOL = ['Methuselah', 'Seth', 'Lamech', 'Adam', 'Enoch'];

function Era1ChainGame({ onSolve }) {
  const [placed, setPlaced] = useState([]);
  const [wrongName, setWrongName] = useState(null);
  const solved = placed.length === ERA1_TARGET.length;

  const handleTap = (name) => {
    if (solved || placed.includes(name)) return;
    const expected = ERA1_TARGET[placed.length];
    if (name === expected) {
      const next = [...placed, name];
      setPlaced(next);
      setWrongName(null);
      if (next.length === ERA1_TARGET.length) onSolve();
    } else {
      setWrongName(name);
      setTimeout(() => setWrongName(null), 550);
    }
  };

  return (
    <div className="minigame-card">
      <div className="minigame-header">
        <span className="badge badge-gold">Era 1 Mini-Game · Lineage Builder</span>
        <button
          type="button"
          className="btn"
          style={{ padding: '0.28rem 0.6rem', fontSize: '0.76rem' }}
          onClick={() => setPlaced([])}
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>
      <h4 className="minigame-title">Link the Pre-Flood Faithful Chain!</h4>
      <p className="minigame-hint">
        Tap the patriarchs in chronological order from <strong>First Man</strong> to{' '}
        <strong>Noah’s Father</strong>:
      </p>

      <div className="chain-slots">
        {ERA1_TARGET.map((_, idx) => {
          const val = placed[idx];
          return (
            <div key={idx} className={`chain-slot ${val ? 'filled' : idx === placed.length ? 'next' : ''}`}>
              <span className="slot-num">{idx + 1}</span>
              <span>{val || 'Tap next...'}</span>
            </div>
          );
        })}
      </div>

      <div className="tap-tiles-row">
        {ERA1_POOL.map((name) => {
          const used = placed.includes(name);
          const isWrong = wrongName === name;
          return (
            <button
              key={name}
              type="button"
              disabled={used}
              className={`tap-tile ${used ? 'used' : ''} ${isWrong ? 'shake-wrong' : ''}`}
              onClick={() => handleTap(name)}
            >
              {name}
            </button>
          );
        })}
      </div>

      {solved && (
        <div className="minigame-win">
          <CheckCircle2 size={18} />
          <span>Chain Forged! Adam → Seth → Enoch → Methuselah → Lamech (+50 XP)</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- ERA 2: Match Nations to Their Forefather ---------------- */
const ERA2_ITEMS = [
  { nation: 'Egyptians', answer: 'Ham', clue: 'From Mizraim, son of Ham' },
  { nation: 'Assyrians', answer: 'Shem', clue: 'From Asshur, son of Shem' },
  { nation: 'Greeks', answer: 'Japheth', clue: 'From Javan, son of Japheth' },
  { nation: 'Hebrews', answer: 'Shem', clue: 'From Eber, great-grandson of Shem' },
];
const ERA2_BUCKETS = ['Shem', 'Ham', 'Japheth'];

function Era2NationsGame({ onSolve }) {
  const [step, setStep] = useState(0);
  const [results, setResults] = useState([]);
  const [wrongBucket, setWrongBucket] = useState(null);
  const solved = step >= ERA2_ITEMS.length;
  const current = ERA2_ITEMS[step];

  const handlePick = (bucket) => {
    if (solved) return;
    if (bucket === current.answer) {
      const nextResults = [...results, current];
      setResults(nextResults);
      setWrongBucket(null);
      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep >= ERA2_ITEMS.length) onSolve();
    } else {
      setWrongBucket(bucket);
      setTimeout(() => setWrongBucket(null), 500);
    }
  };

  return (
    <div className="minigame-card">
      <div className="minigame-header">
        <span className="badge badge-luke3">Era 2 Mini-Game · Table of Nations</span>
        <span className="minigame-counter">
          {Math.min(step, ERA2_ITEMS.length)}/{ERA2_ITEMS.length} Mapped
        </span>
      </div>
      <h4 className="minigame-title">Which Son of Noah Founded Each Nation?</h4>

      {!solved ? (
        <>
          <div className="sort-active-card">
            <span className="sort-card-label">Ancient Nation</span>
            <strong className="sort-card-name">{current.nation}</strong>
          </div>
          <div className="bucket-grid">
            {ERA2_BUCKETS.map((b) => (
              <button
                key={b}
                type="button"
                className={`bucket-btn ${wrongBucket === b ? 'shake-wrong' : ''}`}
                onClick={() => handlePick(b)}
              >
                <span className="bucket-title">{b}</span>
                <span className="bucket-sub">Son of Noah</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="minigame-win">
          <CheckCircle2 size={18} />
          <span>Table of Nations Mastered! All 4 ancient peoples matched (+50 XP)</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="solved-chips">
          {results.map((r) => (
            <span key={r.nation} className="badge badge-slate">
              {r.nation} → {r.answer}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- ERA 3: Narrow the Covenant Choice Game ---------------- */
const ERA3_ROUNDS = [
  {
    generation: 'Generation 1 · Sons of Abraham',
    prompt: 'Who was miraculously born to Sarah as the covenant child of promise?',
    left: { name: 'Ishmael', tag: 'Firstborn via Hagar' },
    right: { name: 'Isaac', tag: 'Born when Sarah was 90' },
    correct: 'Isaac',
    fact: 'Genesis 26:3 — Jehovah confirmed the Abrahamic oath directly to Isaac!',
  },
  {
    generation: 'Generation 2 · Twin Sons of Isaac & Rebekah',
    prompt: 'Who valued the sacred birthright and was renamed Israel?',
    left: { name: 'Jacob', tag: '“Contender With God”' },
    right: { name: 'Esau', tag: 'Ancestor of Edomites' },
    correct: 'Jacob',
    fact: 'Genesis 28:14 & 32:28 — Through Jacob’s offspring all families would be blessed!',
  },
  {
    generation: 'Generation 3 · Sons of Jacob (Israel)',
    prompt: 'Which son received the Genesis 49:10 prophecy of the royal scepter?',
    left: { name: 'Reuben', tag: 'Firstborn of Leah' },
    right: { name: 'Judah', tag: 'Fourth son of Leah' },
    correct: 'Judah',
    fact: 'Genesis 49:10 — “The scepter will not depart from Judah until Shiloh comes!”',
  },
];

function Era3HeirGame({ onSolve }) {
  const [round, setRound] = useState(0);
  const [wrongSide, setWrongSide] = useState(null);
  const [clearedFacts, setClearedFacts] = useState([]);
  const solved = round >= ERA3_ROUNDS.length;
  const cur = ERA3_ROUNDS[round];

  const pick = (name) => {
    if (solved) return;
    if (name === cur.correct) {
      setClearedFacts((prev) => [...prev, cur.fact]);
      setWrongSide(null);
      const next = round + 1;
      setRound(next);
      if (next >= ERA3_ROUNDS.length) onSolve();
    } else {
      setWrongSide(name);
      setTimeout(() => setWrongSide(null), 500);
    }
  };

  return (
    <div className="minigame-card">
      <div className="minigame-header">
        <span className="badge badge-gold">Era 3 Mini-Game · Narrow the Promise</span>
        <span className="minigame-counter">
          {Math.min(round, ERA3_ROUNDS.length)}/{ERA3_ROUNDS.length} Chosen
        </span>
      </div>
      <h4 className="minigame-title">Tap the Chosen Heir of the Covenant</h4>

      {!solved ? (
        <>
          <p className="minigame-hint">
            <strong>{cur.generation}:</strong> {cur.prompt}
          </p>
          <div className="versus-grid">
            {[cur.left, cur.right].map((choice) => (
              <button
                key={choice.name}
                type="button"
                className={`versus-card ${wrongSide === choice.name ? 'shake-wrong' : ''}`}
                onClick={() => pick(choice.name)}
              >
                <strong className="versus-name">{choice.name}</strong>
                <span className="versus-tag">{choice.tag}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="minigame-win">
          <CheckCircle2 size={18} />
          <span>Covenant Path Unlocked: Abraham → Isaac → Jacob → Judah (+50 XP)</span>
        </div>
      )}

      {clearedFacts.length > 0 && (
        <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {clearedFacts.map((f, i) => (
            <div key={i} style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
              ✓ {f}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- ERA 4: Women of Faith Matching ---------------- */
const ERA4_PAIRS = [
  {
    name: 'Rahab',
    clue: 'Hid the Israelite spies in Jericho and married Salma of Judah',
  },
  {
    name: 'Ruth',
    clue: 'Loyal Moabitess who told Naomi “Your God will be my God” and married Boaz in Bethlehem',
  },
  {
    name: 'Tamar',
    clue: 'Mother of Judah’s twin son Perez, highlighted in Matthew 1:3',
  },
];

function Era4FaithWomenGame({ onSolve }) {
  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState(null);
  const solved = step >= ERA4_PAIRS.length;
  const cur = ERA4_PAIRS[step];

  const handlePick = (name) => {
    if (solved) return;
    if (name === cur.name) {
      setWrong(null);
      const next = step + 1;
      setStep(next);
      if (next >= ERA4_PAIRS.length) onSolve();
    } else {
      setWrong(name);
      setTimeout(() => setWrong(null), 500);
    }
  };

  return (
    <div className="minigame-card">
      <div className="minigame-header">
        <span className="badge badge-spine">Era 4 Mini-Game · Faith Spotlight</span>
        <span className="minigame-counter">
          {Math.min(step, ERA4_PAIRS.length)}/{ERA4_PAIRS.length} Matched
        </span>
      </div>
      <h4 className="minigame-title">Identify the Remarkable Women in Judah’s Line</h4>

      {!solved ? (
        <>
          <div className="sort-active-card">
            <span className="sort-card-label">Scriptural Clue</span>
            <p style={{ margin: '0.3rem 0 0', fontWeight: 600, color: 'var(--slate-teal)', fontSize: '0.95rem' }}>
              “{cur.clue}”
            </p>
          </div>
          <div className="bucket-grid">
            {['Tamar', 'Rahab', 'Ruth'].map((name) => (
              <button
                key={name}
                type="button"
                className={`bucket-btn ${wrong === name ? 'shake-wrong' : ''}`}
                onClick={() => handlePick(name)}
              >
                <span className="bucket-title">{name}</span>
                <span className="bucket-sub">Matthew 1 Ancestress</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="minigame-win">
          <CheckCircle2 size={18} />
          <span>All 3 Faith Heroines Recognized! Tamar, Rahab &amp; Ruth (+50 XP)</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- ERA 5: Sort Matthew 1 (Legal) vs Luke 3 (Natural) ---------------- */
const ERA5_CARDS = [
  { name: 'Solomon', desc: 'Wise temple-building king', branch: 'matthew1' },
  { name: 'Nathan', desc: 'Non-reigning son of David & Bath-sheba', branch: 'luke3' },
  { name: 'Hezekiah', desc: 'Faithful reformer king of Judah', branch: 'matthew1' },
  { name: 'Mary', desc: 'Natural mother of Jesus via Heli', branch: 'luke3' },
  { name: 'Joseph', desc: 'Adoptive father giving legal throne title', branch: 'matthew1' },
];

function Era5BranchSortGame({ onSolve }) {
  const [idx, setIdx] = useState(0);
  const [wrong, setWrong] = useState(null);
  const solved = idx >= ERA5_CARDS.length;
  const cur = ERA5_CARDS[idx];

  const handleSort = (branch) => {
    if (solved) return;
    if (branch === cur.branch) {
      setWrong(null);
      const next = idx + 1;
      setIdx(next);
      if (next >= ERA5_CARDS.length) onSolve();
    } else {
      setWrong(branch);
      setTimeout(() => setWrong(null), 500);
    }
  };

  return (
    <div className="minigame-card">
      <div className="minigame-header">
        <span className="badge badge-matthew1">Era 5 Mini-Game · Dual Royal Branches</span>
        <span className="minigame-counter">
          {Math.min(idx, ERA5_CARDS.length)}/{ERA5_CARDS.length} Sorted
        </span>
      </div>
      <h4 className="minigame-title">Sort Into Matthew 1 (Legal) vs. Luke 3 (Natural)</h4>

      {!solved ? (
        <>
          <div className="sort-active-card">
            <strong className="sort-card-name">{cur.name}</strong>
            <span className="sort-card-label" style={{ marginTop: 4 }}>{cur.desc}</span>
          </div>
          <div className="versus-grid">
            <button
              type="button"
              className={`versus-card branch-pick-matt ${wrong === 'matthew1' ? 'shake-wrong' : ''}`}
              onClick={() => handleSort('matthew1')}
            >
              <GitBranch size={17} />
              <strong className="versus-name">Matthew 1</strong>
              <span className="versus-tag">Legal Line via Solomon</span>
            </button>
            <button
              type="button"
              className={`versus-card branch-pick-luke ${wrong === 'luke3' ? 'shake-wrong' : ''}`}
              onClick={() => handleSort('luke3')}
            >
              <GitBranch size={17} />
              <strong className="versus-name">Luke 3</strong>
              <span className="versus-tag">Natural Line via Nathan</span>
            </button>
          </div>
        </>
      ) : (
        <div className="minigame-win">
          <CheckCircle2 size={18} />
          <span>Both Davidic Streams Mastered! Solomon → Joseph &amp; Nathan → Mary (+50 XP)</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- ERA 6: Crack Daniel's 69-Weeks Countdown ---------------- */
const ERA6_STEPS = [
  {
    prompt: 'Step 1: In what year did Artaxerxes issue the decree to rebuild Jerusalem’s walls?',
    options: ['607 B.C.E.', '537 B.C.E.', '455 B.C.E.'],
    answer: '455 B.C.E.',
    milestone: '455 B.C.E. (Start)',
  },
  {
    prompt: 'Step 2: How many literal years equal 69 prophetic “weeks” (69 × 7)?',
    options: ['430 years', '483 years', '490 years'],
    answer: '483 years',
    milestone: '+ 483 Years',
  },
  {
    prompt: 'Step 3: Crossing from 1 B.C.E. directly to 1 C.E. (NO zero year!), where does 455 B.C.E. + 483 years land?',
    options: ['28 C.E.', '29 C.E.', '33 C.E.'],
    answer: '29 C.E.',
    milestone: '= 29 C.E. (Messiah!)',
  },
];

function Era6DanielCodeGame({ onSolve }) {
  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState(null);
  const solved = step >= ERA6_STEPS.length;
  const cur = ERA6_STEPS[step];

  const handlePick = (opt) => {
    if (solved) return;
    if (opt === cur.answer) {
      setWrong(null);
      const next = step + 1;
      setStep(next);
      if (next >= ERA6_STEPS.length) onSolve();
    } else {
      setWrong(opt);
      setTimeout(() => setWrong(null), 500);
    }
  };

  return (
    <div className="minigame-card">
      <div className="minigame-header">
        <span className="badge badge-gold">Era 6 Mini-Game · Prophetic Codebreaker</span>
        <span className="minigame-counter">
          {Math.min(step, ERA6_STEPS.length)}/{ERA6_STEPS.length} Cracked
        </span>
      </div>
      <h4 className="minigame-title">Crack Daniel 9:25’s 69-Weeks Countdown!</h4>

      <div className="chain-slots" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {ERA6_STEPS.map((s, i) => (
          <div key={i} className={`chain-slot ${i < step ? 'filled' : i === step ? 'next' : ''}`}>
            <span className="slot-num">{i + 1}</span>
            <span>{i < step ? s.milestone : 'Locked'}</span>
          </div>
        ))}
      </div>

      {!solved ? (
        <>
          <p className="minigame-hint">{cur.prompt}</p>
          <div className="tap-tiles-row">
            {cur.options.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`tap-tile ${wrong === opt ? 'shake-wrong' : ''}`}
                onClick={() => handlePick(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="minigame-win">
          <CheckCircle2 size={18} />
          <span>Code Cracked! 455 B.C.E. + 483 yrs (no year 0) = Fall 29 C.E. (+50 XP)</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- ERA 7: Unite the Three Keys of the Promised Offspring ---------------- */
const ERA7_KEYS = [
  {
    id: 'legal',
    title: 'Matthew 1 Legal Key',
    desc: 'David → Solomon → Joseph confers the royal title to David’s throne.',
    color: 'var(--matthew-blue)',
  },
  {
    id: 'natural',
    title: 'Luke 3 Natural Key',
    desc: 'David → Nathan → Mary establishes direct biological descent from David.',
    color: 'var(--luke-teal)',
  },
  {
    id: 'timing',
    title: 'Daniel 9:25 Timing Key',
    desc: 'Baptism in Fall 29 C.E. fulfills the 69 prophetic weeks to the exact year.',
    color: 'var(--gold-deep)',
  },
];

function Era7FinaleGame({ onSolve }) {
  const [activated, setActivated] = useState([]);
  const solved = activated.length === ERA7_KEYS.length;

  const toggleKey = (id) => {
    if (activated.includes(id)) return;
    const next = [...activated, id];
    setActivated(next);
    if (next.length === ERA7_KEYS.length) onSolve();
  };

  return (
    <div className="minigame-card">
      <div className="minigame-header">
        <span className="badge badge-spine">Era 7 Finale · Unite the Credentials</span>
        <span className="minigame-counter">{activated.length}/3 Keys United</span>
      </div>
      <h4 className="minigame-title">Tap All 3 Messianic Keys to Crown the Promised Offspring</h4>
      <p className="minigame-hint">
        Activate each credential that converges uniquely in <strong>Jesus of Nazareth</strong>:
      </p>

      <div className="keys-grid">
        {ERA7_KEYS.map((k) => {
          const active = activated.includes(k.id);
          return (
            <button
              key={k.id}
              type="button"
              className={`messianic-key-card ${active ? 'active' : ''}`}
              onClick={() => toggleKey(k.id)}
            >
              <span className="key-icon" style={{ background: active ? k.color : 'var(--parchment-deep)', color: active ? '#FFFDF9' : k.color }}>
                {active ? <CheckCircle2 size={18} /> : <KeyRound size={18} />}
              </span>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', color: 'var(--slate-teal)', fontSize: '0.9rem' }}>
                  {k.title}
                </strong>
                <span style={{ fontSize: '0.79rem', color: 'var(--ink-secondary)', lineHeight: 1.35, display: 'block', marginTop: 2 }}>
                  {k.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {solved && (
        <div className="minigame-win finale-win">
          <Crown size={20} />
          <span>
            Genesis 3:15 Fulfilled! Legal right, natural descent, and prophetic timing converge in{' '}
            <strong>Jesus Christ</strong>! (+75 XP)
          </span>
          <Sparkles size={18} />
        </div>
      )}
    </div>
  );
}

export default function EraMiniGames({ eraId, alreadySolved, onSolved }) {
  const [justWon, setJustWon] = useState(false);

  const handleSolve = () => {
    setJustWon(true);
    if (!alreadySolved) onSolved(eraId);
  };

  const renderGame = () => {
    switch (eraId) {
      case 'era-1':
        return <Era1ChainGame onSolve={handleSolve} />;
      case 'era-2':
        return <Era2NationsGame onSolve={handleSolve} />;
      case 'era-3':
        return <Era3HeirGame onSolve={handleSolve} />;
      case 'era-4':
        return <Era4FaithWomenGame onSolve={handleSolve} />;
      case 'era-5':
        return <Era5BranchSortGame onSolve={handleSolve} />;
      case 'era-6':
        return <Era6DanielCodeGame onSolve={handleSolve} />;
      case 'era-7':
      default:
        return <Era7FinaleGame onSolve={handleSolve} />;
    }
  };

  return (
    <div>
      {renderGame()}
      {(justWon || alreadySolved) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.65rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ArrowRight size={13} /> Mini-Game Cleared! Proceed to Boss Check-In below
          </span>
        </div>
      )}
    </div>
  );
}
