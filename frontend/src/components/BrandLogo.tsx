import React from 'react';

export const BrandLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 300 180"
    aria-label="learn AI logo"
    role="img"
    className={className}
  >
    <rect x="20" y="20" width="260" height="140" fill="#25394d" />
    <path d="M150 20 L150 85 L115 85 L115 20 Z" fill="#f6f3ed" />
    <path d="M150 20 L188 20 L188 58 Z" fill="#d9a511" />
    <rect x="108" y="58" width="84" height="5" fill="#f6f3ed" />
    <rect x="108" y="67" width="84" height="5" fill="#f6f3ed" />
    <rect x="108" y="76" width="84" height="5" fill="#f6f3ed" />
    <rect x="126" y="84" width="5" height="31" fill="#f6f3ed" />
    <rect x="136" y="84" width="5" height="31" fill="#f6f3ed" />
    <rect x="146" y="84" width="5" height="31" fill="#f6f3ed" />
    <rect x="156" y="84" width="5" height="31" fill="#f6f3ed" />
    <text x="75" y="140" fontSize="42" fontFamily="Plus Jakarta Sans, sans-serif" fill="#e3b11d">learn AI</text>
  </svg>
);
