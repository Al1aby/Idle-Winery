// Audio — swap the placeholder paths for real .mp3/.ogg files
// Drop audio files into src/assets/audio/ and update the src paths below
// Using Howler.js: https://howlerjs.com

import { Howl } from 'howler'

// ── Placeholder sound generator (Web Audio API fallback) ─────────────────────
// This produces the same programmatic beeps as the prototype.
// Replace each entry with: new Howl({ src: ['./assets/audio/coin.mp3'] })
// once you have real audio files.

let _ctx = null
const ac = () => {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
  return _ctx
}

function beep(freq, type, dur, vol = 0.15) {
  try {
    const ctx = ac()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = type; o.frequency.value = freq
    g.gain.setValueAtTime(vol, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    o.start(); o.stop(ctx.currentTime + dur)
  } catch (e) {}
}

export const SFX = {
  coin:    () => beep(880,  'sine',     0.12, 0.15),
  harvest: () => beep(440,  'triangle', 0.18, 0.12),
  press:   () => beep(220,  'sawtooth', 0.22, 0.10),
  bottle:  () => beep(660,  'sine',     0.15, 0.13),
  sell:    () => { beep(523, 'sine', 0.10, 0.15); setTimeout(() => beep(659, 'sine', 0.10, 0.15), 80) },
  upgrade: () => { [523,659,784].forEach((f,i) => setTimeout(() => beep(f, 'sine', 0.15, 0.18), i*70)) },
  prestige:() => { [392,494,587,784].forEach((f,i) => setTimeout(() => beep(f, 'sine', 0.25, 0.2), i*100)) },
  tab:     () => beep(330,  'sine',     0.06, 0.08),
}

// ── TODO: replace above with Howler once you have real audio ─────────────────
// Example:
//   import coinSfx from '../assets/audio/coin.mp3'
//   export const SFX = {
//     coin: new Howl({ src: [coinSfx], volume: 0.4 }),
//     ...
//   }
// Then call: SFX.coin.play()  instead of  SFX.coin()
