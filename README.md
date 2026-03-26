# 🍇 Vineyard Idle

A mobile idle game built with React + Vite + Zustand.

---

## Project Structure

```
src/
├── constants/
│   └── game.js          # All game data: varieties, upgrades, cities, events
├── audio/
│   └── sfx.js           # Web Audio SFX (swap for Howler when you have real audio)
├── hooks/
│   ├── useGameState.js  # Zustand store — all game state + actions
│   └── useGameLoop.js   # rAF-based 250ms tick
├── scenes/
│   ├── makeBG.js        # Canvas BG factory + SpriteBG component
│   ├── index.js         # Barrel exports for all 9 scenes
│   ├── HomeBG.jsx       # ← paste draw function here (or swap for SpriteBG)
│   ├── VineyardBG.jsx
│   ├── PressHouseBG.jsx
│   ├── CellarBG.jsx
│   ├── ExportBG.jsx
│   ├── LabBG.jsx
│   ├── EventsBG.jsx
│   ├── ShopBG.jsx
│   └── PrestigeBG.jsx
├── components/
│   ├── HUD.jsx
│   ├── TabBar.jsx
│   ├── Notification.jsx
│   ├── VisitorModal.jsx
│   └── screens/
│       ├── HomeScreen.jsx
│       ├── VineyardScreen.jsx
│       ├── PressScreen.jsx
│       ├── CellarScreen.jsx
│       ├── ExportScreen.jsx
│       ├── LabScreen.jsx
│       ├── EventsScreen.jsx
│       ├── ShopScreen.jsx
│       └── PrestigeScreen.jsx
├── styles/
│   └── global.css
├── App.jsx
└── main.jsx
```

---

## Migrating the Canvas Backgrounds

Each scene stub in `src/scenes/` currently shows a placeholder gradient.
To restore the full canvas drawings from the prototype:

1. Open `VineyardIdle.jsx` (the Claude prototype)
2. Find e.g. `const HomeBG=makeBG(({ctx,BW,BH,...})=>{`
3. Copy everything inside `makeBG(` — the `({...})=>{ ... }` argument
4. Paste it into `src/scenes/HomeBG.jsx` as the argument to `makeBG()`

```js
// src/scenes/HomeBG.jsx
import { makeBG } from './makeBG';

export const HomeBG = makeBG(({ ctx, BW, BH, linGrad, fillRect, ... }) => {
  // ← paste draw code here
});
```

---

## Swapping in Real Art

Once you have actual background images, replacing the canvas is one line per scene:

```js
// src/scenes/CellarBG.jsx
import { SpriteBG } from './makeBG';
export const CellarBG = () => <SpriteBG src="/assets/backgrounds/cellar.jpg" />;
```

Drop images in `public/assets/backgrounds/` and Vite serves them with no config.

**Recommended art pipeline:**
- Generate with Midjourney / DALL-E 3 at 1024×768, export as JPG ~150KB
- Or use Aseprite for pixel art sprites (export as PNG spritesheets)
- Sprite sheets: use `makeBG` factory but draw with `ctx.drawImage()` instead of the canvas helpers

---

## Adding Real Audio

The `src/audio/sfx.js` module uses Web Audio API procedurally.
To upgrade to real sound files with Howler:

```bash
npm install howler
```

```js
// src/audio/sfx.js
import { Howl } from 'howler';

const sounds = {
  harvest: new Howl({ src: ['/assets/audio/harvest.wav'], volume: 0.6 }),
  coin:    new Howl({ src: ['/assets/audio/coin.wav'],    volume: 0.5 }),
  press:   new Howl({ src: ['/assets/audio/press.wav'],   volume: 0.4 }),
};

export const SFX = {
  harvest: () => sounds.harvest.play(),
  coin:    () => sounds.coin.play(),
  press:   () => sounds.press.play(),
  pop:     () => sounds.coin.play(),
  click:   () => sounds.coin.play(),
  levelUp: () => sounds.coin.play(),
};
```

For background music, add a `BGM` export using Howler's `loop: true`.

---

## Adding IAP (In-App Purchases)

The `ShopScreen` currently simulates purchases instantly (dev mode).
For production, wire `purchase()` in `ShopScreen.jsx` to your IAP SDK:

- **React Native / Expo**: `react-native-purchases` (RevenueCat)
- **Capacitor (iOS/Android from web)**: `@capacitor/core` + `capacitor-purchases`
- **Web**: Stripe Checkout

RevenueCat is recommended — it handles Apple + Google receipts, entitlements,
and restore purchases with one SDK.

---

## Deploying to Mobile

### PWA (easiest)
```bash
npm run build
# Deploy dist/ to Vercel, Netlify, or Cloudflare Pages
# Add to home screen on iOS/Android — gets full-screen mode
```

Add `vite-plugin-pwa` for offline support and install prompt.

### Capacitor (native app store)
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init
npm run build
npx cap add ios
npx cap add android
npx cap sync
npx cap open ios   # opens Xcode
npx cap open android  # opens Android Studio
```

---

## Save System

Game state is auto-persisted to `localStorage` via Zustand's `persist` middleware.
The `partialize` function in `useGameState.js` controls exactly what gets saved —
currently: money, grapes, wine, fame, prestige, upgrades, staff, varieties, IAP.

For cloud saves (cross-device), replace the `storage` option in `persist()` with
a custom adapter that syncs to your backend or Firebase.

---

## Git Setup

```bash
git init
git add .
git commit -m "Initial scaffold"
gh repo create vineyard-idle --public
git remote add origin https://github.com/YOUR_USERNAME/vineyard-idle.git
git push -u origin main
```
