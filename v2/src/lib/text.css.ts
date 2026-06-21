export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type TextColor = 'black' | 'muted' | 'white' | 'accent';
export type TextType = 'paragraph' | 'label' | 'heading' | 'important';

export const textSizeStyles: Record<TextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-2xl',
  '2xl': 'text-4xl',
  '3xl': 'text-6xl',
};

export const textColorStyles: Record<TextColor, string> = {
  black: 'text-neutral-900',
  muted: 'text-neutral-500',
  white: 'text-white',
  accent: 'text-violet-600',
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

export const textDefaultStyles = 'leading-relaxed';

/** Off-screen copy used to read the real text for measuring/scrambling. */
export const textHiddenMeasureStyles =
  'pointer-events-none invisible absolute left-0 top-0 -z-10 select-none whitespace-pre';

/** Pixel fonts usually lack lowercase/symbol glyphs — keep scramble within safe glyphs. */
export const SCRAMBLE_CHARS_PIXEL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const SCRAMBLE_CHARS_FULL =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()[]{}~⌘↵`';
