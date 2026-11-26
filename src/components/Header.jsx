import { BookOpen, Compass, Clock, Trophy, ScrollText } from 'lucide-react';
import { DATA_META } from '../utils/dataStore';

const MODES = [
  { id: 'story', label: 'Story Journey', shortLabel: 'Story', icon: BookOpen },
  { id: 'explorer', label: 'Lineage Explorer', shortLabel: 'Explorer', icon: Compass },
  { id: 'timeline', label: 'B.C.E. Timeline', shortLabel: 'Timeline', icon: Clock },
  { id: 'quiz', label: 'Lineage Challenge', shortLabel: 'Quiz', icon: Trophy },
];

export default function Header({ activeMode, onModeChange, completedErasCount, earnedBadgesCount }) {
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
                Genesis 3:15 · {DATA_META.totalNodes} Interactive Biblical Nodes
              </span>
            </span>
          </button>

          <div className="masthead-stats-mobile">
            <span className="stat-chip stat-chip-compact" title="Completed Story Eras">
              <BookOpen size={12} />
              <span>{completedErasCount}/7</span>
            </span>
            <span className="stat-chip stat-chip-compact" title="Earned Archival Badges">
              <Trophy size={12} />
              <span>{earnedBadgesCount}</span>
            </span>
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
          <span className="stat-chip" title="Completed Story Eras">
            <BookOpen size={13} />
            <span>{completedErasCount}/7 Eras</span>
          </span>
          <span className="stat-chip" title="Earned Archival Badges">
            <Trophy size={13} />
            <span>{earnedBadgesCount} Badges</span>
          </span>
        </div>
      </div>
    </header>
  );
}
