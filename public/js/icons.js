/* SVG device icons — iPhone, iPad, Galaxy, Z Fold, headphones, laptop, etc. */

const NT_ICONS = {
  iphone: `<svg viewBox="0 0 40 68" width="34" height="58" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="36" height="64" rx="8"/>
    <rect x="14" y="4" width="12" height="3" rx="1.5" fill="currentColor" opacity=".7"/>
    <circle cx="20" cy="60" r="2"/>
  </svg>`,
  ipad: `<svg viewBox="0 0 54 74" width="44" height="60" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="50" height="70" rx="6"/>
    <rect x="6" y="6" width="42" height="62" rx="2" opacity=".35"/>
    <circle cx="27" cy="70" r="1.2" fill="currentColor"/>
  </svg>`,
  galaxy: `<svg viewBox="0 0 42 72" width="34" height="58" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="38" height="68" rx="6"/>
    <circle cx="21" cy="7" r="1.5" fill="currentColor"/>
    <rect x="5" y="12" width="32" height="52" rx="2" opacity=".3"/>
  </svg>`,
  zfold: `<svg viewBox="0 0 66 60" width="52" height="48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="30" height="52" rx="4"/>
    <rect x="34" y="4" width="30" height="52" rx="4"/>
    <line x1="33" y1="8" x2="33" y2="52" opacity=".4"/>
    <rect x="5" y="8" width="24" height="44" rx="2" opacity=".25"/>
    <rect x="37" y="8" width="24" height="44" rx="2" opacity=".25"/>
  </svg>`,
  headphones: `<svg viewBox="0 0 68 60" width="52" height="46" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M8 34 A26 26 0 0 1 60 34"/>
    <rect x="4" y="30" width="12" height="24" rx="4"/>
    <rect x="52" y="30" width="12" height="24" rx="4"/>
  </svg>`,
  laptop: `<svg viewBox="0 0 72 52" width="56" height="42" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="8" y="6" width="56" height="36" rx="3"/>
    <rect x="12" y="10" width="48" height="28" rx="1.5" opacity=".3"/>
    <path d="M2 46 h68 l-3 4 h-62 z" fill="currentColor" fill-opacity=".15"/>
  </svg>`,
  earbuds: `<svg viewBox="0 0 60 50" width="46" height="40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 6c-6 4-8 12-4 20l6-4c-2-4-1-8 2-11z"/>
    <path d="M48 6c6 4 8 12 4 20l-6-4c2-4 1-8-2-11z"/>
    <line x1="14" y1="28" x2="14" y2="42"/>
    <line x1="46" y1="28" x2="46" y2="42"/>
  </svg>`,
  charger: `<svg viewBox="0 0 40 60" width="30" height="46" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="8" y="18" width="24" height="30" rx="4"/>
    <line x1="15" y1="12" x2="15" y2="18"/>
    <line x1="25" y1="12" x2="25" y2="18"/>
    <path d="M20 26l-4 8h4l-2 6"/>
  </svg>`,
  watch: `<svg viewBox="0 0 40 60" width="30" height="46" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="8" y="18" width="24" height="26" rx="6"/>
    <path d="M12 18 l2-10 h12 l2 10"/>
    <path d="M12 44 l2 10 h12 l2 -10"/>
    <circle cx="20" cy="31" r="4" opacity=".4"/>
  </svg>`,
};

/* Category → best matching icon */
function categoryIcon(slug) {
  const map = {
    'ordinateurs': NT_ICONS.laptop,
    'telephones': NT_ICONS.iphone,
    'tablettes': NT_ICONS.ipad,
    'ecouteurs': NT_ICONS.headphones,
    'accessoires': NT_ICONS.charger,
    'montres': NT_ICONS.watch,
  };
  return map[slug] || NT_ICONS.charger;
}
window.NT_ICONS = NT_ICONS;
window.categoryIcon = categoryIcon;
