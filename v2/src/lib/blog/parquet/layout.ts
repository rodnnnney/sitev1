// Positions for the "parquet on disk" animation. Every block on screen is a
// fixed element; each stage just assigns it a box. Pure so it can be tested.

export type Col = "city" | "temp" | "description";
export const COLS: Col[] = ["city", "temp", "description"];

// The post's running example: weather readings. Same first 8 cities as the
// chunk writer (chunk.ts), same columns as the 1 GB file in the other figures.
export const ROWS = [
  { city: "Oslo", temp: 12.4, description: "fog" },
  { city: "Paris", temp: 15.1, description: "rain" },
  { city: "Oslo", temp: 11.8, description: "mist" },
  { city: "Oslo", temp: 9.6, description: "snow" },
  { city: "Lima", temp: 24.3, description: "sunny" },
  { city: "Paris", temp: 16.0, description: "clear" },
  { city: "Oslo", temp: 10.9, description: "rain" },
  { city: "Oslo", temp: 8.7, description: "windy" },
];

export const GROUPS = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
];

// Each row group's city column gets its own dictionary, in first-seen order.
const DICTS = GROUPS.map((rows) => [...new Set(rows.map((r) => ROWS[r].city))]);
export const cityCode = (r: number) => {
  const g = r < 4 ? 0 : 1;
  return DICTS[g].indexOf(ROWS[r].city);
};

// Rough byte sizes, only used to print believable offsets in the footer.
const BYTES = { magic: 4, header: 20, cityCode: 1, temp: 4, description: 9 };
const dictBytes = (g: number) => BYTES.header + DICTS[g].reduce((n, s) => n + 4 + s.length, 0);

/** Byte offset where each column chunk starts, keyed "g-col". */
export const OFFSETS: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let pos = BYTES.magic;
  GROUPS.forEach((rows, g) => {
    for (const col of COLS) {
      out[`${g}-${col}`] = pos;
      if (col === "city") pos += dictBytes(g);
      const per = col === "city" ? BYTES.cityCode : col === "temp" ? BYTES.temp : BYTES.description;
      pos += BYTES.header + per * rows.length;
    }
  });
  return out;
})();

export type Kind =
  | "cell"
  | "colLabel"
  | "rgLabel"
  | "magic"
  | "len"
  | "footer"
  | "schema"
  | "header"
  | "dict"
  | "ptr"
  | "badge"
  | "rgBox"
  | "chunkBox";

export type El = { id: string; kind: Kind; col?: Col; g?: number; r?: number; n?: number };

export const ELEMENTS: El[] = [
  // Containers first so they render underneath the blocks they outline.
  ...GROUPS.map((_, g) => ({ id: `rgbox-${g}`, kind: "rgBox" as const, g })),
  ...GROUPS.flatMap((_, g) => COLS.map((col) => ({ id: `chunkbox-${g}-${col}`, kind: "chunkBox" as const, col, g }))),
  ...COLS.map((col) => ({ id: `col-${col}`, kind: "colLabel" as const, col })),
  ...GROUPS.map((_, g) => ({ id: `rg-${g}`, kind: "rgLabel" as const, g })),
  { id: "magic-head", kind: "magic" },
  ...GROUPS.flatMap((rows, g) =>
    COLS.flatMap((col) => [
      ...(col === "city" ? [{ id: `dict-${g}`, kind: "dict" as const, col, g }] : []),
      { id: `header-${g}-${col}`, kind: "header" as const, col, g },
      ...rows.map((r) => ({ id: `cell-${col}-${r}`, kind: "cell" as const, col, g, r })),
    ]),
  ),
  { id: "footer", kind: "footer" },
  { id: "schema", kind: "schema" },
  ...GROUPS.flatMap((_, g) => COLS.map((col) => ({ id: `ptr-${g}-${col}`, kind: "ptr" as const, col, g }))),
  { id: "len", kind: "len" },
  { id: "magic-tail", kind: "magic" },
  { id: "badge-1", kind: "badge", n: 1 },
  { id: "badge-2", kind: "badge", n: 2 },
  ...GROUPS.map((_, g) => ({ id: `badge-3-${g}`, kind: "badge" as const, g, n: 3 })),
];

