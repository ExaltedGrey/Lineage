import { useState } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  GitBranch,
  Crown,
  KeyRound,
  Lightbulb,
} from 'lucide-react';
import { playCorrectSound, playWrongSound, playFanfareSound } from '../utils/soundEffects';
import { ConfettiBurst } from './QuestIllustrations';

/**
 * 7 Bespoke Kid-Friendly, Scripturally Accurate Interactive Mini-Games
 * Every game shows exact Bible references/dates and gives gentle learning hints on misses.
 */

/* ---------------- ERA 1: Chronological Pre-Flood Timeline Order ---------------- */
const ERA1_TARGET = [
  { name: 'Adam', year: '4026 B.C.E.', hint: 'Who was the very first human created in Eden (4026 B.C.E.)?' },
  { name: 'Seth', year: '3896 B.C.E.', hint: 'Who was born to Adam and Eve in place of Abel (Genesis 4:25)?' },
  { name: 'Enoch', year: '3404 B.C.E.', hint: 'Who was the seventh in line from Adam and “walked with the true God”?' },
  { name: 'Methuselah', year: '3339 B.C.E.', hint: 'Who was Enoch’s son and lived 969 years—the longest in the Bible?' },
  { name: 'Noah', year: '2970 B.C.E.', hint: 'Who built the ark and survived the Global Flood of 2370 B.C.E.?' },
];
const ERA1_POOL = ['Methuselah', 'Seth', 'Noah', 'Adam', 'Enoch'];

