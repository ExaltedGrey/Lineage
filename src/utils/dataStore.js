import meta from '../data/meta.json';
import nodes from '../data/nodes.json';
import edges from '../data/edges.json';
import prophecies from '../data/prophecies.json';
import lifespans from '../data/lifespans.json';
import chronology from '../data/chronology.json';
import stories from '../data/stories.json';
import { overlapYears } from './yearUtils';

export const DATA_META = meta;
export const ALL_NODES = nodes;
export const ALL_EDGES = edges;
export const ALL_PROPHECIES = prophecies;
export const ALL_LIFESPANS = lifespans;
export const ALL_CHRONOLOGY = chronology;
export const ALL_STORIES = stories;

export const NODES_BY_ID = Object.fromEntries(nodes.map((n) => [n.id, n]));
export const PROPHECIES_BY_ID = Object.fromEntries(prophecies.map((p) => [p.id, p]));
export const LIFESPANS_BY_NODE_ID = Object.fromEntries(lifespans.map((l) => [l.nodeId, l]));

export const CATEGORY_CONFIG = {
  all: { label: 'All Nodes', color: '#1B3647' },
  'line-to-jesus': { label: 'Line to Jesus', color: '#8B2635' },
  'origin-of-nations': { label: 'Origin of Nations', color: '#2B6E6C' },
  patriarchs: { label: 'Patriarchs', color: '#7D5A2C' },
  tribes: { label: '12 Tribes', color: '#1B4965' },
  'judges-priests': { label: 'Judges & Priests', color: '#B88A36' },
  prophecies: { label: 'Prophecies', color: '#9E7324' },
};

export const BRANCH_LABELS = {
  spine: { label: 'Direct Messianic Line', color: '#8B2635' },
  matthew1: { label: 'Matthew 1 · Legal Line (Solomon → Joseph)', color: '#2E5C8A' },
  luke3: { label: 'Luke 3 · Natural Line (Nathan → Mary)', color: '#2B6E6C' },
  both: { label: 'Shared Convergence (Matthew 1 & Luke 3)', color: '#8B2635' },
  none: null,
};

export const ERA_LABELS = {
  eden: 'Eden & Pre-Flood',
  flood: 'Flood & Nations',
  patriarchs: 'Patriarchs & Covenant',
  tribes: '12 Tribes & Judges',
  david: 'House of David',
  exile: 'Exile & 70 Weeks',
  offspring: 'The Promised Offspring',
  prophecies: 'Prophetic Milestones',
};

export function getContemporaries(node) {
  if (!node || node.birthYear == null || node.deathYear == null) return [];
  const results = [];
  for (const life of lifespans) {
    if (life.nodeId === node.id) continue;
    const overlap = overlapYears(node, life);
    if (overlap > 0) {
      results.push({
        ...life,
        overlap,
        node: NODES_BY_ID[life.nodeId],
      });
    }
  }
  results.sort((a, b) => b.overlap - a.overlap);
  return results;
}

export function searchNodes(query, limit = 14) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = [];
  for (const n of nodes) {
    const nameL = n.name.toLowerCase();
    const roleL = (n.role || '').toLowerCase();
    let score = 0;
    if (nameL === q) score = 100;
    else if (nameL.startsWith(q)) score = 70;
    else if (nameL.includes(q)) score = 45;
    else if (roleL.includes(q)) score = 20;
    else continue;

    // Boost key Messianic, banner, and dated figures
    if (n.bannerType === 'jesus') score += 35;
    if (n.isMessianic) score += 20;
    if (n.isBanner) score += 15;
    if (n.birthYear != null) score += 10;
    if (n.category === 'prophecies') score += 8;

    scored.push({ node: n, score });
  }
  scored.sort((a, b) => b.score - a.score || a.node.name.localeCompare(b.node.name));
  return scored.slice(0, limit).map((s) => s.node);
}

// Pre-ordered sequences for quiz & quick navigation
export const MESSIANIC_SPINE_IDS = [
  'n619', 'n657', 'n658', 'n659', 'n674', 'n677', 'n678', 'n675', 'n660', 'n661',
  'n662', 'n676', 'n663', 'n664', 'n673', 'n665', 'n672', 'n666', 'n667', 'n671',
  'n668', 'n670', 'n736', 'n740', 'n741', 'n742', 'n748', 'n743', 'n744', 'n747',
  'n745', 'n746', 'n669',
];

export const MATTHEW1_CHAIN_IDS = [
  'n669', 'n739', 'n370', 'n371', 'n372', 'n373', 'n374', 'n375', 'n376', 'n377',
  'n378', 'n379', 'n380', 'n381', 'n382', 'n383', 'n389', 'n390', 'n393', 'n395',
  'n738', 'n316', 'n359', 'n367', 'n369', 'n368', 'n365', 'n366', 'n364', 'n360',
  'n445', 'n684',
];

export const LUKE3_CHAIN_IDS = [
  'n669', 'n737', 'n297', 'n298', 'n299', 'n300', 'n301', 'n302', 'n303', 'n304',
  'n305', 'n306', 'n307', 'n308', 'n309', 'n310', 'n311', 'n312', 'n313', 'n314',
  'n315', 'n395', 'n738', 'n318', 'n319', 'n320', 'n321', 'n322', 'n327', 'n326',
  'n325', 'n324', 'n323', 'n328', 'n329', 'n330', 'n331', 'n332', 'n358', 'n357',
  'n333', 'n444', 'n684',
];