export const STAGE_COUNT = 7;
export const Stage = { Table: 0, Csv: 1, RowGroups: 2, Chunks: 3, Pages: 4, Footer: 5, Read: 6 } as const;
export type Stage = (typeof Stage)[keyof typeof Stage];

export type Box = { x: number; y: number; w: number; h: number; o: number };
export type Frame = { boxes: Record<string, Box>; height: number };

const ROW_H = 28;
const GAP = 4;
const LABEL_H = 16;
const CHIP_H = 24;
const RG_PAD = 10; // inside a row group outline
const CHUNK_PAD = 5; // inside a column chunk outline
const CHUNK_LABEL = 15; // label strip at the top of a chunk
const CHUNK_GAP = 10; // between column chunks
const BLOCK_GAP = 12; // between top-level sections of the file

/** Width of one value cell. Sized so the widest chunk (city with pages) fits one line. */
const slotWidth = (W: number) => Math.min(42, (W - 2 * RG_PAD - 2 * CHUNK_PAD) / 6.1);

// ---------------------------------------------------------------------------
// Grid stages: the table as you'd picture it.
// ---------------------------------------------------------------------------

function grid(W: number, split: boolean): Frame {
  const boxes: Record<string, Box> = {};
  const gridW = Math.min(W - 2 * RG_PAD, 360);
  const colW = gridW / 3;
  const x0 = (W - gridW) / 2;
  COLS.forEach((col, c) => {
    boxes[`col-${col}`] = { x: x0 + c * colW, y: 0, w: colW - GAP, h: LABEL_H, o: 1 };
  });
  let y = LABEL_H + 8;
  GROUPS.forEach((rows, g) => {
    const top = y;
    if (split) {
      boxes[`rg-${g}`] = { x: x0, y: y + 6, w: gridW, h: LABEL_H, o: 1 };
      y += LABEL_H + 12;
    }
    for (const r of rows) {
      COLS.forEach((col, c) => {
        boxes[`cell-${col}-${r}`] = { x: x0 + c * colW, y, w: colW - GAP, h: ROW_H, o: 1 };
      });
      y += ROW_H + GAP;
    }
    if (split) {
      y += RG_PAD - GAP;
      boxes[`rgbox-${g}`] = { x: x0 - RG_PAD, y: top, w: gridW + 2 * RG_PAD, h: y - top, o: 1 };
      y += BLOCK_GAP;
    }
  });
  return { boxes, height: y };
}

// ---------------------------------------------------------------------------
// The file as bytes in order, wrapped onto lines like a hex dump.
// ---------------------------------------------------------------------------

function csv(W: number): Frame {
  const boxes: Record<string, Box> = {};
  const slot = slotWidth(W);
  const perLine = Math.floor(W / slot);
  ROWS.forEach((_, r) =>
    COLS.forEach((col, c) => {
      const i = r * COLS.length + c;
      boxes[`cell-${col}-${r}`] = {
        x: (i % perLine) * slot,
        y: Math.floor(i / perLine) * (ROW_H + GAP + 4),
        w: slot - GAP,
        h: ROW_H,
        o: 1,
      };
    }),
  );
  const lines = Math.ceil((ROWS.length * COLS.length) / perLine);
  return { boxes, height: lines * (ROW_H + GAP + 4) };
}

