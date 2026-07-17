<script lang="ts">
  import { onMount } from "svelte";
  import { reduceMotion } from "./effects/shared";
  import hillsUrl from "../assets/dither-hill.webp";

  let {
    color = "#2200ff",
    speed = 0,
    fadeMs = 2200,
    strength = 0.22,
    src = hillsUrl,
  }: {
    color?: string;
    speed?: number;
    fadeMs?: number;
    strength?: number;
    src?: string;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let ready = $state(false);
  const motionOk = !reduceMotion();

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
    const el = canvas;
    if (!el) return;
    const ctx = el.getContext("2d", { alpha: true });
    if (!ctx) return;

    const [cr, cg, cb] = parseHex(color);
    const inkA = Math.max(0, Math.min(255, Math.round(strength * 255)));
    const staticMode = !motionOk || speed <= 0;
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
      const cssW = el.clientWidth;
      const cssH = el.clientHeight;
      if (cssW < 2 || cssH < 2) return;
      w = Math.max(1, Math.floor(cssW * dpr));
      h = Math.max(1, Math.floor(cssH * dpr));
      el.width = w;
      el.height = h;
      off.width = w;
      off.height = h;
    };

    const draw = (tMs = 0) => {
      if (!plate?.naturalWidth || w < 1) return;

      const nw = plate.naturalWidth;
      const nh = plate.naturalHeight;
      const maxH = h * 0.48;
      const dw = w;
      const dh = Math.max(1, Math.min(Math.ceil(nh * (w / nw)), Math.floor(maxH)));
      const drift = staticMode
        ? 0
        : ((((tMs / 1000) * speed * 0.12 * dw) % dw) + dw) % dw;
      const dx = Math.floor(-drift);
      const dy = h - dh + Math.floor(h * 0.04);

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
          data[i + 3] = inkA;
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
      requestAnimationFrame(() => {
        if (alive) ready = true;
      });
    };
    image.onerror = () => console.warn("[DitherWash] failed to load", src);
    image.src = src;

    resize();
    ro = new ResizeObserver(() => {
      resize();
      draw(0);
    });
    ro.observe(el);

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
  style="image-rendering: pixelated; opacity: {ready
    ? 1
    : 0}; transition: opacity {motionOk ? fadeMs : 0}ms ease-out;"
  aria-hidden="true"
></canvas>