function Era1ChainGame({ soundEnabled, onSolve }) {
  const [placed, setPlaced] = useState([]);
  const [wrongName, setWrongName] = useState(null);
  const [hintText, setHintText] = useState('');
  const solved = placed.length === ERA1_TARGET.length;

  const handleTap = (name) => {
    if (solved || placed.some((p) => p.name === name)) return;
    const expected = ERA1_TARGET[placed.length];
    if (name === expected.name) {
      const next = [...placed, expected];
      setPlaced(next);
      setWrongName(null);
      setHintText('');
      if (next.length === ERA1_TARGET.length) {
        playFanfareSound(soundEnabled);
        onSolve();
      } else {
        playCorrectSound(soundEnabled);
      }
    } else {
      playWrongSound(soundEnabled);
      setWrongName(name);
      setHintText(expected.hint);
      setTimeout(() => setWrongName(null), 500);
    }
  };

  return (
    <div className="minigame-card">
      <ConfettiBurst active={solved} />
      <div className="minigame-header">
        <span className="badge badge-gold">Era 1 Game · Pre-Flood Time Order</span>
        <button
          type="button"
          className="btn"
          style={{ padding: '0.28rem 0.6rem', fontSize: '0.76rem' }}
          onClick={() => {
            setPlaced([]);
            setHintText('');
          }}
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>
      <h4 className="minigame-title">Order These 5 Pre-Flood Heroes (Earliest to Latest!)</h4>
      <p className="minigame-hint">
        Tap each person in chronological order by birth year along Genesis chapter 5:
      </p>

      <div className="chain-slots">
        {ERA1_TARGET.map((_, idx) => {
          const item = placed[idx];
          return (
            <div key={idx} className={`chain-slot ${item ? 'filled' : idx === placed.length ? 'next' : ''}`}>
              <span className="slot-num">{idx + 1}</span>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span>{item ? item.name : 'Tap next...'}</span>
                {item && <small style={{ fontSize: '0.68rem', opacity: 0.85 }}>{item.year}</small>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="tap-tiles-row">
        {ERA1_POOL.map((name) => {
          const used = placed.some((p) => p.name === name);
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

      {hintText && !solved && (
        <div className="minigame-hint-box">
          <Lightbulb size={15} />
          <span><strong>Pip’s Hint:</strong> {hintText}</span>
        </div>
      )}

      {solved && (
        <div className="minigame-win">
          <CheckCircle2 size={18} />
          <span>Awesome! Adam (4026) → Seth (3896) → Enoch (3404) → Methuselah (3339) → Noah (2970 B.C.E.)! (+50 XP)</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- ERA 2: Match Nations to Noah's Sons (Genesis 10) ---------------- */
const ERA2_ITEMS = [
  { nation: 'Egyptians', answer: 'Ham', clue: 'Hint: Egypt came from Mizraim, a son of Ham (Genesis 10:6).' },
  { nation: 'Assyrians', answer: 'Shem', clue: 'Hint: Assyria came from Asshur, a son of Shem (Genesis 10:22).' },
  { nation: 'Greeks', answer: 'Japheth', clue: 'Hint: Greece came from Javan, a son of Japheth (Genesis 10:2).' },
  { nation: 'Hebrews', answer: 'Shem', clue: 'Hint: The Hebrews descended from Eber, great-grandson of Shem (Genesis 10:21; 11:10-14).' },
];
const ERA2_BUCKETS = [
  { name: 'Shem', sub: 'Line of Promise (Gen 9:26)' },
  { name: 'Ham', sub: 'Africa & Canaan' },
  { name: 'Japheth', sub: 'Europe & Asia Minor' },
];

function Era2NationsGame({ soundEnabled, onSolve }) {
  const [step, setStep] = useState(0);
  const [results, setResults] = useState([]);
  const [wrongBucket, setWrongBucket] = useState(null);
  const [hintText, setHintText] = useState('');
  const solved = step >= ERA2_ITEMS.length;
  const current = ERA2_ITEMS[step];

  const handlePick = (bucketName) => {
    if (solved) return;
    if (bucketName === current.answer) {
      const nextResults = [...results, current];
      setResults(nextResults);
      setWrongBucket(null);
      setHintText('');
      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep >= ERA2_ITEMS.length) {
        playFanfareSound(soundEnabled);
        onSolve();
      } else {
        playCorrectSound(soundEnabled);
      }
    } else {
      playWrongSound(soundEnabled);
      setWrongBucket(bucketName);
      setHintText(current.clue);
      setTimeout(() => setWrongBucket(null), 500);
    }
  };

  return (
    <div className="minigame-card">
      <ConfettiBurst active={solved} />
      <div className="minigame-header">
        <span className="badge badge-luke3">Era 2 Game · Table of Nations (Genesis 10)</span>
        <span className="minigame-counter">
          {Math.min(step, ERA2_ITEMS.length)}/{ERA2_ITEMS.length} Mapped
        </span>
      </div>
      <h4 className="minigame-title">Which Son of Noah Founded Each Ancient Nation?</h4>

      {!solved ? (
        <>
          <div className="sort-active-card">
            <span className="sort-card-label">Ancient Nation</span>
            <strong className="sort-card-name">{current.nation}</strong>
          </div>
          <div className="bucket-grid">
            {ERA2_BUCKETS.map((b) => (
              <button
                key={b.name}
                type="button"
                className={`bucket-btn ${wrongBucket === b.name ? 'shake-wrong' : ''}`}
                onClick={() => handlePick(b.name)}
              >
                <span className="bucket-title">{b.name}</span>
                <span className="bucket-sub">{b.sub}</span>
              </button>
            ))}
          </div>
          {hintText && (
            <div className="minigame-hint-box">
              <Lightbulb size={15} />
              <span><strong>Pip’s Hint:</strong> {hintText}</span>
            </div>
          )}
        </>
      ) : (
        <div className="minigame-win">
          <CheckCircle2 size={18} />
          <span>Table of Nations Mastered! Every family on earth traces back to Noah’s 3 sons (+50 XP)</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="solved-chips">
          {results.map((r) => (
            <span key={r.nation} className="badge badge-slate">
              ✓ {r.nation} → {r.answer}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- ERA 3: Tap the Chosen Covenant Heir ---------------- */
const ERA3_ROUNDS = [
  {
    generation: 'Round 1 · Sons of Abraham',
    prompt: 'Who was miraculously born to Sarah at age 90 as the promised heir?',
    left: { name: 'Ishmael', tag: 'Firstborn via Hagar' },
    right: { name: 'Isaac', tag: 'Child of Promise (1918 B.C.E.)' },
    correct: 'Isaac',
    hint: 'Check Genesis 26:3 — Jehovah confirmed the covenant specifically through Sarah’s son!',
    fact: 'Genesis 26:3 — Jehovah confirmed the Abrahamic oath directly to Isaac!',
  },
  {
    generation: 'Round 2 · Twin Sons of Isaac & Rebekah',
    prompt: 'Who valued the sacred birthright and was renamed Israel?',
    left: { name: 'Jacob', tag: 'Renamed “Israel” (Gen 32:28)' },
    right: { name: 'Esau', tag: 'Ancestor of the Edomites' },
    correct: 'Jacob',
    hint: 'Esau traded away his birthright for stew, while his twin brother wrestled an angel for a blessing!',
    fact: 'Genesis 28:14 — Through Jacob’s offspring all families of the ground would be blessed!',
  },
  {
    generation: 'Round 3 · Sons of Jacob (Israel)',
    prompt: 'Which son received the Genesis 49:10 prophecy of the royal scepter?',
    left: { name: 'Reuben', tag: 'Firstborn son of Leah' },
    right: { name: 'Judah', tag: 'Fourth son of Leah' },
    correct: 'Judah',
    hint: 'Read Genesis 49:10 — “The scepter will not depart from Judah until Shiloh comes!”',
    fact: 'Genesis 49:10 — The royal Messianic line narrowed to the tribe of Judah!',
  },
];

function Era3HeirGame({ soundEnabled, onSolve }) {
  const [round, setRound] = useState(0);
  const [wrongSide, setWrongSide] = useState(null);
  const [hintText, setHintText] = useState('');
  const [clearedFacts, setClearedFacts] = useState([]);
  const solved = round >= ERA3_ROUNDS.length;
  const cur = ERA3_ROUNDS[round];

  const pick = (name) => {
    if (solved) return;
    if (name === cur.correct) {
      setClearedFacts((prev) => [...prev, cur.fact]);
      setWrongSide(null);
      setHintText('');
      const next = round + 1;
      setRound(next);
      if (next >= ERA3_ROUNDS.length) {
        playFanfareSound(soundEnabled);
        onSolve();
      } else {
        playCorrectSound(soundEnabled);
      }
    } else {
      playWrongSound(soundEnabled);
      setWrongSide(name);
      setHintText(cur.hint);
      setTimeout(() => setWrongSide(null), 500);
    }
  };

  return (
    <div className="minigame-card">
      <ConfettiBurst active={solved} />
      <div className="minigame-header">
        <span className="badge badge-gold">Era 3 Game · Narrow the Promise</span>
        <span className="minigame-counter">
          {Math.min(round, ERA3_ROUNDS.length)}/{ERA3_ROUNDS.length} Chosen
        </span>
      </div>
      <h4 className="minigame-title">Tap Who Carries the Covenant Forward!</h4>

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
          {hintText && (
            <div className="minigame-hint-box">
              <Lightbulb size={15} />
              <span><strong>Pip’s Hint:</strong> {hintText}</span>
            </div>
          )}
        </>
      ) : (
        <div className="minigame-win">
          <CheckCircle2 size={18} />
          <span>Bullseye! Abraham → Isaac → Jacob (Israel) → Judah! (+50 XP)</span>
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

/* ---------------- ERA 4: Women of Faith in Matthew 1 ---------------- */
const ERA4_PAIRS = [
  {
    name: 'Rahab',
    clue: 'Hid the two Israelite spies in Jericho, married Salmon (Salma), and became King David’s ancestress (Joshua 2; Matthew 1:5).',
    hint: 'Think of the faithful woman in Jericho who hung a scarlet cord from her window!',
  },
  {
    name: 'Ruth',
    clue: 'Loyal Moabitess who told Naomi “Your God will be my God,” married Boaz in Bethlehem, and became David’s great-grandmother (Ruth 4:13-22).',
    hint: 'She gleaned barley in Boaz’s field in Bethlehem and has her own Bible book!',
  },
  {
    name: 'Tamar',
    clue: 'Mother of Judah’s twin son Perez, highlighted in Matthew 1:3 as preserving the royal line of Judah.',
    hint: 'Look at Genesis 38 and Matthew 1:3 — mother of Perez and Zerah!',
  },
];

function Era4FaithWomenGame({ soundEnabled, onSolve }) {
  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState(null);
  const [hintText, setHintText] = useState('');
  const solved = step >= ERA4_PAIRS.length;
  const cur = ERA4_PAIRS[step];

  const handlePick = (name) => {
    if (solved) return;
    if (name === cur.name) {
      setWrong(null);
      setHintText('');
      const next = step + 1;
      setStep(next);
      if (next >= ERA4_PAIRS.length) {
        playFanfareSound(soundEnabled);
        onSolve();
      } else {
        playCorrectSound(soundEnabled);
      }
    } else {
      playWrongSound(soundEnabled);
      setWrong(name);
      setHintText(cur.hint);
      setTimeout(() => setWrong(null), 500);
    }
  };

  return (
    <div className="minigame-card">
      <ConfettiBurst active={solved} />
      <div className="minigame-header">
        <span className="badge badge-spine">Era 4 Game · Heroines of Faith</span>
        <span className="minigame-counter">
          {Math.min(step, ERA4_PAIRS.length)}/{ERA4_PAIRS.length} Matched
        </span>
      </div>
      <h4 className="minigame-title">Who Is This Brave Woman in Jesus’ Family Tree?</h4>

      {!solved ? (
        <>
          <div className="sort-active-card">
            <span className="sort-card-label">Bible Clue</span>
            <p style={{ margin: '0.3rem 0 0', fontWeight: 600, color: 'var(--slate-teal)', fontSize: '0.94rem' }}>
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
                <span className="bucket-sub">Matthew 1</span>
              </button>
            ))}
          </div>
          {hintText && (
            <div className="minigame-hint-box">
              <Lightbulb size={15} />
              <span><strong>Pip’s Hint:</strong> {hintText}</span>
            </div>
          )}
        </>
      ) : (
        <div className="minigame-win">
          <CheckCircle2 size={18} />
          <span>Spot On! Jehovah honored faithful women from every background in the Messiah’s lineage (+50 XP)</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- ERA 5: Two Branches of David (Matthew 1 vs Luke 3) ---------------- */
const ERA5_CARDS = [
  {
    name: 'Solomon',
    desc: 'Wise temple-building king of Israel',
    branch: 'matthew1',
    hint: 'Matthew 1:6-7 traces the reigning royal kings through Solomon!',
  },
  {
    name: 'Nathan',
    desc: 'Son of David & Bath-sheba (1 Chronicles 3:5)',
    branch: 'luke3',
    hint: 'Luke 3:31 traces David’s natural bloodline through Solomon’s brother Nathan!',
  },
  {
    name: 'Hezekiah',
    desc: 'Faithful reformer king of Judah',
    branch: 'matthew1',
    hint: 'Hezekiah was a reigning king of Judah, listed in Matthew 1:9-10!',
  },
  {
    name: 'Mary',
    desc: 'Mother of Jesus, daughter of Heli',
    branch: 'luke3',
    hint: 'Luke 3 traces Mary’s biological descent from David through Nathan and Heli!',
  },
  {
    name: 'Joseph',
    desc: 'Adoptive father who gave Jesus the legal throne title',
    branch: 'matthew1',
    hint: 'Matthew 1:16 traces the legal royal succession straight down to Joseph!',
  },
];

function Era5BranchSortGame({ soundEnabled, onSolve }) {
  const [idx, setIdx] = useState(0);
  const [wrong, setWrong] = useState(null);
  const [hintText, setHintText] = useState('');
  const solved = idx >= ERA5_CARDS.length;
  const cur = ERA5_CARDS[idx];

  const handleSort = (branch) => {
    if (solved) return;
    if (branch === cur.branch) {
      setWrong(null);
      setHintText('');
      const next = idx + 1;
      setIdx(next);
      if (next >= ERA5_CARDS.length) {
        playFanfareSound(soundEnabled);
        onSolve();
      } else {
        playCorrectSound(soundEnabled);
      }
    } else {
      playWrongSound(soundEnabled);
      setWrong(branch);
      setHintText(cur.hint);
      setTimeout(() => setWrong(null), 500);
    }
  };

  return (
    <div className="minigame-card">
      <ConfettiBurst active={solved} />
      <div className="minigame-header">
        <span className="badge badge-matthew1">Era 5 Game · Twin Davidic Branches</span>
        <span className="minigame-counter">
          {Math.min(idx, ERA5_CARDS.length)}/{ERA5_CARDS.length} Sorted
        </span>
      </div>
      <h4 className="minigame-title">Sort Into Matthew 1 (Legal) vs. Luke 3 (Natural)!</h4>

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
              <span className="versus-tag">Legal Line (Solomon → Joseph)</span>
            </button>
            <button
              type="button"
              className={`versus-card branch-pick-luke ${wrong === 'luke3' ? 'shake-wrong' : ''}`}
              onClick={() => handleSort('luke3')}
            >
              <GitBranch size={17} />
              <strong className="versus-name">Luke 3</strong>
              <span className="versus-tag">Natural Line (Nathan → Mary)</span>
            </button>
          </div>
          {hintText && (
            <div className="minigame-hint-box">
              <Lightbulb size={15} />
              <span><strong>Pip’s Hint:</strong> {hintText}</span>
            </div>
          )}
        </>
      ) : (
        <div className="minigame-win">
          <CheckCircle2 size={18} />
          <span>Brilliant! Both branches start with David &amp; Bath-sheba and reunite in Jesus (+50 XP)</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- ERA 6: Crack Daniel 9:25's 69-Weeks Code ---------------- */
const ERA6_STEPS = [
  {
    prompt: 'Step 1: In what year did King Artaxerxes order Jerusalem’s walls rebuilt (Nehemiah 2)?',
    options: ['607 B.C.E.', '537 B.C.E.', '455 B.C.E.'],
    answer: '455 B.C.E.',
    hint: '607 B.C.E. was Jerusalem’s destruction; the command to rebuild its walls came in 455 B.C.E.!',
    milestone: '455 B.C.E.',
  },
  {
    prompt: 'Step 2: In prophecy, 1 “week” = 7 years. How many years are 69 “weeks” (69 × 7)?',
    options: ['430 years', '483 years', '490 years'],
    answer: '483 years',
    hint: 'Multiply 69 × 7: (70 × 7 = 490) minus 7 = 483 years!',
    milestone: '+ 483 Yrs',
  },
  {
    prompt: 'Step 3: Count 483 years from 455 B.C.E. (remember: NO Year 0 between 1 B.C.E. and 1 C.E.!):',
    options: ['28 C.E.', '29 C.E.', '33 C.E.'],
    answer: '29 C.E.',
    hint: '455 B.C.E. to 1 B.C.E. = 454 yrs; jump directly to 1 C.E. (+1 = 455 yrs); add 28 more = 29 C.E.!',
    milestone: '= 29 C.E.!',
  },
];

function Era6DanielCodeGame({ soundEnabled, onSolve }) {
  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState(null);
  const [hintText, setHintText] = useState('');
  const solved = step >= ERA6_STEPS.length;
  const cur = ERA6_STEPS[step];

  const handlePick = (opt) => {
    if (solved) return;
    if (opt === cur.answer) {
      setWrong(null);
      setHintText('');
      const next = step + 1;
      setStep(next);
      if (next >= ERA6_STEPS.length) {
        playFanfareSound(soundEnabled);
        onSolve();
      } else {
        playCorrectSound(soundEnabled);
      }
    } else {
      playWrongSound(soundEnabled);
      setWrong(opt);
      setHintText(cur.hint);
      setTimeout(() => setWrong(null), 500);
    }
  };

  return (
    <div className="minigame-card">
      <ConfettiBurst active={solved} />
      <div className="minigame-header">
        <span className="badge badge-gold">Era 6 Game · Bible Math Codebreaker</span>
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
          {hintText && (
            <div className="minigame-hint-box">
              <Lightbulb size={15} />
              <span><strong>Pip’s Hint:</strong> {hintText}</span>
            </div>
          )}
        </>
      ) : (
        <div className="minigame-win">
          <CheckCircle2 size={18} />
          <span>Code Cracked! 455 B.C.E. + 483 years (skipping Year 0!) = Fall 29 C.E.! (+50 XP)</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- ERA 7: Unite the 3 Messianic Keys ---------------- */
const ERA7_KEYS = [
  {
    id: 'legal',
    title: 'Matthew 1 Legal Key',
    desc: 'David → Solomon → Joseph gives Jesus the legal right to David’s throne.',
    color: 'var(--matthew-blue)',
  },
  {
    id: 'natural',
    title: 'Luke 3 Natural Key',
    desc: 'David → Nathan → Mary gives Jesus direct natural descent from David.',
    color: 'var(--luke-teal)',
  },
  {
    id: 'timing',
    title: 'Daniel 9:25 Timing Key',
    desc: 'Baptized in Fall 29 C.E. (at age 30), fulfilling the 69 prophetic weeks to the exact year!',
    color: 'var(--gold-deep)',
  },
];

function Era7FinaleGame({ soundEnabled, onSolve }) {
  const [activated, setActivated] = useState([]);
  const solved = activated.length === ERA7_KEYS.length;

  const toggleKey = (id) => {
    if (activated.includes(id)) return;
    const next = [...activated, id];
    setActivated(next);
    if (next.length === ERA7_KEYS.length) {
      playFanfareSound(soundEnabled);
      onSolve();
    } else {
      playCorrectSound(soundEnabled);
    }
  };

  return (
    <div className="minigame-card">
      <ConfettiBurst active={solved} />
      <div className="minigame-header">
        <span className="badge badge-spine">Era 7 Grand Finale · Unite the 3 Keys</span>
        <span className="minigame-counter">{activated.length}/3 Keys United</span>
      </div>
      <h4 className="minigame-title">Tap All 3 Proof Keys to Crown the Promised Offspring!</h4>
      <p className="minigame-hint">
        Activate every Bible credential that converges uniquely in <strong>Jesus of Nazareth</strong>:
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
              <span
                className="key-icon"
                style={{
                  background: active ? k.color : 'var(--parchment-deep)',
                  color: active ? '#FFFDF9' : k.color,
                }}
              >
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
            Genesis 3:15 Fulfilled! Legal title, natural bloodline, and exact timing all unite in{' '}
            <strong>Jesus Christ</strong>! (+75 XP)
          </span>
          <Sparkles size={18} />
        </div>
      )}
    </div>
  );
}

export default function EraMiniGames({ eraId, alreadySolved, soundEnabled, onSolved }) {
  const [justWon, setJustWon] = useState(false);

  const handleSolve = () => {
    setJustWon(true);
    if (!alreadySolved) onSolved(eraId);
  };

  const renderGame = () => {
    switch (eraId) {
      case 'era-1':
        return <Era1ChainGame soundEnabled={soundEnabled} onSolve={handleSolve} />;
      case 'era-2':
        return <Era2NationsGame soundEnabled={soundEnabled} onSolve={handleSolve} />;
      case 'era-3':
        return <Era3HeirGame soundEnabled={soundEnabled} onSolve={handleSolve} />;
      case 'era-4':
        return <Era4FaithWomenGame soundEnabled={soundEnabled} onSolve={handleSolve} />;
      case 'era-5':
        return <Era5BranchSortGame soundEnabled={soundEnabled} onSolve={handleSolve} />;
      case 'era-6':
        return <Era6DanielCodeGame soundEnabled={soundEnabled} onSolve={handleSolve} />;
      case 'era-7':
      default:
        return <Era7FinaleGame soundEnabled={soundEnabled} onSolve={handleSolve} />;
    }
  };

  return (
    <div>
      {renderGame()}
      {(justWon || alreadySolved) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.65rem' }}>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--success)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ArrowRight size={13} /> Mini-Game Cleared! Ready for the Era Check-In
          </span>
        </div>
      )}
    </div>
  );
}
