/**
 * CH09 · Cabinet: Curio Cabinet's collection (shelves, collage, string map, mind map, drawer,
 * capture, rooms, strings) running inside LifeTracker on the same records.
 */
import { useDeferredValue, useEffect, useMemo } from 'react';
import { activeFilterCount, applyFilters, facetCounts } from '../../data/filter';
import { seedExamples } from '../../data/seed';
import { allTags, data, liveItems, liveRooms } from '../../data/store';
import { ui } from '../../data/ui';
import { useStore } from '../../lib/createStore';
import { flushSync } from '../../app/syncHandle';
import { ChannelBar } from '../../app/Shell';
import { HomeLink } from '../../ui/i/ChannelHead';
import { AddSheet } from './capture/AddSheet';
import { DetailDrawer } from './drawer/DetailDrawer';
import { Filters } from './filters/Filters';
import { Header } from './header/Header';
import { RoomsManager } from './rooms/RoomsManager';
import { ShelvesView } from './shelves/ShelvesView';
import { StringMap } from './map/StringMap';
import { MindMap } from './mind/MindMap';
import { Collage } from './collage/Collage';
import { Sheet } from '../../ui/Sheet';
import { ExamplesNotice } from './app/ExamplesNotice';
import { useShortcuts } from './app/useShortcuts';
import { useCapture } from './app/useCapture';
import { takeShare } from './app/share';
import { BackOffice } from './backoffice/BackOffice';
import { CommandPalette } from './command/CommandPalette';
import './styles/tokens.css';
import './styles/palettes.css';
import './styles/designs.css';
import './styles/base.css';
import './app/app.css';
import './instrument.css';
import './theme.css';

/**
 * The cabinet keeps Curio Cabinet's own personality: the palette, design and day/night setting
 * chosen in Curio Cabinet (shared settings row). LifeTracker's colour theme comes back on the way out.
 */
function useCabinetLook() {
  const look = useStore(data, (s) => s.settings);
  const dark = look.theme === 'dark' || (look.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    ui.set({ section: 'cabinet' });
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    const prev = { palette: root.dataset.palette, design: root.dataset.design, mode: root.dataset.mode };
    root.dataset.palette = look.palette;
    root.dataset.design = look.design;
    root.dataset.mode = dark ? 'dark' : 'light';
    return () => {
      for (const k of ['palette', 'design', 'mode'] as const) {
        if (prev[k]) root.dataset[k] = prev[k];
        else delete root.dataset[k];
      }
    };
  }, [look.palette, look.design, dark]);
}

/** An empty cabinet that has never had examples gets them once (they are marked and easy to clear). */
function useSeedOnce() {
  useEffect(() => {
    const st = data.get();
    const synced = st.mode === 'synced';
    if (!(synced && st.sync.status !== 'idle') && !st.settings.examples_seeded && st.items.size === 0 && st.rooms.size === 0) seedExamples();
    void takeShare(() => flushSync());
  }, []);
}

export default function CabinetChannel() {
  useCabinetLook();
  useSeedOnce();
  useShortcuts();
  const dragging = useCapture();

  const itemsMap = useStore(data, (s) => s.items);
  const roomsMap = useStore(data, (s) => s.rooms);
  const filters = useDeferredValue(useStore(ui, (s) => s.filters));
  const view = useStore(ui, (s) => s.view);
  const sheet = useStore(ui, (s) => s.sheet);
  const openItemId = useStore(ui, (s) => s.openItemId);
  const roomsOpen = useStore(ui, (s) => s.roomsOpen);
  const filterSheetOpen = useStore(ui, (s) => s.filterSheetOpen);
  const backOfficeOpen = useStore(ui, (s) => s.backOfficeOpen);
  const commandOpen = useStore(ui, (s) => s.commandOpen);

  const items = liveItems(itemsMap);
  const rooms = liveRooms(roomsMap);
  const tags = allTags(itemsMap);
  const roomById = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);
  const visible = useMemo(() => applyFilters(items, filters, roomById), [items, filters, roomById]);
  const sequence = useMemo(() => visible.map((i) => i.id), [visible]);
  const counts = useMemo(() => facetCounts(items, filters, roomById), [items, filters, roomById]);
  const filterCount = activeFilterCount(filters);
  const filtersPanel = <Filters counts={counts} rooms={rooms} tags={tags} />;

  return (
    <div className="cabinet app">
      <div className="cabinet-top">
        <ChannelBar current="cabinet" />
        <HomeLink />
      </div>
      <Header filterCount={filterCount} />
      <div className="app__body">
        <aside className="sidebar" aria-label="Filters">
          {filtersPanel}
        </aside>
        <main className="app__main" id="main">
          {view === 'shelves' && <ExamplesNotice />}
          {view === 'shelves' && <ShelvesView items={visible} rooms={roomById} total={items.length} />}
          {view === 'collage' && <Collage items={visible} rooms={roomById} />}
          {view === 'map' && <StringMap items={visible} rooms={roomById} />}
          {view === 'mind' && <MindMap items={visible} rooms={roomById} />}
        </main>
      </div>
      {filterSheetOpen && (
        <Sheet title="Filters" variant="bottom" onClose={() => ui.set({ filterSheetOpen: false })}>
          {filtersPanel}
        </Sheet>
      )}
      {roomsOpen && <RoomsManager />}
      {backOfficeOpen && <BackOffice />}
      {dragging && (
        <div className="drop-overlay" aria-hidden="true">
          <p className="drop-overlay__label hand">Drop it in the cabinet</p>
        </div>
      )}
      {openItemId && <DetailDrawer id={openItemId} sequence={sequence} />}
      {sheet && <AddSheet key={sheet.editId ?? 'new'} draft={sheet.draft} editId={sheet.editId} file={sheet.file} />}
      {commandOpen && <CommandPalette />}
    </div>
  );
}
