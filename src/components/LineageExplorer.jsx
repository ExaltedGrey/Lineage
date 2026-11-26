import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  GitBranch,
  X,
  Crosshair,
} from 'lucide-react';
import {
  ALL_NODES,
  ALL_EDGES,
  NODES_BY_ID,
  DATA_META,
  CATEGORY_CONFIG,
  searchNodes,
} from '../utils/dataStore';
import { formatYearShort } from '../utils/yearUtils';

const FILTER_KEYS = [
  'all',
  'line-to-jesus',
  'origin-of-nations',
  'patriarchs',
  'tribes',
  'judges-priests',
  'prophecies',
];

const ERA_BANDS = [
  { label: 'ERA I · EDEN & PRE-FLOOD (4026–2370 B.C.E.)', y: 120, h: 270, fill: 'rgba(139, 38, 53, 0.035)' },
  { label: 'ERA II · FLOOD & ORIGIN OF NATIONS (2370–1943 B.C.E.)', y: 390, h: 395, fill: 'rgba(43, 110, 108, 0.04)' },
  { label: 'ERA III · PATRIARCHS & COVENANT (2018–1711 B.C.E.)', y: 785, h: 555, fill: 'rgba(184, 138, 54, 0.04)' },
  { label: 'ERA IV · TWELVE TRIBES, EXODUS & JUDGES (1728–1117 B.C.E.)', y: 1340, h: 400, fill: 'rgba(27, 54, 71, 0.035)' },
  { label: 'ERA V · HOUSE OF DAVID & DIVIDED KINGDOM (1117–607 B.C.E.)', y: 1740, h: 460, fill: 'rgba(46, 92, 138, 0.035)' },
  { label: 'ERA VI · EXILE, RETURN & 70 WEEKS (607–30 B.C.E.)', y: 2200, h: 200, fill: 'rgba(184, 138, 54, 0.045)' },
  { label: 'ERA VII · THE PROMISED OFFSPRING (2 B.C.E.–29 C.E.)', y: 2400, h: 175, fill: 'rgba(139, 38, 53, 0.055)' },
];

const QUICK_JUMPS = [
  { label: 'Adam', id: 'n619', zoom: 1.35 },
  { label: 'Noah', id: 'n661', zoom: 1.3 },
  { label: 'Abraham', id: 'n671', zoom: 1.3 },
  { label: '12 Tribes', id: 'n736', zoom: 0.9 },
  { label: 'David', id: 'n669', zoom: 1.3 },
  { label: 'Zerubbabel', id: 'n738', zoom: 1.3 },
  { label: 'Jesus', id: 'n684', zoom: 1.4 },
];

function getNodePalette(node) {
  if (node.bannerType === 'jesus') {
    return { fill: '#8B2635', stroke: '#B88A36', text: '#FFFDF9', strokeW: 2.4 };
  }
  if (node.branch === 'matthew1') {
    return { fill: '#2E5C8A', stroke: '#1E4163', text: '#FFFFFF', strokeW: 1.2 };
  }
  if (node.branch === 'luke3') {
    return { fill: '#2B6E6C', stroke: '#1C4D4B', text: '#FFFFFF', strokeW: 1.2 };
  }
  if (node.isMessianic) {
    return { fill: '#8B2635', stroke: '#621924', text: '#FFFDF9', strokeW: 1.4 };
  }
  if (node.bannerType === 'tribe') {
    return { fill: '#1B3647', stroke: '#B88A36', text: '#F8F4EB', strokeW: 1.6 };
  }
  if (node.bannerType === 'nation') {
    return { fill: '#245B63', stroke: '#173E44', text: '#F8F4EB', strokeW: 1.2 };
  }
  if (node.category === 'prophecies') {
    return { fill: '#FAF2DF', stroke: '#B88A36', text: '#6D4B12', strokeW: 1.3 };
  }
  if (node.category === 'judges-priests') {
    return { fill: '#F4E5C2', stroke: '#A67A28', text: '#4C360C', strokeW: 1.1 };
  }
  if (node.category === 'origin-of-nations') {
    return { fill: '#E8F0F0', stroke: '#5B8487', text: '#1C3B3E', strokeW: 0.9 };
  }
  if (node.category === 'patriarchs') {
    return { fill: '#F3ECE0', stroke: '#9B825D', text: '#352A1B', strokeW: 0.9 };
  }
  return { fill: '#FDFBF7', stroke: '#9AAAB4', text: '#24343E', strokeW: 0.85 };
}

