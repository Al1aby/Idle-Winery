import { useGameStore } from '@/hooks/useGameState';
import { IAP_LIST } from '@/constants/game';
import { ShopBG } from '@/scenes';

export default function ShopScreen() {
  const { iapOwned, notify } = useGameStore(s => ({
    iapOwned: s.iapOwned,
    notify:   s.notify,
  }));

  const purchase = (item) => {
    // In production: wire to RevenueCat / Apple IAP / Google Play Billing
    // For now, grant the item immediately in dev mode
    if (iapOwned.includes(item.id) && item.once) return;
    useGameStore.setState(s => {
      const next = {
        iapOwned: [...s.iapOwned, item.id],
        money:    s.money + (item.money || 0),
        grapes:   s.grapes + (item.grapes || 0),
        wine:     s.wine + (item.wine || 0),
        fame:     s.fame + (item.fame || 0),
      };
      if (item.unlockV) next.unlockedVarieties = [...s.unlockedVarieties, item.unlockV];
      if (item.unlockAll) next.unlockedVarieties = ['chardonnay','merlot','riesling','cabernet'];
      if (item.flag) next[item.flag] = true;
      return next;
    });
    notify(`✅ ${item.name} purchased!`);
  };

  return (
    <div className="screen">
      <ShopBG />
      <div className="screen-content">
        <h2 className="screen-title">🛍️ Boutique</h2>
        <p className="screen-subtitle">Support the winery</p>

        <div className="iap-list">
          {IAP_LIST.map(item => {
            const owned = iapOwned.includes(item.id);
            return (
              <div key={item.id} className={`iap-card ${owned && item.once ? 'owned' : ''}`}>
                <div className="iap-info">
                  <div className="iap-name">{item.name}</div>
                  <div className="iap-desc">{item.desc}</div>
                </div>
                <button
                  className={`iap-btn ${owned && item.once ? 'owned' : ''}`}
                  onClick={() => purchase(item)}
                  disabled={owned && item.once}
                >
                  {owned && item.once ? '✓ Owned' : item.price}
                </button>
              </div>
            );
          })}
        </div>

        <p className="shop-note">
          💡 Purchases are simulated in dev mode. Wire to your IAP provider before shipping.
        </p>
      </div>
    </div>
  );
}
