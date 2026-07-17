<script lang="ts">
  /**
   * Home wash: dither-hill.webp recolored to accent. Plate is already
   * ordered-dithered — we only remap dark pixels → #2200ff.
   * Full plate, bottom-aligned — no band crop on the peaks.
   */
  import { onMount } from "svelte";
  import { reduceMotion } from "./effects/shared";
  import hillsUrl from "../assets/dither-hill.webp";

  let {
    color = "#2200ff",
    /** Lateral drift; 0 = static */
    speed = 0,
    src = hillsUrl,
  }: {
    color?: string;
    speed?: number;
    src?: string;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();

  function parseHex(hex: string): [number, number, number] {
    const h = hex.replace("#", "");
    const n =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    const v = parseInt(n, 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  onMount(() => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const [cr, cg, cb] = parseHex(color);
    const staticMode = reduceMotion() || speed <= 0;
    let raf = 0;
    let ro: ResizeObserver | undefined;
    let alive = true;
    let plate: HTMLImageElement | null = null;
    let w = 0;
    let h = 0;

    const off = document.createElement("canvas");
    const octx = off.getContext("2d", { willReadFrequently: true })!;
    octx.imageSmoothingEnabled = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas!.clientWidth;
      const cssH = canvas!.clientHeight;
      if (cssW < 2 || cssH < 2) return;
      w = Math.max(1, Math.floor(cssW * dpr));
      h = Math.max(1, Math.floor(cssH * dpr));
      canvas!.width = w;
      canvas!.height = h;
      off.width = w;
      off.height = h;
    };

    const draw = (tMs = 0) => {
      if (!plate?.naturalWidth || w < 1) return;

      const nw = plate.naturalWidth;
      const nh = plate.naturalHeight;

      // Full-bleed width, keep aspect — bottom-aligned, never cropped
      const scale = w / nw;
      const dw = w;
      const dh = Math.ceil(nh * scale);
      const drift = staticMode
        ? 0
        : (((tMs / 1000) * speed * 0.12 * w) % w + w) % w;
      const dx = Math.floor(-drift);
      // Nudge below the fold a bit so the range sits lower
      const dy = h - dh + Math.floor(h * 0.15);

      octx.clearRect(0, 0, w, h);
      octx.drawImage(plate, dx, dy, dw, dh);
      if (!staticMode && drift !== 0) {
        octx.drawImage(plate, dx + dw, dy, dw, dh);
      }

      const outY = Math.max(0, dy);
      const outH = Math.min(dh, h - outY);
      const img = octx.getImageData(0, outY, w, outH);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        // Undrawn pixels are rgba(0,0,0,0) — don't treat as hill.
        if (data[i + 3] < 8) {
          data[i + 3] = 0;
          continue;
        }
        const lum =
          (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0;
        if (lum < 160) {
          data[i] = cr;
          data[i + 1] = cg;
          data[i + 2] = cb;
          data[i + 3] = 255;
        } else {
          data[i + 3] = 0;
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.putImageData(img, 0, outY);
    };

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (!alive) return;
      plate = image;
      resize();
      draw(0);
    };
    image.onerror = () => console.warn("[DitherWash] failed to load", src);
    image.src = src;

    resize();
    ro = new ResizeObserver(() => {
      resize();
      draw(0);
    });
    ro.observe(canvas);

    if (!staticMode) {
      const loop = (t: number) => {
        draw(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      image.onload = null;
      image.onerror = null;
    };
  });
</script>

<canvas
  bind:this={canvas}
  class="pointer-events-none fixed inset-0 z-0 h-full w-full"
  style="image-rendering: pixelated;"
  aria-hidden="true"
></canvas>
