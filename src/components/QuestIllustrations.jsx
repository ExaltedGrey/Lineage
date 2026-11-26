/**
 * Hand-crafted archival storybook SVG illustrations for kids & families:
 * - GuideOwl: Expressive companion mascot ("Pip the Scroll Owl") with speech bubble
 * - EraMedallion: Custom illustrated emblem for each of the 7 Eras
 * - ConfettiBurst: Lightweight celebratory star & ribbon burst
 */

export function GuideOwl({ mood = 'idle', message, badgeText }) {
  const isCelebrate = mood === 'celebrate' || mood === 'happy';
  const isTryAgain = mood === 'encourage';

  return (
    <div className={`guide-owl-bar mood-${mood}`}>
      <div className="guide-owl-avatar" aria-hidden="true">
        <svg viewBox="0 0 80 80" width="60" height="60">
          {/* Warm archival backdrop circle */}
          <circle cx="40" cy="40" r="37" fill="#1B3647" stroke="#B88A36" strokeWidth="2.5" />
          {/* Little wings */}
          <ellipse
            cx="17"
            cy={isCelebrate ? '42' : '50'}
            rx="7"
            ry="12"
            transform={isCelebrate ? 'rotate(-28 17 42)' : 'rotate(12 17 50)'}
            fill="#6D4B28"
          />
          <ellipse
            cx="63"
            cy={isCelebrate ? '42' : '50'}
            rx="7"
            ry="12"
            transform={isCelebrate ? 'rotate(28 63 42)' : 'rotate(-12 63 50)'}
            fill="#6D4B28"
          />
          {/* Owl body */}
          <ellipse cx="40" cy="48" rx="20" ry="21" fill="#8A6238" />
          <ellipse cx="40" cy="52" rx="13" ry="14" fill="#F8F4EB" />
          {/* Ear tufts */}
          <polygon points="23,28 28,17 34,26" fill="#734E2A" />
          <polygon points="57,28 52,17 46,26" fill="#734E2A" />
          {/* Spectacle eyes */}
          <circle cx="32" cy="36" r="8" fill="#FFFDF8" stroke="#B88A36" strokeWidth="2" />
          <circle cx="48" cy="36" r="8" fill="#FFFDF8" stroke="#B88A36" strokeWidth="2" />
          <line x1="40" y1="36" x2="40" y2="36" stroke="#B88A36" strokeWidth="2.5" />
          {isCelebrate ? (
            <>
              <path d="M28 36 Q32 31 36 36" fill="none" stroke="#1B3647" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M44 36 Q48 31 52 36" fill="none" stroke="#1B3647" strokeWidth="2.4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="33" cy="36" r="3.4" fill="#1B3647" />
              <circle cx="49" cy="36" r="3.4" fill="#1B3647" />
              <circle cx="34.2" cy="34.6" r="1.1" fill="#FFFFFF" />
              <circle cx="50.2" cy="34.6" r="1.1" fill="#FFFFFF" />
            </>
          )}
          {/* Beak */}
          <polygon points="36.5,41 43.5,41 40,47" fill="#E0A538" />
          {/* Mini scroll tucked under wing */}
          <rect x="47" y="52" width="16" height="8" rx="3" fill="#FAF2DF" stroke="#8B2635" strokeWidth="1.4" transform="rotate(-14 55 56)" />
          {/* Tiny explorer hat / sparkle when celebrating */}
          {isCelebrate && (
            <>
              <polygon points="40,6 42,11 47,11 43,14 44,19 40,16 36,19 37,14 33,11 38,11" fill="#F4DB9F" />
            </>
          )}
          {isTryAgain && (
            <text x="64" y="24" fill="#F4DB9F" fontSize="14" fontWeight="700">?</text>
          )}
        </svg>
      </div>
      <div className="guide-owl-bubble">
        <div className="guide-owl-meta">
          <span className="guide-owl-name">Pip the Scroll Owl</span>
          {badgeText && <span className="badge badge-gold">{badgeText}</span>}
        </div>
        <p className="guide-owl-text">{message}</p>
      </div>
    </div>
  );
}

