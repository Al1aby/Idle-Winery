// ─────────────────────────────────────────────────────────────────────────────
//  GAME LOOP
//  Uses requestAnimationFrame for smooth timing, fires logic at ~250ms intervals
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react';
import { useGameStore } from './useGameState';

const TICK_MS = 250;

export function useGameLoop() {
  const tick = useGameStore(s => s.tick);
  const lastRef = useRef(null);
  const accumRef = useRef(0);

  useEffect(() => {
    let raf;

    const loop = (ts) => {
      if (lastRef.current !== null) {
        const elapsed = ts - lastRef.current;
        accumRef.current += elapsed;

        // Fire game logic ticks
        while (accumRef.current >= TICK_MS) {
          tick(TICK_MS / 1000); // pass seconds
          accumRef.current -= TICK_MS;
        }
      }
      lastRef.current = ts;
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick]);
}
