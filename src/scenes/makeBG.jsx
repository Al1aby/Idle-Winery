// ─────────────────────────────────────────────────────────────────────────────
//  BACKGROUND FACTORY
//  Each scene is a React component produced by makeBG(drawFn).
//  drawFn receives the canvas context plus a full set of drawing helpers.
//  Swap the canvas draw for an <img> or sprite sheet whenever art is ready.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react';

export const BW = 420;
export const BH = 340;

export function makeBG(drawFn) {
  return function SceneBG({ style }) {
    const ref = useRef(null);

    useEffect(() => {
      const cv = ref.current;
      if (!cv) return;
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, BW, BH);

      // ── noise helpers ──────────────────────────────────────────────────
      const noise = (x, y) => (((Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1) + 1) % 1;
      const fbm = (x, y, oct = 4) => {
        let v = 0, a = 0.5, f = 1;
        for (let i = 0; i < oct; i++) { v += a * noise(x * f, y * f); a *= 0.5; f *= 2.1; }
        return v;
      };

      // ── canvas helpers ─────────────────────────────────────────────────
      const linGrad = (x1, y1, x2, y2, stops) => {
        const g = ctx.createLinearGradient(x1, y1, x2, y2);
        stops.forEach(([t, c]) => g.addColorStop(t, c));
        return g;
      };
      const radGrad = (x, y, r1, x2, y2, r2, stops) => {
        const g = ctx.createRadialGradient(x, y, r1, x2, y2, r2);
        stops.forEach(([t, c]) => g.addColorStop(t, c));
        return g;
      };
      const fillRect = (x, y, w, h, fill) => { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); };
      const circle = (x, y, r, fill) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); };
      const glow = (x, y, r, color, a = 0.8) => {
        const g = radGrad(x, y, 0, x, y, r, [[0, color], [1, 'rgba(0,0,0,0)']]);
        ctx.save(); ctx.globalAlpha = a; circle(x, y, r, g); ctx.restore();
      };
      const blur = (px) => { ctx.filter = `blur(${px}px)`; };
      const noBlur = () => { ctx.filter = 'none'; };
      const shadow = (color, size) => { ctx.shadowColor = color; ctx.shadowBlur = size; };
      const noShadow = () => { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; };
      const save = () => ctx.save();
      const restore = () => ctx.restore();
      const alpha = (a) => { ctx.globalAlpha = a; };
      const composite = (mode) => { ctx.globalCompositeOperation = mode; };
      const resetComposite = () => { ctx.globalCompositeOperation = 'source-over'; };
      const clip = (fn) => { ctx.save(); ctx.beginPath(); fn(); ctx.clip(); };

      // ── ImageData noise overlay ────────────────────────────────────────
      const noiseLayer = (x0, y0, w, h, scale = 0.05, strength = 30, colorFn) => {
        const id = ctx.getImageData(x0, y0, w, h);
        const d = id.data;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const n = fbm((x0 + x) * scale, (y0 + y) * scale) * strength;
            const i = (y * w + x) * 4;
            if (colorFn) {
              const [r, g, b, a] = colorFn(x, y, n, d[i], d[i+1], d[i+2]);
              d[i] = r; d[i+1] = g; d[i+2] = b;
              if (a !== undefined) d[i+3] = a;
            } else {
              d[i]   = Math.min(255, d[i]   + ~~n);
              d[i+1] = Math.min(255, d[i+1] + ~~n);
              d[i+2] = Math.min(255, d[i+2] + ~~n);
            }
          }
        }
        ctx.putImageData(id, x0, y0);
      };

      drawFn({ ctx, BW, BH, noise, fbm, linGrad, radGrad, fillRect, circle, glow, blur, noBlur, shadow, noShadow, save, restore, alpha, composite, resetComposite, clip, noiseLayer });
    }, []);

    return (
      <canvas
        ref={ref}
        width={BW}
        height={BH}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          ...style,
        }}
      />
    );
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  SPRITE BACKGROUND — drop-in replacement once you have real art
//  Usage: <SpriteBG src="/assets/backgrounds/cellar.jpg" />
// ─────────────────────────────────────────────────────────────────────────────
export function SpriteBG({ src, style }) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const fullSrc = src.startsWith('/') ? `${base}${src}` : src
  return (
    <img
      src={fullSrc}
      alt=""
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center bottom',
        ...style,
      }}
    />
  );
}
