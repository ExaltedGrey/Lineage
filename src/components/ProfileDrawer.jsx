import { useEffect } from 'react';
import {
  X,
  ExternalLink,
  Calendar,
  BookOpen,
  Users,
  Compass,
  Clock,
  Heart,
  GitBranch,
  ArrowUpRight,
} from 'lucide-react';
import {
  NODES_BY_ID,
  BRANCH_LABELS,
  CATEGORY_CONFIG,
  ERA_LABELS,
  getContemporaries,
} from '../utils/dataStore';
import { formatDateRange, formatYearShort } from '../utils/yearUtils';

export default function ProfileDrawer({ node, onClose, onSelectNode, onLocateInExplorer }) {
  useEffect(() => {
    if (!node) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [node, onClose]);

  if (!node) return null;

  const branchInfo = BRANCH_LABELS[node.branch];
  const catInfo = CATEGORY_CONFIG[node.category] || { label: node.category };
  const dateRange = formatDateRange(node.birthYear, node.deathYear, node.lifespan);
  const parents = (node.parents || []).map((id) => NODES_BY_ID[id]).filter(Boolean);
  const spouses = (node.spouses || []).map((id) => NODES_BY_ID[id]).filter(Boolean);
  const children = (node.children || []).map((id) => NODES_BY_ID[id]).filter(Boolean);
  const contemporaries = getContemporaries(node);

  const badgeClass =
    node.branch === 'matthew1'
      ? 'badge-matthew1'
      : node.branch === 'luke3'
      ? 'badge-luke3'
      : node.isMessianic
      ? 'badge-spine'
      : node.category === 'prophecies' || node.category === 'judges-priests'
      ? 'badge-gold'
      : 'badge-slate';

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside
        className="profile-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-node-title"
      >
        <div className="drawer-header">
          <div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span className={`badge ${badgeClass}`} style={{ background: 'rgba(255,255,255,0.14)', color: '#F7E7C0', borderColor: 'rgba(247,231,192,0.35)' }}>
                <GitBranch size={12} />
                {branchInfo ? branchInfo.label : catInfo.label}
              </span>
              {ERA_LABELS[node.era] && (
                <span className="badge" style={{ background: 'rgba(0,0,0,0.22)', color: '#D3E1EA', borderColor: 'rgba(255,255,255,0.14)' }}>
                  {ERA_LABELS[node.era]}
                </span>
              )}
            </div>
            <h2 id="drawer-node-title" className="drawer-title">
              {node.name}
            </h2>
            <p className="drawer-role">{node.role}</p>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close Insight profile"
          >
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {dateRange && (
            <div className="drawer-date-strip">
              <Calendar size={17} />
              <span>{dateRange}</span>
            </div>
          )}

          <section>
            <h3 className="drawer-section-label">Insight Overview</h3>
            <p className="drawer-summary">{node.summary}</p>
          </section>

          {node.scriptures && node.scriptures.length > 0 && (
            <section>
              <h3 className="drawer-section-label">
                <BookOpen size={12} style={{ verticalAlign: '-1px', marginRight: 5 }} />
                Key Scriptures
              </h3>
              <div className="chip-group">
                {node.scriptures.map((ref) => (
                  <span key={ref} className="badge badge-gold">
                    {ref}
                  </span>
                ))}
              </div>
            </section>
          )}

          {(parents.length > 0 || spouses.length > 0 || children.length > 0) && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {parents.length > 0 && (
                <div>
                  <h3 className="drawer-section-label">
                    <Users size={12} style={{ verticalAlign: '-1px', marginRight: 5 }} />
                    Parents / Lineage Origin
                  </h3>
                  <div className="chip-group">
                    {parents.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="rel-chip"
                        onClick={() => onSelectNode(p)}
                      >
                        <span>{p.name}</span>
                        <ArrowUpRight size={13} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {spouses.length > 0 && (
                <div>
                  <h3 className="drawer-section-label">
                    <Heart size={12} style={{ verticalAlign: '-1px', marginRight: 5 }} />
                    Spouse / Union
                  </h3>
                  <div className="chip-group">
                    {spouses.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="rel-chip"
                        onClick={() => onSelectNode(s)}
                      >
                        <span>{s.name}</span>
                        <ArrowUpRight size={13} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {children.length > 0 && (
                <div>
                  <h3 className="drawer-section-label">
                    <GitBranch size={12} style={{ verticalAlign: '-1px', marginRight: 5 }} />
                    Children &amp; Descendants ({children.length})
                  </h3>
                  <div className="chip-group">
                    {children.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="rel-chip"
                        onClick={() => onSelectNode(c)}
                      >
                        <span>{c.name}</span>
                        <ArrowUpRight size={13} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {contemporaries.length > 0 && (
            <section>
              <h3 className="drawer-section-label">
                <Clock size={12} style={{ verticalAlign: '-1px', marginRight: 5 }} />
                Dated Contemporaries ({contemporaries.length})
              </h3>
              <div className="contemp-list">
                {contemporaries.slice(0, 10).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="contemp-item"
                    onClick={() => item.node && onSelectNode(item.node)}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--slate-teal)' }}>
                      {item.name}{' '}
                      <span style={{ fontWeight: 400, color: 'var(--ink-muted)', fontSize: '0.78rem' }}>
                        ({formatYearShort(item.birthYear)} – {formatYearShort(item.deathYear)})
                      </span>
                    </span>
                    <span className="badge badge-spine">{item.overlap} yrs overlap</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="drawer-footer">
          <a
            href={node.jwUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="jw-cta-btn"
          >
            <ExternalLink size={17} />
            <span>Open Insight Page (JW Library / jw.org)</span>
          </a>
          <button
            type="button"
            className="btn"
            style={{ width: '100%' }}
            onClick={() => onLocateInExplorer(node)}
          >
            <Compass size={16} />
            <span>Fly to {node.name} on Lineage Explorer</span>
          </button>
        </div>
      </aside>
    </>
  );
}
