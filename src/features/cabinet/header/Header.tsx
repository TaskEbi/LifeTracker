import { useMemo } from 'react';
import { clearExamples, hasExamples } from '../../../data/seed';
import { data, liveItems } from '../../../data/store';
import { setFilters, setView, toast, ui } from '../../../data/ui';
import type { ViewName } from '../../../data/types';
import { useStore } from '../../../lib/createStore';
import { plural } from '../../../lib/format';
import { Icon, type IconName } from '../../../ui/Icon';
import { InlineConfirm } from '../../../ui/InlineConfirm';
import { QuickAddBar } from '../capture/QuickAddBar';
import { surprise } from '../app/surprise';
import './header.css';

const VIEWS: { id: ViewName; label: string; icon: IconName }[] = [
  { id: 'shelves', label: 'Shelves', icon: 'shelves' },
  { id: 'collage', label: 'Collage', icon: 'collage' },
  { id: 'map', label: 'String Map', icon: 'map' },
  { id: 'mind', label: 'Mind Map 3D', icon: 'orbit' },
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** The cabinet's own menu. Appearance, sign-in and sync live in LifeTracker's settings. */
function Menu() {
  const examples = useStore(data, (s) => (s.items.size ? hasExamples() : false));
  return (
    <>
      <button type="button" className="btn btn--ghost btn--icon" popoverTarget="cabinet-menu" aria-label="Cabinet menu">
        <Icon name="menu" />
      </button>
      <div id="cabinet-menu" popover="auto" className="menu">
        <button type="button" className="menu__item" onClick={() => ui.set({ commandOpen: true })} popoverTarget="cabinet-menu" popoverTargetAction="hide">
          <Icon name="search" size={15} /> Jump to… <kbd className="menu__kbd type">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
        </button>
        <button type="button" className="menu__item" onClick={() => ui.set({ roomsOpen: true })} popoverTarget="cabinet-menu" popoverTargetAction="hide">
          Manage rooms
        </button>
        <button type="button" className="menu__item" onClick={() => ui.set({ backOfficeOpen: true })} popoverTarget="cabinet-menu" popoverTargetAction="hide">
          Back office: bookmarklet, phone app, export
        </button>
        {examples && (
          <div className="menu__group">
            <span className="menu__label type">Example exhibits</span>
            <InlineConfirm
              label="Clear examples"
              className="menu__item"
              message="Remove all example items?"
              confirmLabel="Clear"
              onConfirm={() => {
                clearExamples();
                toast('Examples cleared');
              }}
            />
          </div>
        )}
        <p className="menu__keys type">N add · / search · R wander · Esc close · 1 2 3 4 views · ← → step through exhibits</p>
      </div>
    </>
  );
}

export function Header({ filterCount }: { filterCount: number }) {
  const view = useStore(ui, (s) => s.view);
  const q = useStore(ui, (s) => s.filters.q);
  const itemsMap = useStore(data, (s) => s.items);
  const count = useMemo(() => liveItems(itemsMap).length, [itemsMap]);

  return (
    <header className="app-header">
      <div className="app-header__top">
        <div className="museum-name">
          <span className="cab-code">CH09 · collection</span>
          <h1 className="cab-title">Cabinet</h1>
          <p className="museum-name__sub">{plural(count, 'thing', 'things')} saved</p>
        </div>
        <nav className="view-tabs" aria-label="Cabinet views">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" className="view-tab" aria-current={view === v.id ? 'page' : undefined} onClick={() => setView(v.id)}>
              <Icon name={v.icon} size={16} />
              <span>{v.label}</span>
            </button>
          ))}
        </nav>
        <div className="app-header__tools">
          <Menu />
        </div>
      </div>
      <div className="app-header__bar">
        <QuickAddBar />
        <div className="search">
          <Icon name="search" size={17} />
          <input
            id="search"
            className="search__input"
            type="search"
            value={q}
            onChange={(e) => setFilters({ q: e.target.value })}
            placeholder="Search the cabinet"
            aria-label="Search the cabinet (press /)"
            autoComplete="off"
          />
        </div>
        <button type="button" className="btn surprise" onClick={surprise} title="Surprise me (R)">
          <Icon name="dice" size={17} /> <span className="surprise__text">Surprise me</span>
        </button>
        <button type="button" className="btn filter-toggle" onClick={() => ui.set({ filterSheetOpen: true })}>
          <Icon name="filter" size={16} /> Filters{filterCount > 0 && <span className="filter-toggle__n">{filterCount}</span>}
        </button>
      </div>
    </header>
  );
}

