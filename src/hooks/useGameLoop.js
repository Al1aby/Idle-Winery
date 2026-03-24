import { useEffect } from 'react';
import { useGameStore } from './useGameState';

const TICK_MS = 250;

export function useGameLoop() {
  useEffect(() => {
    const id = setInterval(() => {
      useGameStore.getState().tick()
    }, TICK_MS)
    return () => clearInterval(id)
  }, [])
}