export function EraMedallion({ eraId, size = 54, unlocked = true }) {
  const opacity = unlocked ? 1 : 0.38;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ opacity, flexShrink: 0 }} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill={unlocked ? '#1B3647' : '#D9D1C0'} stroke={unlocked ? '#B88A36' : '#A69D8B'} strokeWidth="2.5" />
      <circle cx="32" cy="32" r="25" fill="none" stroke="#E4C37C" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
      {eraId === 'era-1' && (
        /* Tree & Golden Promise in Eden */
        <g>
          <rect x="29" y="34" width="6" height="16" rx="2" fill="#A6723B" />
          <circle cx="32" cy="26" r="12" fill="#2E7D57" />
          <circle cx="24" cy="29" r="7" fill="#3B9469" />
          <circle cx="40" cy="29" r="7" fill="#3B9469" />
          <circle cx="32" cy="24" r="3" fill="#F4DB9F" />
        </g>
      )}
      {eraId === 'era-2' && (
        /* Noah's Ark & Rainbow */
        <g>
          <path d="M16 32 A16 16 0 0 1 48 32" fill="none" stroke="#E2BE74" strokeWidth="3" strokeLinecap="round" />
          <path d="M20 32 A12 12 0 0 1 44 32" fill="none" stroke="#8B2635" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M16 38 L48 38 L43 47 L21 47 Z" fill="#A6723B" stroke="#F8F4EB" strokeWidth="1.2" />
          <rect x="23" y="31" width="18" height="7" rx="1.5" fill="#C48B4B" />
          <path d="M13 49 Q22 45 32 49 T51 49" fill="none" stroke="#68B0C4" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}
      {eraId === 'era-3' && (
        /* Starry Covenant Sky & Tent */
        <g>
          <polygon points="32,12 34,18 40,18 35,22 37,28 32,24 27,28 29,22 24,18 30,18" fill="#F4DB9F" />
          <circle cx="19" cy="22" r="2" fill="#F4DB9F" />
          <circle cx="46" cy="24" r="1.8" fill="#F4DB9F" />
          <polygon points="16,48 32,31 48,48" fill="#C9A875" stroke="#F8F4EB" strokeWidth="1.3" />
          <polygon points="28,48 32,39 36,48" fill="#1B3647" />
        </g>
      )}
      {eraId === 'era-4' && (
        /* Royal Scepter of Judah & Wheat */
        <g>
          <line x1="20" y1="48" x2="42" y2="20" stroke="#E2BE74" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="44" cy="18" r="5" fill="#8B2635" stroke="#F4DB9F" strokeWidth="2" />
          <path d="M18 30 Q23 36 22 46" fill="none" stroke="#E4C37C" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="19" cy="31" rx="2.5" ry="4" fill="#E4C37C" transform="rotate(-25 19 31)" />
          <ellipse cx="23" cy="36" rx="2.5" ry="4" fill="#E4C37C" transform="rotate(-15 23 36)" />
        </g>
      )}
      {eraId === 'era-5' && (
        /* David's Crown & Twin Branches */
        <g>
          <path d="M16 40 L20 22 L28 31 L32 19 L36 31 L44 22 L48 40 Z" fill="#E2BE74" stroke="#FFFDF8" strokeWidth="1.2" />
          <rect x="16" y="40" width="32" height="6" rx="2" fill="#8B2635" />
          <circle cx="25" cy="43" r="2" fill="#6AA8E0" />
          <circle cx="39" cy="43" r="2" fill="#64C4BE" />
        </g>
      )}
      {eraId === 'era-6' && (
        /* Daniel's 70-Weeks Scroll & Time Dial */
        <g>
          <circle cx="32" cy="32" r="15" fill="#F8F4EB" stroke="#B88A36" strokeWidth="2.5" />
          <line x1="32" y1="32" x2="32" y2="21" stroke="#8B2635" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="32" y1="32" x2="41" y2="35" stroke="#1B3647" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="32" r="2.6" fill="#B88A36" />
          <text x="32" y="44" textAnchor="middle" fill="#8B2635" fontSize="7" fontWeight="800" fontFamily="Inter, sans-serif">69 WKS</text>
        </g>
      )}
      {eraId === 'era-7' && (
        /* Shining Star & Crown of the Promised Offspring */
        <g>
          <line x1="32" y1="10" x2="32" y2="54" stroke="#F4DB9F" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="12" y1="32" x2="52" y2="32" stroke="#F4DB9F" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="19" y1="19" x2="45" y2="45" stroke="#E2BE74" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="45" y1="19" x2="19" y2="45" stroke="#E2BE74" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="32" cy="32" r="9" fill="#8B2635" stroke="#F4DB9F" strokeWidth="2.4" />
          <circle cx="32" cy="32" r="3.5" fill="#FFFDF8" />
        </g>
      )}
    </svg>
  );
}

const CONFETTI_PIECES = [
  { left: '8%', color: '#E2BE74', delay: '0ms', size: 9 },
  { left: '16%', color: '#8B2635', delay: '60ms', size: 8 },
  { left: '25%', color: '#2E5C8A', delay: '120ms', size: 10 },
  { left: '34%', color: '#F4DB9F', delay: '30ms', size: 8 },
  { left: '43%', color: '#2B6E6C', delay: '90ms', size: 9 },
  { left: '52%', color: '#E2BE74', delay: '150ms', size: 11 },
  { left: '61%', color: '#8B2635', delay: '40ms', size: 8 },
  { left: '70%', color: '#2E5C8A', delay: '110ms', size: 9 },
  { left: '79%', color: '#F4DB9F', delay: '70ms', size: 10 },
  { left: '88%', color: '#2B6E6C', delay: '130ms', size: 8 },
  { left: '94%', color: '#E2BE74', delay: '20ms', size: 9 },
];

export function ConfettiBurst({ active }) {
  if (!active) return null;
  return (
    <div className="confetti-layer" aria-hidden="true">
      {CONFETTI_PIECES.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: p.left,
            background: p.color,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
