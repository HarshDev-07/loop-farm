/**
 * icons.js — Inline SVG icons, one consistent stroke width (1.5).
 * No emoji, no image files.
 */

export const Icons = {
  info: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
    <line x1="8" y1="5" x2="8" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="8" cy="11" r="1" fill="currentColor"/>
  </svg>`,

  check: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
    <polyline points="4.5,8.5 7,11 11.5,5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  error: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
    <line x1="5.5" y1="5.5" x2="10.5" y2="10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="10.5" y1="5.5" x2="5.5" y2="10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  progress: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" stroke-dasharray="22 10"/>
  </svg>`,

  lock: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <rect x="2" y="5" width="8" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
    <path d="M4 5V3.5a2 2 0 1 1 4 0V5" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  star: (filled = true) => `<svg width="20" height="20" viewBox="0 0 20 20" fill="${filled ? '#f4c430' : 'none'}" aria-hidden="true">
    <polygon points="10,2 12.4,7.6 18.5,8.1 14,12 15.5,18 10,15 4.5,18 6,12 1.5,8.1 7.6,7.6"
      stroke="#f4c430" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`,

  sound: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 6H1v4h2l4 3V3L3 6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M11 5a4 4 0 0 1 0 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  mute: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 6H1v4h2l4 3V3L3 6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <line x1="10" y1="6" x2="15" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="15" y1="6" x2="10" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,
};