function parquet(W: number, stage: Stage): Frame {
  const pages = stage >= Stage.Pages;
  const slot = slotWidth(W);
  const boxes: Record<string, Box> = {};
  let y = 0;

  boxes["magic-head"] = { x: 0, y, w: 1.5 * slot - GAP, h: ROW_H, o: 1 };
  y += ROW_H + BLOCK_GAP;

  const chunkH = CHUNK_LABEL + ROW_H + 2 * CHUNK_PAD;
  GROUPS.forEach((rows, g) => {
    const top = y;
    boxes[`rg-${g}`] = { x: RG_PAD, y: y + 6, w: W - 2 * RG_PAD, h: LABEL_H, o: 1 };
    y += LABEL_H + 12;

    let x = RG_PAD;
    for (const col of COLS) {
      const items: [string, number][] = [];
      if (pages && col === "city") items.push([`dict-${g}`, 1.5]);
      if (pages) items.push([`header-${g}-${col}`, 0.6]);
      for (const r of rows) items.push([`cell-${col}-${r}`, 1]);

      const w = items.reduce((n, [, u]) => n + u * slot, 0) + 2 * CHUNK_PAD - GAP;
      if (x > RG_PAD && x + w > W - RG_PAD) {
        x = RG_PAD;
        y += chunkH + CHUNK_GAP;
      }
      boxes[`chunkbox-${g}-${col}`] = { x, y, w, h: chunkH, o: 1 };
      let ix = x + CHUNK_PAD;
      for (const [id, u] of items) {
        boxes[id] = { x: ix, y: y + CHUNK_LABEL + CHUNK_PAD, w: u * slot - GAP, h: ROW_H, o: 1 };
        ix += u * slot;
      }
      x += w + CHUNK_GAP;
    }
    y += chunkH + RG_PAD;
    boxes[`rgbox-${g}`] = { x: 0, y: top, w: W, h: y - top, o: 1 };
    y += BLOCK_GAP;
  });

  // Footer: collapsed to one line, or opened up to show what it indexes.
  const open = stage >= Stage.Footer;
  const pad = 10;
  const chipGap = 6;
  const chipW = (W - 2 * pad - 2 * chipGap) / 3;
  const footerY = y;
  const footerH = open ? pad + LABEL_H + 8 + 2 * CHIP_H + chipGap + pad : ROW_H + 4;
  boxes.footer = { x: 0, y: footerY, w: W, h: footerH, o: 1 };
  boxes.schema = { x: pad, y: footerY + pad, w: W - 2 * pad, h: LABEL_H, o: open ? 1 : 0 };
  GROUPS.forEach((_, g) => {
    COLS.forEach((col, c) => {
      boxes[`ptr-${g}-${col}`] = {
        x: pad + c * (chipW + chipGap),
        y: footerY + pad + LABEL_H + 8 + g * (CHIP_H + chipGap),
        w: chipW,
        h: CHIP_H,
        o: open ? 1 : 0,
      };
    });
  });

  const tailY = footerY + footerH + BLOCK_GAP;
  boxes.len = { x: 0, y: tailY, w: 1.5 * slot - GAP, h: ROW_H, o: 1 };
  boxes["magic-tail"] = { x: 1.5 * slot, y: tailY, w: 1.5 * slot - GAP, h: ROW_H, o: 1 };

  if (stage === Stage.Read) {
    const read = (id: string) =>
      id === "footer" ||
      id === "schema" ||
      id === "len" ||
      id === "magic-tail" ||
      id.startsWith("ptr-") ||
      id.startsWith("cell-temp-") ||
      /^(header|chunkbox)-\d-temp$/.test(id);
    for (const [id, b] of Object.entries(boxes)) if (!read(id)) b.o = 0.15;
    const badge = (id: string, at: Box) => {
      boxes[id] = { x: at.x + at.w - 10, y: at.y - 8, w: 18, h: 18, o: 1 };
    };
    badge("badge-1", boxes["magic-tail"]);
    badge("badge-2", boxes.footer);
    GROUPS.forEach((_, g) => badge(`badge-3-${g}`, boxes[`chunkbox-${g}-temp`]));
  }

  return { boxes, height: tailY + ROW_H + 10 };
}

function frame(stage: Stage, W: number): Frame {
  switch (stage) {
    case Stage.Table:
      return grid(W, false);
    case Stage.Csv:
      return csv(W);
    case Stage.RowGroups:
      return grid(W, true);
    default:
      return parquet(W, stage);
  }
}

/**
 * All stages at width W. Elements a stage doesn't use are parked, invisible,
 * where they last were (or will next be), so they fade in and out in place
 * instead of flying in from the corner.
 */
export function frames(W: number): Frame[] {
  const out = Array.from({ length: STAGE_COUNT }, (_, s) => frame(s as Stage, W));
  for (const el of ELEMENTS) {
    for (let s = 0; s < STAGE_COUNT; s++) {
      if (out[s].boxes[el.id]) continue;
      const near =
        [...Array(s).keys()].reverse().find((t) => out[t].boxes[el.id]) ??
        [...Array(STAGE_COUNT).keys()].slice(s + 1).find((t) => out[t].boxes[el.id]);
      const from = near === undefined ? { x: 0, y: 0, w: 0, h: 0, o: 0 } : out[near].boxes[el.id];
      out[s].boxes[el.id] = { ...from, o: 0 };
    }
  }
  return out;
}
