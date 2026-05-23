function Logo({ className = 'w-8 h-8' }) {
  return (
    <svg className={className} viewBox="2 2 196 196" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#3b82f6"/>
          <stop offset="1" stopColor="#8b5cf6"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="95" fill="#0f172a" stroke="url(#lg)" strokeWidth="3"/>
      <g transform="translate(0, 12)">
        <rect x="40" y="22" width="120" height="82" rx="10" fill="#1e293b" stroke="url(#lg)" strokeWidth="2"/>
      <line x1="80" y1="32" x2="80" y2="94" stroke="url(#lg)" strokeWidth="1.5" opacity="0.35"/>
      <line x1="120" y1="32" x2="120" y2="94" stroke="url(#lg)" strokeWidth="1.5" opacity="0.35"/>
      <rect x="48" y="36" width="26" height="7" rx="3" fill="url(#lg)" opacity="0.7"/>
      <rect x="48" y="48" width="26" height="7" rx="3" fill="url(#lg)" opacity="0.5"/>
      <rect x="48" y="60" width="26" height="7" rx="3" fill="url(#lg)" opacity="0.3"/>
      <rect x="88" y="36" width="26" height="7" rx="3" fill="url(#lg)" opacity="0.6"/>
      <rect x="88" y="48" width="26" height="7" rx="3" fill="url(#lg)" opacity="0.4"/>
      <rect x="128" y="36" width="26" height="7" rx="3" fill="url(#lg)" opacity="0.7"/>
      <rect x="128" y="48" width="26" height="7" rx="3" fill="url(#lg)" opacity="0.5"/>
      <rect x="128" y="60" width="26" height="7" rx="3" fill="url(#lg)" opacity="0.3"/>
      <path d="M64 78l8 8 16-16" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      <g transform="translate(62, 125)">
        <circle cx="0" cy="0" r="9.5" fill="url(#lg)" opacity="0.85"/>
        <rect x="-7.5" y="9.5" width="15" height="20" rx="7" fill="url(#lg)" opacity="0.65"/>
      </g>
      <g transform="translate(100, 120)">
        <circle cx="0" cy="0" r="10.5" fill="#3b82f6" opacity="0.95"/>
        <rect x="-8.5" y="10.5" width="17" height="22" rx="7.5" fill="#3b82f6" opacity="0.75"/>
      </g>
      <g transform="translate(138, 125)">
        <circle cx="0" cy="0" r="9.5" fill="url(#lg)" opacity="0.85"/>
        <rect x="-7.5" y="9.5" width="15" height="20" rx="7" fill="url(#lg)" opacity="0.65"/>
      </g>
      </g>
    </svg>
  );
}

export default Logo;
