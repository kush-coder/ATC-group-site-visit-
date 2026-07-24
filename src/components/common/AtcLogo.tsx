/**
 * Placeholder ATC Group logo. Swap the inner SVG / <img> for the official
 * ATC Group logo asset later without touching any call sites.
 */
import React from 'react';

interface Props {
  size?: number;
  variant?: 'color' | 'white';
  showWordmark?: boolean;
}

const AtcLogo: React.FC<Props> = ({ size = 56, variant = 'color', showWordmark = false }) => {
  const isWhite = variant === 'white';
  const bg = isWhite ? 'rgba(255,255,255,0.16)' : 'linear-gradient(135deg,#0F9D58,#08783F)';
  const fg = isWhite ? '#FFFFFF' : '#FFFFFF';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <div
        aria-label="ATC Group logo"
        style={{
          width: size, height: size, borderRadius: size * 0.28, background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isWhite ? 'none' : '0 8px 20px rgba(8,120,63,0.28)', flexShrink: 0,
        }}
      >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 48 48" fill="none">
          <path d="M24 5 L41 39 H32 L24 21 L16 39 H7 Z" fill={fg} />
          <circle cx="24" cy="33" r="3.2" fill={isWhite ? '#0F9D58' : '#08783F'} />
        </svg>
      </div>
      {showWordmark && (
        <div style={{ lineHeight: 1.05 }}>
          <div style={{ fontWeight: 800, fontSize: size * 0.34, color: isWhite ? '#fff' : '#08783F', fontFamily: 'Manrope' }}>
            ATC <span style={{ fontWeight: 600 }}>Group</span>
          </div>
          <div style={{ fontSize: size * 0.19, color: isWhite ? 'rgba(255,255,255,0.8)' : '#66736C', fontWeight: 600 }}>
            FieldConnect
          </div>
        </div>
      )}
    </div>
  );
};

export default AtcLogo;
