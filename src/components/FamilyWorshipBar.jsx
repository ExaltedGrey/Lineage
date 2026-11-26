import { useState } from 'react';
import { Users, Plus, X, RotateCcw, Star, ArrowRight, Sparkles } from 'lucide-react';

export default function FamilyWorshipBar({
  familyState,
  onToggleEnabled,
  onAddPlayer,
  onRemovePlayer,
  onNextTurn,
  onResetScores,
  onSetPreset,
}) {
  const [nameInput, setNameInput] = useState('');
  const { enabled, players, turnIndex } = familyState;
  const activePlayer = players[turnIndex] || players[0];

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    onAddPlayer(trimmed);
    setNameInput('');
  };

  if (!enabled) {
    return (
      <div className="family-bar-collapsed">
        <div className="family-bar-collapsed-copy">
          <span className="family-bar-icon">
            <Users size={17} />
          </span>
          <div>
            <strong style={{ display: 'block', color: 'var(--slate-teal)', fontSize: '0.9rem' }}>
              Family Worship Night Mode
            </strong>
            <span style={{ fontSize: '0.79rem', color: 'var(--ink-secondary)' }}>
              Take turns around the room, track family stars, and discuss Bible questions together!
            </span>
          </div>
        </div>
        <button type="button" className="btn btn-gold" onClick={onToggleEnabled}>
          <Sparkles size={15} />
          <span>Play Together</span>
        </button>
      </div>
    );
  }

  return (
    <section className="family-bar-active" aria-label="Family Worship Pass-and-Play Scoreboard">
      <div className="family-bar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
          <span className="badge badge-gold">
            <Users size={12} /> Family Worship Mode
          </span>
          {activePlayer && (
            <span className="family-turn-callout">
              ⭐ {activePlayer.name}’s Turn!
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {players.length > 1 && (
            <button
              type="button"
              className="btn"
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.76rem' }}
              onClick={onNextTurn}
            >
              <span>Next Turn</span>
              <ArrowRight size={13} />
            </button>
          )}
          <button
            type="button"
            className="btn"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.76rem' }}
            onClick={onResetScores}
            title="Reset family scores for a new evening"
          >
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            className="btn"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.76rem' }}
            onClick={onToggleEnabled}
            title="Hide Family Worship Mode"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Player Score Chips */}
      <div className="family-players-row">
        {players.map((p, idx) => {
          const isTurn = idx === turnIndex;
          return (
            <div key={p.id} className={`family-player-chip ${isTurn ? 'current' : ''}`}>
              <span className="family-player-name">{p.name}</span>
              <span className="family-player-score">
                <Star size={12} fill="currentColor" /> {p.score}
              </span>
              {players.length > 2 && (
                <button
                  type="button"
                  className="family-remove-btn"
                  onClick={() => onRemovePlayer(p.id)}
                  aria-label={`Remove ${p.name}`}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Add Player & Presets */}
      <div className="family-controls-row">
        <form onSubmit={handleAdd} className="family-add-form">
          <input
            type="text"
            className="family-name-input"
            placeholder="Add family member name..."
            maxLength={18}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            disabled={players.length >= 6}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0.36rem 0.7rem', fontSize: '0.78rem' }}
            disabled={!nameInput.trim() || players.length >= 6}
          >
            <Plus size={14} /> Add
          </button>
        </form>

        <div className="family-presets">
          <button
            type="button"
            className="quick-jump-btn"
            onClick={() => onSetPreset(['Kids Team', 'Parents Team'])}
          >
            Kids vs. Parents
          </button>
          <button
            type="button"
            className="quick-jump-btn"
            onClick={() => onSetPreset(['Mom', 'Dad', 'Kids'])}
          >
            Mom · Dad · Kids
          </button>
        </div>
      </div>
    </section>
  );
}
