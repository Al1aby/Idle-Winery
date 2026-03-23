import { useGameStore } from '@/hooks/useGameState';
import { useGameLoop }  from '@/hooks/useGameLoop';

import HUD            from '@/components/HUD';
import TabBar         from '@/components/TabBar';
import Notification   from '@/components/Notification';
import VisitorModal   from '@/components/VisitorModal';

import HomeScreen     from '@/components/screens/HomeScreen';
import VineyardScreen from '@/components/screens/VineyardScreen';
import PressScreen    from '@/components/screens/PressScreen';
import CellarScreen   from '@/components/screens/CellarScreen';
import ExportScreen   from '@/components/screens/ExportScreen';
import LabScreen      from '@/components/screens/LabScreen';
import EventsScreen   from '@/components/screens/EventsScreen';
import ShopScreen     from '@/components/screens/ShopScreen';
import PrestigeScreen from '@/components/screens/PrestigeScreen';

const SCREENS = {
  home:     HomeScreen,
  vineyard: VineyardScreen,
  press:    PressScreen,
  cellar:   CellarScreen,
  export:   ExportScreen,
  lab:      LabScreen,
  events:   EventsScreen,
  shop:     ShopScreen,
  prestige: PrestigeScreen,
};

export default function App() {
  useGameLoop();
  const tab = useGameStore(s => s.tab);
  const Screen = SCREENS[tab] || HomeScreen;

  return (
    <div className="app">
      <HUD />
      <main className="main">
        <Screen />
      </main>
      <TabBar />
      <Notification />
      <VisitorModal />
    </div>
  );
}
