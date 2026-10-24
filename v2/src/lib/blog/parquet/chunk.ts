// The one-column example shared by the chunk-writer animation and the
// before/after comparison: two pages of 8 values. Page 0 builds the
// dictionary and has no long runs (bit-packed); page 1 is one long run (RLE).

export const PAGE = 8;
export const VALUES = ["Oslo", "Paris", "Oslo", "Oslo", "Lima", "Paris", "Oslo", "Oslo", ...Array(PAGE).fill("Paris")];
export const DICT = [...new Set(VALUES)];
export const CODES = VALUES.map((v) => DICT.indexOf(v));

export const bitWidth = (maxCode: number) => Math.max(1, Math.ceil(Math.log2(maxCode + 1)));
export const isRun = (codes: number[]) => codes.every((c) => c === codes[0]);

/** Size of an RLE_DICTIONARY values section: bit-width byte, run header, then the run. */
const pageBytes = (codes: number[], bw: number) =>
  2 + (isRun(codes) ? Math.ceil(bw / 8) : (codes.length * bw) / 8);

export const PAGES = [0, 1].map((p) => {
  const codes = CODES.slice(p * PAGE, (p + 1) * PAGE);
  const bw = bitWidth(Math.max(...CODES.slice(0, (p + 1) * PAGE)));
  return { codes, bw, bytes: pageBytes(codes, bw) };
});

/** e.g. "8 × int2 · 4 B": the size includes the bit-width byte and run header. */
export const pageDesc = (i: number) => {
  const p = PAGES[i];
  const what = isRun(p.codes) ? `RLE ${p.codes.length} × ${p.codes[0]}` : `${p.codes.length} × int${p.bw}`;
  return `${what} · ${p.bytes} B`;
};

// PLAIN strings: u32 length + bytes each.
export const DICT_BYTES = DICT.reduce((n, s) => n + 4 + s.length, 0);
export const PLAIN_BYTES = VALUES.reduce((n, s) => n + 4 + s.length, 0);
export const ENCODED_BYTES = DICT_BYTES + PAGES.reduce((n, p) => n + p.bytes, 0);