function getEdgeStyle(type) {
  switch (type) {
    case 'messianic':
      return { stroke: '#8B2635', width: 3.2, dash: undefined };
    case 'matthew1':
      return { stroke: '#2E5C8A', width: 2.7, dash: undefined };
    case 'luke3':
      return { stroke: '#2B6E6C', width: 2.7, dash: undefined };
    case 'maternal':
      return { stroke: '#9E5888', width: 1.6, dash: undefined };
    case 'marriage':
      return { stroke: '#B88A36', width: 1.5, dash: '5 4' };
    case 'tribe':
      return { stroke: '#1B3647', width: 1.7, dash: undefined };
    case 'nation':
      return { stroke: '#2B6E6C', width: 1.3, dash: '4 3' };
    default:
      return { stroke: '#6E828E', width: 1.2, dash: undefined };
  }
}

export default function LineageExplorer({
  onSelectNode,
  selectedNodeId,
  focusTargetNode,
  onClearFocusTarget,
  initialFocusMessianic = false,
}) {
  const containerRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [focusMessianic, setFocusMessianic] = useState(initialFocusMessianic);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);

  // Camera transform: translate(tx, ty) scale(scale)
  const [transform, setTransform] = useState({ tx: 0, ty: 0, scale: 0.55 });
  const [isDragging, setIsDragging] = useState(false);

  // Multi-touch & drag tracking
  const activePointersRef = useRef(new Map());
  const gestureStartRef = useRef(null);
  const didDragRef = useRef(false);
  const transformRef = useRef(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  const fitToScreen = useCallback((focusLineOnly = false, forceFullOverview = false) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const isNarrow = rect.width < 640;

    if (focusLineOnly || (isNarrow && !forceFullOverview)) {
      // Frame the central Messianic spine cleanly at readable scale on phones
      const scale = isNarrow
        ? Math.max(0.72, Math.min(1.05, rect.width / 460))
        : Math.max(0.45, Math.min(1.15, Math.min(rect.width / 620, rect.height / 1450)));
      const tx = rect.width / 2 - 875 * scale;
      const ty = 18 - 100 * scale;
      setTransform({ tx, ty, scale });
    } else {
      const scaleX = (rect.width - 24) / DATA_META.pageWidth;
      const scaleY = (rect.height - 24) / DATA_META.pageHeight;
      const scale = Math.max(0.22, Math.min(scaleX, scaleY, 0.72));
      const tx = (rect.width - DATA_META.pageWidth * scale) / 2;
      const ty = 14;
      setTransform({ tx, ty, scale });
    }
  }, []);

  const flyToNode = useCallback((node, targetScale = 1.45) => {
    const el = containerRef.current;
    if (!el || !node) return;
    const rect = el.getBoundingClientRect();
    const isNarrow = rect.width < 640;
    const adjustedScale = isNarrow ? Math.min(targetScale, 1.25) : targetScale;
    const s = Math.max(0.4, Math.min(2.8, adjustedScale));
    const tx = rect.width / 2 - node.cx * s;
    const ty = rect.height / 2 - node.cy * s;
    setTransform({ tx, ty, scale: s });
    setHighlightedId(node.id);
  }, []);

  // Initial fit on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      fitToScreen(initialFocusMessianic, false);
    });
    return () => cancelAnimationFrame(raf);
  }, [fitToScreen, initialFocusMessianic]);

  // Handle external fly-to request (e.g., from ProfileDrawer)
  useEffect(() => {
    if (!focusTargetNode) return;
    const timer = setTimeout(() => {
      if (!focusTargetNode.isMessianic) {
        setFocusMessianic(false);
      }
      setActiveFilter((prev) =>
        prev !== 'all' && !focusTargetNode.categories.includes(prev) ? 'all' : prev
      );
      flyToNode(focusTargetNode, 1.5);
      onClearFocusTarget?.();
    }, 40);
    return () => clearTimeout(timer);
  }, [focusTargetNode, flyToNode, onClearFocusTarget]);

  // Wheel zoom centered at pointer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      setTransform((prev) => {
        const nextScale = Math.max(0.22, Math.min(3.5, prev.scale * factor));
        const ratio = nextScale / prev.scale;
        return {
          scale: nextScale,
          tx: px - (px - prev.tx) * ratio,
          ty: py - (py - prev.ty) * ratio,
        };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const captureGestureBaseline = () => {
    const pts = Array.from(activePointersRef.current.values());
    const cur = transformRef.current;
    if (pts.length === 1) {
      gestureStartRef.current = {
        mode: 'pan',
        x: pts[0].x,
        y: pts[0].y,
        tx: cur.tx,
        ty: cur.ty,
        scale: cur.scale,
      };
    } else if (pts.length >= 2) {
      const el = containerRef.current;
      const rect = el ? el.getBoundingClientRect() : { left: 0, top: 0 };
      const p1 = pts[0];
      const p2 = pts[1];
      const midX = (p1.x + p2.x) / 2 - rect.left;
      const midY = (p1.y + p2.y) / 2 - rect.top;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
      gestureStartRef.current = {
        mode: 'pinch',
        midX,
        midY,
        dist,
        tx: cur.tx,
        ty: cur.ty,
        scale: cur.scale,
      };
    } else {
      gestureStartRef.current = null;
    }
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    // Ignore taps on overlay controls
    if (e.target.closest('button, input, a')) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointersRef.current.size === 1) {
      didDragRef.current = false;
    } else {
      didDragRef.current = true;
    }
    setIsDragging(true);
    captureGestureBaseline();
  };

  const handlePointerMove = (e) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gestureStartRef.current;
    if (!g) return;

    if (g.mode === 'pan' && activePointersRef.current.size === 1) {
      const dx = e.clientX - g.x;
      const dy = e.clientY - g.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        didDragRef.current = true;
      }
      setTransform((prev) => ({
        ...prev,
        tx: g.tx + dx,
        ty: g.ty + dy,
      }));
    } else if (g.mode === 'pinch' && activePointersRef.current.size >= 2) {
      const pts = Array.from(activePointersRef.current.values());
      const el = containerRef.current;
      const rect = el ? el.getBoundingClientRect() : { left: 0, top: 0 };
      const curMidX = (pts[0].x + pts[1].x) / 2 - rect.left;
      const curMidY = (pts[0].y + pts[1].y) / 2 - rect.top;
      const curDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1;
      const nextScale = Math.max(0.22, Math.min(3.5, g.scale * (curDist / g.dist)));
      const ratio = nextScale / g.scale;
      didDragRef.current = true;
      setTransform({
        scale: nextScale,
        tx: curMidX - (g.midX - g.tx) * ratio,
        ty: curMidY - (g.midY - g.ty) * ratio,
      });
    }
  };

  const handlePointerUp = (e) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size === 0) {
      setIsDragging(false);
      gestureStartRef.current = null;
    } else {
      captureGestureBaseline();
    }
  };

  const zoomStep = (multiplier) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setTransform((prev) => {
      const nextScale = Math.max(0.22, Math.min(3.5, prev.scale * multiplier));
      const ratio = nextScale / prev.scale;
      return {
        scale: nextScale,
        tx: cx - (cx - prev.tx) * ratio,
        ty: cy - (cy - prev.ty) * ratio,
      };
    });
  };

  const searchResults = useMemo(() => searchNodes(searchQuery, 12), [searchQuery]);

  const isNodeVisible = useCallback(
    (node) => {
      if (focusMessianic) return node.isMessianic;
      if (activeFilter === 'all') return true;
      return node.categories.includes(activeFilter);
    },
    [focusMessianic, activeFilter]
  );

  const visibleCount = useMemo(
    () => ALL_NODES.filter((n) => isNodeVisible(n)).length,
    [isNodeVisible]
  );

  const toggleFocusMessianic = () => {
    const next = !focusMessianic;
    setFocusMessianic(next);
    if (next) {
      setActiveFilter('all');
      fitToScreen(true, false);
    } else {
      fitToScreen(false, false);
    }
  };

  return (
    <div className="explorer-root">
      {/* Explorer Toolbar */}
      <div className="explorer-toolbar">
        <div className="explorer-toolbar-primary">
          <div className="explorer-search-wrap">
            <Search size={15} className="search-icon-abs" />
            <input
              type="text"
              id="explorer-search"
              className="explorer-search-input"
              placeholder={`Search ${DATA_META.totalNodes} figures, tribes...`}
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              aria-label="Search lineage chart"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchOpen(false);
                }}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink-muted)',
                  padding: 4,
                  display: 'flex',
                }}
              >
                <X size={14} />
              </button>
            )}

            {searchOpen && searchResults.length > 0 && (
              <div className="search-results-popover" role="listbox">
                {searchResults.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    className="search-result-item"
                    onClick={() => {
                      if (focusMessianic && !node.isMessianic) setFocusMessianic(false);
                      if (activeFilter !== 'all' && !node.categories.includes(activeFilter)) {
                        setActiveFilter('all');
                      }
                      flyToNode(node, 1.55);
                      onSelectNode(node);
                      setSearchOpen(false);
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--slate-teal)', fontSize: '0.88rem' }}>
                        {node.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                        {node.role}
                        {node.birthYear != null
                          ? ` · ${formatYearShort(node.birthYear)}–${formatYearShort(node.deathYear)}`
                          : ''}
                      </div>
                    </div>
                    <Crosshair size={14} color="var(--crimson)" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Prominent Line-to-Jesus Focus Toggle */}
          <button
            type="button"
            id="focus-messianic-toggle"
            className={`focus-toggle-btn ${focusMessianic ? 'active' : ''}`}
            onClick={toggleFocusMessianic}
            aria-pressed={focusMessianic}
          >
            <GitBranch size={15} />
            <span className="focus-label-full">Focus: Line to Jesus Only</span>
            <span className="focus-label-short">Line to Jesus</span>
          </button>
        </div>

        {/* Category Filter Pills (single scrollable strip on mobile) */}
        <div className="filter-pills" role="group" aria-label="Filter chart categories">
          {FILTER_KEYS.map((key) => {
            const cfg = CATEGORY_CONFIG[key];
            const isActive = !focusMessianic && activeFilter === key;
            return (
              <button
                key={key}
                type="button"
                className={`filter-pill ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setFocusMessianic(false);
                  setActiveFilter(key);
                }}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Pan-and-Zoom SVG Canvas */}
      <div
        ref={containerRef}
        className={`explorer-canvas-wrap ${isDragging ? 'dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => setSearchOpen(false)}
      >
        {/* Legend */}
        <div className="explorer-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#8B2635' }} />
            Direct Line
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#2E5C8A' }} />
            Matthew 1 (Legal)
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#2B6E6C' }} />
            Luke 3 (Natural)
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#1B3647' }} />
            12 Tribes
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#B88A36' }} />
            Prophecies / Judges
          </span>
          <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>
            Showing {visibleCount}/{DATA_META.totalNodes} nodes · {Math.round(transform.scale * 100)}%
          </span>
        </div>

        <svg className="explorer-svg" aria-label="Interactive Biblical Lineage Chart">
          <g transform={`translate(${transform.tx}, ${transform.ty}) scale(${transform.scale})`}>
            {/* Archival Poster Parchment Sheet */}
            <rect
              x="24"
              y="24"
              width={DATA_META.pageWidth - 48}
              height={DATA_META.pageHeight - 48}
              rx="18"
              fill="#F8F4EB"
              stroke="#1B3647"
              strokeWidth="12"
            />
            <rect
              x="36"
              y="36"
              width={DATA_META.pageWidth - 72}
              height={DATA_META.pageHeight - 72}
              rx="12"
              fill="none"
              stroke="#B88A36"
              strokeWidth="2"
              opacity="0.7"
            />

            {/* Poster Title Header */}
            <rect x="24" y="24" width={DATA_META.pageWidth - 48} height="96" rx="14" fill="#1B3647" />
            <text
              x={DATA_META.pageWidth / 2}
              y="84"
              textAnchor="middle"
              fill="#FBF7EE"
              fontFamily="Cinzel, Georgia, serif"
              fontSize="44"
              fontWeight="700"
              letterSpacing="4"
            >
              THE PROMISED OFFSPRING
            </text>

            {/* Subtle Era Bands */}
            {ERA_BANDS.map((band) => (
              <g key={band.label}>
                <rect
                  x="44"
                  y={band.y}
                  width={DATA_META.pageWidth - 88}
                  height={band.h}
                  fill={band.fill}
                />
                <line
                  x1="44"
                  y1={band.y}
                  x2={DATA_META.pageWidth - 44}
                  y2={band.y}
                  stroke="#D8CCB5"
                  strokeWidth="1"
                  strokeDasharray="6 6"
                />
                <text
                  x="62"
                  y={band.y + 20}
                  fill="#7A6C56"
                  fontFamily="Cinzel, Georgia, serif"
                  fontSize="11"
                  fontWeight="700"
                  letterSpacing="1.6"
                  opacity="0.85"
                >
                  {band.label}
                </text>
              </g>
            ))}

            {/* Matthew 1 & Luke 3 Branch Labels */}
            <g opacity={focusMessianic || transform.scale > 0.4 ? 0.95 : 0.65}>
              <rect x="650" y="1862" width="130" height="24" rx="5" fill="#EBF2F8" stroke="#2E5C8A" strokeWidth="1.2" />
              <text x="715" y="1878" textAnchor="middle" fill="#2E5C8A" fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">
                MATTHEW 1 · LEGAL
              </text>
              <rect x="944" y="1862" width="134" height="24" rx="5" fill="#EAF4F3" stroke="#2B6E6C" strokeWidth="1.2" />
              <text x="1011" y="1878" textAnchor="middle" fill="#2B6E6C" fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">
                LUKE 3 · NATURAL
              </text>
            </g>

            {/* Connecting Genealogical Edges */}
            <g>
              {ALL_EDGES.map((edge, idx) => {
                const a = NODES_BY_ID[edge.from];
                const b = NODES_BY_ID[edge.to];
                if (!a || !b) return null;
                const isMessianicEdge =
                  edge.type === 'messianic' ||
                  edge.type === 'matthew1' ||
                  edge.type === 'luke3' ||
                  (edge.type === 'maternal' && a.isMessianic && b.isMessianic) ||
                  (edge.type === 'marriage' && a.isMessianic && b.isMessianic);
                if (focusMessianic && !isMessianicEdge) return null;

                const style = getEdgeStyle(edge.type);
                const visibleBoth = isNodeVisible(a) && isNodeVisible(b);
                const opacity = focusMessianic
                  ? 0.92
                  : visibleBoth
                  ? isMessianicEdge
                    ? 0.9
                    : 0.45
                  : 0.08;

                const midY = (a.cy + b.cy) / 2;
                const d =
                  Math.abs(a.cy - b.cy) < 18
                    ? `M ${a.cx} ${a.cy} L ${b.cx} ${b.cy}`
                    : `M ${a.cx} ${a.cy} C ${a.cx} ${midY}, ${b.cx} ${midY}, ${b.cx} ${b.cy}`;

                return (
                  <path
                    key={idx}
                    d={d}
                    fill="none"
                    stroke={style.stroke}
                    strokeWidth={focusMessianic && isMessianicEdge ? style.width * 1.15 : style.width}
                    strokeDasharray={style.dash}
                    strokeLinecap="round"
                    opacity={opacity}
                  />
                );
              })}
            </g>

            {/* All 746 Interactive Nodes */}
            <g>
              {ALL_NODES.map((node) => {
                const visible = isNodeVisible(node);
                if (focusMessianic && !visible) return null;

                const pal = getNodePalette(node);
                const isSelected = selectedNodeId === node.id || highlightedId === node.id;
                const opacity = visible ? 1 : 0.12;

                const padX = node.bannerType === 'jesus' ? 14 : node.isBanner ? 8 : node.isMessianic ? 6 : 4;
                const padY = node.bannerType === 'jesus' ? 8 : node.isBanner ? 4 : 2;
                const boxW = Math.max(node.w + padX * 2, node.name.length * (node.isBanner ? 7.2 : 5.4) + padX * 2);
                const boxH = Math.max(node.h + padY * 2, node.bannerType === 'jesus' ? 46 : node.isBanner ? 24 : 15);
                const bx = node.cx - boxW / 2;
                const by = node.cy - boxH / 2;

                const fontSize =
                  node.bannerType === 'jesus'
                    ? 24
                    : node.bannerType === 'tribe'
                    ? 13
                    : node.isMessianic && node.branch === 'spine' && node.birthYear != null
                    ? 10.5
                    : node.isBanner
                    ? 9.5
                    : 8.5;

                return (
                  <g
                    key={node.id}
                    className="svg-node"
                    opacity={opacity}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (didDragRef.current) return;
                      setHighlightedId(node.id);
                      onSelectNode(node);
                    }}
                  >
                    {isSelected && (
                      <rect
                        x={bx - 5}
                        y={by - 5}
                        width={boxW + 10}
                        height={boxH + 10}
                        rx={8}
                        fill="none"
                        stroke="#B88A36"
                        strokeWidth="3.5"
                      />
                    )}
                    <rect
                      className="node-box"
                      x={bx}
                      y={by}
                      width={boxW}
                      height={boxH}
                      rx={node.isBanner || node.isMessianic ? 5 : 3}
                      fill={pal.fill}
                      stroke={isSelected ? '#B88A36' : pal.stroke}
                      strokeWidth={isSelected ? 2.4 : pal.strokeW}
                    />
                    <text
                      x={node.cx}
                      y={node.cy + fontSize * 0.34}
                      textAnchor="middle"
                      fill={pal.text}
                      fontFamily={
                        node.isBanner || node.bannerType === 'jesus'
                          ? 'Cinzel, Georgia, serif'
                          : 'Inter, sans-serif'
                      }
                      fontSize={fontSize}
                      fontWeight={node.isBanner || node.isMessianic ? '700' : '600'}
                      pointerEvents="none"
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        {/* Quick-Jump Era Landmarks (single horizontal bar on mobile) */}
        <div className="explorer-quick-jump">
          <span className="quick-jump-label">Fly To</span>
          {QUICK_JUMPS.map((item) => {
            const target = NODES_BY_ID[item.id];
            if (!target) return null;
            return (
              <button
                key={item.id}
                type="button"
                className="quick-jump-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  flyToNode(target, item.zoom);
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Zoom Controls */}
        <div className="explorer-controls-overlay">
          <button
            type="button"
            className="zoom-btn"
            onClick={(e) => {
              e.stopPropagation();
              zoomStep(1.25);
            }}
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          <button
            type="button"
            className="zoom-btn"
            onClick={(e) => {
              e.stopPropagation();
              zoomStep(0.8);
            }}
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <button
            type="button"
            className="zoom-btn"
            onClick={(e) => {
              e.stopPropagation();
              fitToScreen(focusMessianic, true);
            }}
            title="Fit full chart to view"
            aria-label="Fit full chart to view"
          >
            <Maximize2 size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
