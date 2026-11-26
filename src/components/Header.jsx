import { Compass, Clock, Trophy, ScrollText, Map, Flame, Volume2, VolumeX } from 'lucide-react';
import { DATA_META } from '../utils/dataStore';

const MODES = [
  { id: 'story', label: 'Quest Tour', shortLabel: 'Tour', icon: Map },
  { id: 'explorer', label: 'Lineage Explorer', shortLabel: 'Chart', icon: Compass },
  { id: 'timeline', label: 'B.C.E. Timeline', shortLabel: 'Timeline', icon: Clock },
  { id: 'quiz', label: 'Lineage Challenge', shortLabel: 'Quiz', icon: Trophy },
];

export default function Header({
  activeMode,
  onModeChange,
  xp,
  completedErasCount,
  earnedBadgesCount,
  soundEnabled,
  onToggleSound,
}) {
  return (
    <header className="masthead">
      <div className="masthead-inner">
        <div className="masthead-top-row">
          <button
            type="button"
            className="brand"
            onClick={() => onModeChange('story')}
            aria-label="The Promised Offspring home"
          >
            <span className="brand-crest" aria-hidden="true">
              <ScrollText size={20} strokeWidth={1.8} />
            </span>
            <span>
              <span className="brand-title" style={{ display: 'block' }}>
                The Promised Offspring
              </span>
              <span className="brand-subtitle" style={{ display: 'block' }}>
                Interactive Bible Adventure · {DATA_META.totalNodes} Nodes
              </span>
            </span>
          </button>

          <div className="masthead-stats-mobile">
            <span className="stat-chip stat-chip-compact" title="Explorer XP">
              <Flame size={12} />
              <span>{xp}</span>
            </span>
            <button
              type="button"
              className="sound-toggle-btn"
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
              title={soundEnabled ? 'Sound On' : 'Sound Off'}
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          </div>
        </div>

        <nav className="mode-nav" aria-label="Primary sections">
          {MODES.map(({ id, label, shortLabel, icon: Icon }) => (
            <button
              key={id}
              type="button"
              id={`nav-tab-${id}`}
              className={`mode-tab ${activeMode === id ? 'active' : ''}`}
              onClick={() => onModeChange(id)}
              aria-current={activeMode === id ? 'page' : undefined}
            >
              <Icon size={16} strokeWidth={2} />
              <span className="mode-label-full">{label}</span>
              <span className="mode-label-short">{shortLabel}</span>
            </button>
          ))}
        </nav>

        <div className="masthead-stats">
          <span className="stat-chip" title="Total Quest XP">
            <Flame size={13} />
            <span>{xp} XP</span>
          </span>
          <span className="stat-chip" title="Completed Quest Eras">
            <Map size={13} />
            <span>{completedErasCount}/7 Eras</span>
          </span>
          <span className="stat-chip" title="Earned Archival Badges">
            <Trophy size={13} />
            <span>{earnedBadgesCount} Badges</span>
          </span>
          <button
            type="button"
            className="sound-toggle-btn"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            title={soundEnabled ? 'Sound Effects On' : 'Sound Effects Off'}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>
    </header>
  );
}
