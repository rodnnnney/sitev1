export type TextSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type TextColor = 'black' | 'muted' | 'white' | 'accent';
export type TextType = 'paragraph' | 'label' | 'heading' | 'important';

export const textSizeStyles: Record<TextSize, string> = {
  '2xs': 'text-2xs',
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
};

export const textColorStyles: Record<TextColor, string> = {
  black: 'text-ink',
  muted: 'text-muted',
  white: 'text-paper',
  accent: 'text-accent',
};

/** Per-type font family + tracking. `heading`/`important` use Geist Pixel. */
export const textTypeStyles: Record<TextType, string> = {
  paragraph: 'font-mono font-normal',
  label: 'font-mono uppercase tracking-wider',
  heading: 'font-pixel tracking-tight',
  important: 'font-pixel',
};

/** Whether a type renders in the pixel font (drives the default scramble charset). */
export const textTypeIsPixel: Record<TextType, boolean> = {
  paragraph: false,
  label: false,
  heading: true,
  important: true,
};

export const textDefaultStyles = 'leading-relaxed w-fit';

/** Smooth animated blue underline for links inside the text. */
export const textLinkStyles = 'text-link-animate';

/** Off-screen copy used to read the real text for measuring/scrambling. */
export const textHiddenMeasureStyles =
  'pointer-events-none invisible absolute left-0 top-0 -z-10 select-none whitespace-pre';

const SINS = [
  { en: 'prideful', ja: '傲慢', ko: '오만한', zh: '傲慢' },
  { en: 'greedy', ja: '貪欲', ko: '탐욕스러운', zh: '贪婪' },
  { en: 'lustful', ja: '好色', ko: '음란한', zh: '淫欲' },
  { en: 'envious', ja: '嫉妬', ko: '질투하는', zh: '嫉妒' },
  { en: 'gluttonous', ja: '暴食', ko: '폭식하는', zh: '暴食' },
  { en: 'wrathful', ja: '憤怒', ko: '분노한', zh: '愤怒' },
  { en: 'slothful', ja: '怠惰', ko: '나태한', zh: '懒惰' },
] as const;

const SCRAMBLE_CHARS_CJK = [
  ...new Set(SINS.flatMap((s) => [...s.ja, ...s.ko, ...s.zh])),
].join('');

/** Uppercase + digits only (no lowercase) so the scramble reads less English
 *  and the CJK glyphs surface more often. */
export const SCRAMBLE_CHARS_PIXEL =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' + SCRAMBLE_CHARS_CJK;
export const SCRAMBLE_CHARS_FULL =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()[]{}~⌘↵`' + SCRAMBLE_CHARS_CJK;
